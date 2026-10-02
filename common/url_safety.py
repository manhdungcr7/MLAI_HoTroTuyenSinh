"""Chống SSRF cho mọi request outbound (crawler pipeline và backend).

Tách từ backend/app/security.py để pipeline/ không phụ thuộc backend (đang đóng băng).
"""

from __future__ import annotations

import ipaddress
import socket
from typing import List, Tuple
from urllib.parse import urlparse

# Danh sách dải IP cấm tuyệt đối (SSRF Protection)
# Bao gồm loopback, private, link-local, carrier-grade NAT, cloud metadata, multicast
BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),          # Current network
    ipaddress.ip_network("10.0.0.0/8"),         # Private RFC 1918
    ipaddress.ip_network("100.64.0.0/10"),      # Shared Address Space / CGNAT
    ipaddress.ip_network("127.0.0.0/8"),        # Loopback
    ipaddress.ip_network("169.254.0.0/16"),     # Link-local & Cloud Metadata (169.254.169.254)
    ipaddress.ip_network("172.16.0.0/12"),      # Private RFC 1918
    ipaddress.ip_network("192.0.0.0/24"),       # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),       # TEST-NET-1
    ipaddress.ip_network("192.88.99.0/24"),     # 6to4 Relay Anycast
    ipaddress.ip_network("192.168.0.0/16"),     # Private RFC 1918
    ipaddress.ip_network("198.18.0.0/15"),      # Network Interconnect Benchmarking
    ipaddress.ip_network("198.51.100.0/24"),    # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),     # TEST-NET-3
    ipaddress.ip_network("224.0.0.0/4"),        # Multicast
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved / Future use
    ipaddress.ip_network("255.255.255.255/32"), # Broadcast
    # IPv6
    ipaddress.ip_network("::/128"),             # Unspecified
    ipaddress.ip_network("::1/128"),           # Loopback
    ipaddress.ip_network("fc00::/7"),           # Unique Local Address (ULA)
    ipaddress.ip_network("fe80::/10"),          # Link-local unicast
    ipaddress.ip_network("ff00::/8"),           # Multicast
]

# Tên miền metadata của các nhà cung cấp đám mây phổ biến
BLOCKED_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "metadata.internal",
    "instance-data",
    "169.254.169.254",
    "100.100.100.200",  # Alibaba Cloud metadata
}


def is_ip_blocked(ip_addr: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Kiểm tra một địa chỉ IP có nằm trong danh sách cấm SSRF không."""
    # Nếu là IPv4-mapped IPv6 (ví dụ ::ffff:127.0.0.1), trích xuất IPv4 bên trong
    if isinstance(ip_addr, ipaddress.IPv6Address) and ip_addr.ipv4_mapped:
        ip_addr = ip_addr.ipv4_mapped

    if ip_addr.is_loopback or ip_addr.is_private or ip_addr.is_link_local or ip_addr.is_reserved or ip_addr.is_multicast or ip_addr.is_unspecified:
        return True

    for net in BLOCKED_IP_NETWORKS:
        try:
            if ip_addr in net:
                return True
        except TypeError:
            # So sánh IPv4 với IPv6 network bỏ qua
            continue
    return False


def validate_safe_url(
    url: str,
    allowed_schemes: Tuple[str, ...] = ("http", "https"),
    allowed_domains: List[str] | None = None,
) -> Tuple[bool, str]:
    """Kiểm định URL trước khi thực hiện request outbound (chống SSRF).
    
    Quy trình kiểm tra:
    1. Scheme phải nằm trong allowed_schemes (chỉ http/https).
    2. Cấm URL chứa userinfo (credentials trong URL).
    3. Hostname không được nằm trong danh sách đen (metadata, localhost).
    4. Phân giải DNS và kiểm tra từng IP: cấm toàn bộ private/loopback/cloud-metadata.
    5. (Tùy chọn) Kiểm tra whitelist domain nếu có.
    """
    if not url or not isinstance(url, str):
        return False, "URL rỗng hoặc không hợp lệ"

    try:
        parsed = urlparse(url.strip())
    except Exception as e:
        return False, f"Lỗi phân tích URL: {e}"

    scheme = parsed.scheme.lower()
    if scheme not in allowed_schemes:
        return False, f"Scheme '{scheme}' không được phép (chỉ chấp nhận {allowed_schemes})"

    if not parsed.hostname:
        return False, "Thiếu hostname trong URL"

    if parsed.username or parsed.password:
        return False, "Cấm nhúng thông tin xác thực (username/password) trong URL"

    hostname = parsed.hostname.lower().strip()

    if hostname in BLOCKED_HOSTNAMES:
        return False, f"Hostname '{hostname}' bị cấm (chặn truy cập tài nguyên nội bộ/metadata)"

    if hostname.endswith(".internal") or hostname.endswith(".local"):
        return False, f"Hostname '{hostname}' thuộc dải mạng nội bộ"

    # Kiểm tra nếu hostname là IP trực tiếp
    try:
        ip = ipaddress.ip_address(hostname)
        if is_ip_blocked(ip):
            return False, f"Địa chỉ IP '{ip}' thuộc dải mạng nội bộ hoặc nguy hiểm"
    except ValueError:
        # Hostname là domain, tiến hành phân giải DNS
        try:
            port = parsed.port or (443 if scheme == "https" else 80)
            addr_info = socket.getaddrinfo(hostname, port, proto=socket.IPPROTO_TCP)
            if not addr_info:
                return False, f"Không thể phân giải DNS cho hostname '{hostname}'"

            for entry in addr_info:
                sockaddr = entry[4]
                ip_str = sockaddr[0]
                resolved_ip = ipaddress.ip_address(ip_str)
                if is_ip_blocked(resolved_ip):
                    return False, f"Hostname '{hostname}' phân giải về IP nội bộ '{ip_str}' (SSRF blocked)"
        except socket.gaierror:
            return False, f"Không thể phân giải tên miền '{hostname}'"
        except Exception as e:
            return False, f"Lỗi kiểm tra DNS: {e}"

    if allowed_domains:
        is_allowed = any(
            hostname == d.lower() or hostname.endswith("." + d.lower())
            for d in allowed_domains
        )
        if not is_allowed:
            return False, f"Tên miền '{hostname}' không nằm trong whitelist cho phép"

    return True, "URL an toàn"
