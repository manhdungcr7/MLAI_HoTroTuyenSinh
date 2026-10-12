"""
Tạo ảnh thương hiệu chất lượng cao cho Nguyện Vọng AI:
- public/og.png (1200 x 630): Ảnh xem trước khi chia sẻ mạng xã hội (Facebook, Zalo, LinkedIn, Twitter...)
- public/icon-192.png (192 x 192): PWA icon
- public/icon-512.png (512 x 512): PWA splash icon
- public/apple-touch-icon.png (180 x 180): Apple iOS bookmark icon
"""

import os
import sys
import io
from PIL import Image, ImageDraw, ImageFont

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def tao_icon(size, output_path, bo_goc=True):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Bo góc nếu cần (iOS tự bo góc nên apple-touch-icon thường để vuông hoặc bo nhẹ)
    r = int(size * 0.22) if bo_goc else 0
    # Màu nền gradient hoặc xanh chủ đạo #1560ee
    bg_color = (21, 96, 238, 255) # #1560ee
    
    if bo_goc:
        draw.rounded_rectangle([(0, 0), (size, size)], radius=r, fill=bg_color)
    else:
        draw.rectangle([(0, 0), (size, size)], fill=bg_color)
        
    # Vẽ biểu tượng mũ tốt nghiệp (Graduation Cap) & AI
    cx, cy = size / 2, size / 2
    
    # Đỉnh mũ
    top_y = cy - size * 0.22
    mid_y = cy - size * 0.05
    bot_y = cy + size * 0.12
    left_x = cx - size * 0.35
    right_x = cx + size * 0.35
    
    # Diamond / Tam giác đỉnh mũ
    cap_top = [(cx, top_y), (right_x, mid_y), (cx, bot_y), (left_x, mid_y)]
    draw.polygon(cap_top, fill=(255, 255, 255, 255))
    
    # Vành dưới mũ
    rim_left = cx - size * 0.22
    rim_right = cx + size * 0.22
    rim_top = mid_y + size * 0.05
    rim_bot = cy + size * 0.26
    
    rim_poly = [
        (rim_left, rim_top),
        (cx, rim_top + size * 0.10),
        (rim_right, rim_top),
        (rim_right, rim_bot),
        (cx, rim_bot + size * 0.10),
        (rim_left, rim_bot)
    ]
    draw.polygon(rim_poly, fill=(191, 227, 255, 255))
    
    # Tua rua (Tassel)
    tassel_point = (cx + size * 0.26, mid_y + size * 0.03)
    tassel_end = (cx + size * 0.28, cy + size * 0.25)
    draw.line([tassel_point, tassel_end], fill=(255, 215, 0, 255), width=max(2, int(size * 0.025)))
    draw.ellipse([(tassel_end[0]-size*0.02, tassel_end[1]), (tassel_end[0]+size*0.02, tassel_end[1]+size*0.05)], fill=(255, 215, 0, 255))
    
    img.save(output_path, "PNG")
    print(f"Đã tạo: {output_path} ({size}x{size})")

