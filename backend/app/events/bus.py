"""Lightweight In-Memory Async Event Bus & Background Task Queue.

Thiết kế Event Bus bất đồng bộ tối giản, tin cậy cao:
- Không dùng Kafka/RabbitMQ cồng kềnh
- Vận hành trên asyncio.Queue và native coroutines
- Hỗ trợ Pub/Sub đa kênh (multi-subscriber) và wildcard '*'
- Cơ chế Retry có backoff và Dead-Letter Queue (DLQ)
- Ring-buffer ghi log chẩn đoán và theo dõi metrics thời gian thực
"""

from __future__ import annotations

import asyncio
import inspect
import logging
import time
from collections import deque
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, Dict, List, Optional, Union

from backend.app.events.schemas import DomainEvent

logger = logging.getLogger("events.bus")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

EventHandler = Union[
    Callable[[DomainEvent], Awaitable[None]],
    Callable[[DomainEvent], None],
]


class EventBus:
    """Async In-Memory Event Bus & Background Task Queue."""

    def __init__(
        self,
        queue_maxsize: int = 5000,
        worker_concurrency: int = 2,
        max_retries: int = 3,
        history_size: int = 200,
    ):
        self.queue_maxsize = queue_maxsize
        self.worker_concurrency = worker_concurrency
        self.max_retries = max_retries
        self.history_size = history_size

        self._queue: Optional[asyncio.Queue[DomainEvent]] = None
        self._subscribers: Dict[str, List[EventHandler]] = {}
        self._workers: List[asyncio.Task] = []
        self._running = False
        self._started_at: Optional[float] = None

        # Metrics
        self._total_published = 0
        self._total_processed = 0
        self._total_failed = 0
        self._dead_letter_queue: deque[Dict[str, Any]] = deque(maxlen=200)
        self._recent_events: deque[Dict[str, Any]] = deque(maxlen=history_size)

    @property
    def is_running(self) -> bool:
        return self._running

    def _get_queue(self) -> asyncio.Queue[DomainEvent]:
        if self._queue is None:
            self._queue = asyncio.Queue(maxsize=self.queue_maxsize)
        return self._queue

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        """Đăng ký subscriber cho loại event cụ thể hoặc '*' (tất cả event)."""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        if handler not in self._subscribers[event_type]:
            self._subscribers[event_type].append(handler)
            logger.debug(f"[EventBus] Subscribed {getattr(handler, '__name__', str(handler))} to '{event_type}'")

    def unsubscribe(self, event_type: str, handler: EventHandler) -> None:
        """Hủy đăng ký subscriber."""
        if event_type in self._subscribers and handler in self._subscribers[event_type]:
            self._subscribers[event_type].remove(handler)

    async def start(self) -> None:
        """Khởi động worker loop xử lý event background."""
        if self._running:
            return

        self._running = True
        self._started_at = time.time()
        self._get_queue()

        for i in range(self.worker_concurrency):
            task = asyncio.create_task(self._worker_loop(f"worker-{i+1}"))
            self._workers.append(task)
        logger.info(f"[EventBus] Started with {self.worker_concurrency} worker(s)")

    async def stop(self, drain: bool = True) -> None:
        """Dừng Event Bus có kiểm soát (graceful shutdown)."""
        if not self._running:
            return

        logger.info("[EventBus] Stopping...")
        if drain and self._queue is not None and not self._queue.empty():
            logger.info(f"[EventBus] Draining remaining {self._queue.qsize()} events...")
            await self.drain()

        self._running = False
        for worker in self._workers:
            worker.cancel()

        await asyncio.gather(*self._workers, return_exceptions=True)
        self._workers.clear()
        logger.info("[EventBus] Stopped cleanly.")

    async def drain(self, timeout: float = 5.0) -> None:
        """Chờ xử lý hết toàn bộ event đang tồn đọng trong queue."""
        q = self._get_queue()
        try:
            await asyncio.wait_for(q.join(), timeout=timeout)
        except asyncio.TimeoutError:
            pass

    async def publish(self, event: DomainEvent) -> str:
        """Đẩy event vào hàng đợi bất đồng bộ non-blocking (O(1))."""
        q = self._get_queue()
        self._total_published += 1

        # Ghi nhận vào recent ring-buffer
        self._record_recent(event, status="enqueued")

        try:
            q.put_nowait(event)
        except asyncio.QueueFull:
            logger.error(f"[EventBus] Queue full ({self.queue_maxsize})! Event {event.id} dropped to DLQ.")
            self._total_failed += 1
            self._dead_letter_queue.append({
                "event": event.model_dump(),
                "reason": "QueueFull",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            raise RuntimeError("EventBus queue full")

        return event.id

    async def publish_now(self, event: DomainEvent) -> Dict[str, Any]:
        """Dispatch và thực thi ngay lập tức cho tất cả subscribers (dùng cho sync flow hoặc tests)."""
        self._total_published += 1
        result = await self._dispatch_to_subscribers(event)
        return result

    async def _worker_loop(self, worker_name: str) -> None:
        """Vòng lặp consumer lấy event từ queue và gọi các subscriber."""
        q = self._get_queue()
        logger.debug(f"[EventBus] {worker_name} started.")

        while self._running:
            try:
                event = await asyncio.wait_for(q.get(), timeout=1.0)
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break

            try:
                await self._process_with_retries(event)
            finally:
                q.task_done()

        logger.debug(f"[EventBus] {worker_name} exited.")

    async def _process_with_retries(self, event: DomainEvent) -> None:
        """Thực thi event với chính sách retry."""
        attempt = 0
        success = False
        last_error = None

        while attempt <= self.max_retries and not success:
            try:
                await self._dispatch_to_subscribers(event)
                success = True
                self._total_processed += 1
                self._record_recent(event, status="processed")
            except Exception as e:
                attempt += 1
                last_error = e
                logger.warning(f"[EventBus] Event {event.id} ({event.type}) failed attempt {attempt}: {e}")
                if attempt <= self.max_retries:
                    await asyncio.sleep(0.05 * (2 ** (attempt - 1)))  # Exponential backoff

        if not success:
            self._total_failed += 1
            logger.error(f"[EventBus] Event {event.id} ({event.type}) exhausted {self.max_retries} retries.")
            self._dead_letter_queue.append({
                "event": event.model_dump(),
                "reason": str(last_error),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "attempts": attempt,
            })
            self._record_recent(event, status="dead_letter", error=str(last_error))

    async def _dispatch_to_subscribers(self, event: DomainEvent) -> Dict[str, Any]:
        """Tìm và gọi tất cả handlers khớp với event.type hoặc '*'."""
        handlers: List[EventHandler] = []
        # Handlers cụ thể theo type
        if event.type in self._subscribers:
            handlers.extend(self._subscribers[event.type])
        # Handlers dạng wildcard '*'
        if "*" in self._subscribers:
            handlers.extend(self._subscribers["*"])

        executed_count = 0
        errors: List[str] = []

        for handler in handlers:
            try:
                if inspect.iscoroutinefunction(handler):
                    await handler(event)
                else:
                    handler(event)
                executed_count += 1
            except Exception as exc:
                handler_name = getattr(handler, "__name__", str(handler))
                err_msg = f"Handler '{handler_name}' error: {exc}"
                logger.exception(f"[EventBus] {err_msg}")
                errors.append(err_msg)

        if errors:
            raise RuntimeError(f"Errors in {len(errors)} handler(s): {'; '.join(errors)}")

        return {
            "event_id": event.id,
            "type": event.type,
            "subscribers_called": executed_count,
            "success": True,
        }

    def _record_recent(self, event: DomainEvent, status: str, error: Optional[str] = None) -> None:
        """Ghi nhận vào log chẩn đoán vòng tròn."""
        self._recent_events.append({
            "id": event.id,
            "type": event.type,
            "occurred_at": event.occurred_at,
            "status": status,
            "error": error,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    def get_metrics(self) -> Dict[str, Any]:
        """Tổng hợp chỉ số vận hành phục vụ giám sát và dashboard."""
        q = self._get_queue()
        now = time.time()
        uptime = (now - self._started_at) if self._started_at else 0.0

        subscribers_stats = {
            k: len(v) for k, v in self._subscribers.items()
        }

        return {
            "is_running": self._running,
            "queue_size": q.qsize(),
            "queue_maxsize": self.queue_maxsize,
            "total_published": self._total_published,
            "total_processed": self._total_processed,
            "total_failed": self._total_failed,
            "dead_letter_count": len(self._dead_letter_queue),
            "subscribers_count": subscribers_stats,
            "uptime_seconds": round(uptime, 2),
        }

    def get_recent_events(self) -> List[Dict[str, Any]]:
        """Lấy danh sách các event được xử lý gần nhất."""
        return list(reversed(self._recent_events))

    def get_dead_letter_events(self) -> List[Dict[str, Any]]:
        """Lấy danh sách event trong Dead Letter Queue."""
        return list(self._dead_letter_queue)

    def clear(self) -> None:
        """Xóa trắng hàng đợi và bộ nhớ đệm (dùng trong test)."""
        self._subscribers.clear()
        self._dead_letter_queue.clear()
        self._recent_events.clear()
        self._total_published = 0
        self._total_processed = 0
        self._total_failed = 0
        if self._queue is not None:
            while not self._queue.empty():
                try:
                    self._queue.get_nowait()
                except asyncio.QueueEmpty:
                    break


# Global default EventBus instance
event_bus = EventBus()
