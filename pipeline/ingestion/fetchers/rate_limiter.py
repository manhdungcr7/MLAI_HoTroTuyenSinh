"""Thread-safe Token Bucket Rate Limiter with jitter for respectful crawling."""

from __future__ import annotations

import random
import threading
import time
from typing import Optional


class TokenBucketRateLimiter:
    """Token Bucket rate limiter ensuring API & website access stays below limits."""

    def __init__(self, requests_per_second: float = 2.0, burst_size: Optional[int] = None):
        self.rate = max(0.1, requests_per_second)
        self.capacity = burst_size if burst_size is not None else max(1, int(self.rate * 2))
        self.tokens = float(self.capacity)
        self.last_refill = time.monotonic()
        self._lock = threading.Lock()

    def acquire(self, tokens: int = 1) -> float:
        """Wait until enough tokens are available. Returns total wait time in seconds."""
        wait_time = 0.0
        while True:
            with self._lock:
                now = time.monotonic()
                elapsed = now - self.last_refill
                self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
                self.last_refill = now

                if self.tokens >= tokens:
                    self.tokens -= tokens
                    # Add mild jitter (10-50ms) to avoid perfectly periodic spikes
                    jitter = random.uniform(0.01, 0.05)
                    time.sleep(jitter)
                    return wait_time + jitter

                missing_tokens = tokens - self.tokens
                needed_wait = missing_tokens / self.rate

            wait_time += needed_wait
            time.sleep(needed_wait)