def tao_og_image(output_path):
    width, height = 1200, 630
    img = Image.new("RGB", (width, height), "#0b192c")
    draw = ImageDraw.Draw(img)
    
    # Tạo nền gradient tinh tế
    for y in range(height):
        ratio = y / height
        # Gradient từ dark blue sang deep indigo
        r = int(11 * (1 - ratio) + 21 * ratio)
        g = int(25 * (1 - ratio) + 38 * ratio)
        b = int(44 * (1 - ratio) + 90 * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
        
    # Vẽ các hình trang trí công nghệ / AI (vòng tròn mờ glow)
    # Glow tròn góc phải trên
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw_ov = ImageDraw.Draw(overlay)
    draw_ov.ellipse([(850, -100), (1350, 400)], fill=(30, 99, 238, 45))
    draw_ov.ellipse([(950, 50), (1250, 350)], fill=(59, 130, 246, 50))
    
    # Glow tròn góc trái dưới
    draw_ov.ellipse([(-150, 350), (350, 850)], fill=(20, 184, 166, 35))
    
    # Hộp thẻ logo lớn
    card_x, card_y, card_s = 100, 165, 140
    draw_ov.rounded_rectangle([(card_x, card_y), (card_x + card_s, card_y + card_s)], radius=32, fill=(21, 96, 238, 255))
    
    # Vẽ biểu tượng trong thẻ logo
    cx, cy = card_x + card_s / 2, card_y + card_s / 2
    top_y = cy - card_s * 0.22
    mid_y = cy - card_s * 0.05
    bot_y = cy + card_s * 0.12
    left_x = cx - card_s * 0.35
    right_x = cx + card_s * 0.35
    draw_ov.polygon([(cx, top_y), (right_x, mid_y), (cx, bot_y), (left_x, mid_y)], fill=(255, 255, 255, 255))
    
    rim_left, rim_right = cx - card_s * 0.22, cx + card_s * 0.22
    rim_top, rim_bot = mid_y + card_s * 0.05, cy + card_s * 0.26
    draw_ov.polygon([(rim_left, rim_top), (cx, rim_top + card_s * 0.10), (rim_right, rim_top), (rim_right, rim_bot), (cx, rim_bot + card_s * 0.10), (rim_left, rim_bot)], fill=(191, 227, 255, 255))
    
    tassel_point = (cx + card_s * 0.26, mid_y + card_s * 0.03)
    tassel_end = (cx + card_s * 0.28, cy + card_s * 0.25)
    draw_ov.line([tassel_point, tassel_end], fill=(255, 215, 0, 255), width=4)
    draw_ov.ellipse([(tassel_end[0]-3, tassel_end[1]), (tassel_end[0]+3, tassel_end[1]+7)], fill=(255, 215, 0, 255))
    
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    
    # Thử load font hệ thống
    font_title = None
    font_sub = None
    font_stat = None
    font_badge = None
    
    font_paths = [
        "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\tahoma.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font_title = ImageFont.truetype(fp, 56)
                font_sub = ImageFont.truetype(fp, 26)
                font_stat = ImageFont.truetype(fp, 22)
                font_badge = ImageFont.truetype(fp, 18)
                break
            except Exception:
                pass
                
    if font_title is None:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_stat = ImageFont.load_default()
        font_badge = ImageFont.load_default()
        
    # Badge "NỀN TẢNG TUYỂN SINH THÔNG MINH"
    badge_bg = [(280, 165), (630, 205)]
    draw.rounded_rectangle(badge_bg, radius=20, fill=(30, 58, 138))
    draw.text((300, 175), "TRỢ LÝ TUYỂN SINH THÔNG MINH", fill="#60a5fa", font=font_badge)
    
    # Tiêu đề chính
    draw.text((280, 220), "NGUYỆN VỌNG AI", fill="#ffffff", font=font_title)
    
    # Mô tả phụ
    draw.text((100, 350), "Chiến lược chọn ngành, chọn trường & Tối ưu hóa nguyện vọng đại học", fill="#cbd5e1", font=font_sub)
    draw.text((100, 395), "Dự báo điểm chuẩn kiểm định • Phân tầng rủi ro • Lịch tự học cá nhân hóa", fill="#94a3b8", font=font_sub)
    
    # Card Thống kê chân trang (3 pillars)
    stats = [
        ("3.447", "Chương trình chuẩn"),
        ("113", "Trường đại học & CĐ"),
        ("100%", "Minh chứng số trang đề án"),
    ]
    
    box_w = 310
    box_h = 100
    start_x = 100
    box_y = 470
    
    for i, (val, label) in enumerate(stats):
        bx = start_x + i * (box_w + 35)
        # Nền card mờ
        draw.rounded_rectangle([(bx, box_y), (bx + box_w, box_y + box_h)], radius=16, fill=(15, 28, 54), outline=(37, 99, 235), width=1)
        # Số nổi bật
        draw.text((bx + 20, box_y + 15), val, fill="#38bdf8", font=font_title)
        # Nhãn
        draw.text((bx + 20, box_y + 65), label, fill="#94a3b8", font=font_stat)
        
    img.save(output_path, "PNG")
    print(f"Đã tạo: {output_path} (1200x630)")

if __name__ == "__main__":
    os.makedirs("public", exist_ok=True)
    tao_icon(192, "public/icon-192.png", bo_goc=True)
    tao_icon(512, "public/icon-512.png", bo_goc=True)
    tao_icon(180, "public/apple-touch-icon.png", bo_goc=False)
    tao_og_image("public/og.png")
    print("Hoàn tất tạo bộ nhận diện thương hiệu!")
