---
name: zalo-mini-app
description: Toàn bộ kiến thức, cấu trúc, API SDK, app-config, zmp-cli và quy trình phát triển / deploy Zalo Mini App. Sử dụng khi cần tra cứu tài liệu offline, tích hợp Zalo SDK (getUserInfo, getPhoneNumber, login, openWebview, payment) hoặc deploy qua ZMP CLI.
---

# Zalo Mini App Architecture & SDK Master Skill

Tài liệu tra cứu cục bộ (SSOT offline) về cấu trúc, cấu hình `app-config.json`, SDK `zmp-sdk`, và CLI `zmp-cli` cho Zalo Mini App.

---

## 1. Cấu Trúc Thư Mục Chuẩn (App Layout)

Dự án Zalo Mini App tuân theo cấu trúc tiêu chuẩn:

```
zalo-mini-app/
├── src/
│   ├── app.js / app.tsx       # Entrypoint khởi tạo ứng dụng & ZMP SDK
│   ├── store.js / store.ts    # Centralized State Management (Recoil / Zustand / App State)
│   ├── components/            # UI Components dùng chung
│   │   └── app.jsx
│   ├── css/ / styles/         # Toàn bộ CSS (app.css / tailwind.css)
│   └── pages/                 # Các màn hình chính (mỗi file là 1 page)
│       ├── index.jsx / index.tsx   # Trang mặc định khi mở app
│       └── ...
├── app-config.json            # CẤU HÌNH BẮT BUỘC của Zalo Mini App
├── package.json
└── vite.config.js / zmp.config.js
```

### Các tệp bắt buộc:
1. `app-config.json`: Khai báo tiêu đề, màu header, danh sách pages, safe areas.
2. `src/app.js` (hoặc `src/main.tsx`): Khởi chạy ứng dụng.
3. `src/pages/index.jsx` (hoặc `src/pages/index.tsx`): Trang đích mở đầu tiên.

---

## 2. Cấu Hình `app-config.json` Chi Tiết

Tệp `app-config.json` nằm ở thư mục gốc, định nghĩa toàn bộ hành vi giao diện native của Zalo Mini App:

```json
{
  "app": {
    "title": "Nguyện Vọng AI",
    "headerTitle": "Nguyện Vọng AI",
    "headerColor": "#1560ee",
    "textColor": "white",
    "statusBar": "transparent",
    "actionBarHidden": false,
    "hideAndroidBottomNavigationBar": false,
    "hideIOSSafeAreaBottom": false,
    "leftButton": "back"
  },
  "pages": [
    "pages/index/index"
  ],
  "window": {
    "dynamicTitle": true
  },
  "listCSS": [],
  "listSyncJS": [],
  "listAsyncJS": []
}
```

### Ý nghĩa các trường quan trọng:
- `headerColor`: Mã màu HEX cho thanh tiêu đề trên cùng (ví dụ `#1560ee`).
- `textColor`: Màu chữ tiêu đề (`white` hoặc `black`).
- `statusBar`: Trạng thái status bar (`transparent` hoặc `default`).
- `actionBarHidden`: Ẩn/hiện toàn bộ thanh action bar native của Zalo.
- `pages`: Danh sách đường dẫn file trang (không cần đuôi mở rộng `.jsx`/`.tsx`).

---

## 3. Zalo Mini App SDK (`zmp-sdk`)

Cài đặt SDK:
```bash
npm install zmp-sdk
```

### 3.1. Xác thực & Thông tin Người dùng (User & Auth)

```typescript
import { 
  getUserInfo, 
  getPhoneNumber, 
  getAccessToken, 
  login 
} from "zmp-sdk/apis";

// 1. Lấy thông tin cơ bản của người dùng (Avatar, Tên, ID)
export async function fetchUserInfo() {
  try {
    const { userInfo } = await getUserInfo({
      avatarType: "normal" // hoặc "small", "large"
    });
    console.log("User:", userInfo.id, userInfo.name, userInfo.avatar);
    return userInfo;
  } catch (error) {
    console.error("Lỗi lấy thông tin user:", error);
  }
}

// 2. Lấy số điện thoại (Yêu cầu cấp quyền và trả về token bảo mật để server giải mã)
export async function fetchPhoneNumber() {
  try {
    const data = await getPhoneNumber();
    // data.token hoặc data.number
    return data;
  } catch (error) {
    console.error("Lỗi lấy số điện thoại:", error);
  }
}

// 3. Lấy Access Token của Zalo Mini App
export async function fetchAccessToken() {
  try {
    const accessToken = await getAccessToken();
    return accessToken;
  } catch (error) {
    console.error("Lỗi lấy access token:", error);
  }
}
```

### 3.2. Điều hướng & Giao diện Native (UI & Navigation)

```typescript
import { 
  openWebview, 
  closeApp, 
  showToast, 
  openChat, 
  openShareSheet,
  setStorage,
  getStorage
} from "zmp-sdk/apis";

// 1. Mở Webview ngoài (liên kết bên ngoài an toàn)
export function openExternalLink(url: string) {
  openWebview({
    url: url,
    config: {
      style: "bottomSheet", // hoặc "fullscreen"
      leftButton: "close"
    }
  });
}

// 2. Hiển thị Toast thông báo Native
export function thongBaoZalo(message: string) {
  showToast({
    message: message,
    type: "success", // "info" | "success" | "warning" | "error"
    duration: 3000
  });
}

// 3. Mở khung chat trực tiếp với Official Account (OA) hoặc người dùng
export function chatVoiTuVan(oaId: string) {
  openChat({
    type: "oa",
    id: oaId,
    message: "Em cần tư vấn nguyện vọng tuyển sinh."
  });
}

// 4. Mở hộp thoại chia sẻ Zalo (Share Sheet)
export function chiaSeZalo(title: string, desc: string, path: string) {
  openShareSheet({
    type: "zmp",
    data: {
      title: title,
      description: desc,
      path: path,
      thumbnail: "https://nguyen-vong-ai.pages.dev/og.png"
    }
  });
}

// 5. Đóng Mini App
export function dongUngDung() {
  closeApp({});
}
```

### 3.3. Lưu trữ Local Native (`zmp-sdk` Storage)

```typescript
// Lưu dữ liệu vào storage native của Zalo
export async function luuDuLieu(key: string, data: any) {
  await setStorage({
    data: {
      [key]: data
    }
  });
}

// Đọc dữ liệu
export async function docDuLieu(key: string) {
  const result = await getStorage({
    keys: [key]
  });
  return result[key];
}
```

---

## 4. ZMP CLI (`zmp-cli`) Cheatsheet

Cài đặt hoặc chạy trực tiếp qua `npx`:
```bash
npm install -g zmp-cli
```

### Các lệnh phổ biến:

```powershell
# 1. Đăng nhập CLI
npx zmp-cli login
# Hoặc truyền App ID:
npx zmp-cli login --app-id 4554471043024364383

# 2. Khởi động môi trường phát triển local
npx zmp-cli start

# 3. Build mã nguồn Zalo Mini App
npx zmp-cli build

# 4. Deploy lên Zalo Mini App Platform
# Deploy bản testing / preview:
npx zmp-cli deploy -t -m "Cap nhat phien ban moi"

# Deploy với thư mục output tùy chỉnh:
npx zmp-cli deploy -o dist -m "Deploy ban web dist"
```

---

## 5. Web-to-MiniApp Migration Best Practices

1. **Safe Area & Status Bar:** Luôn sử dụng `padding-top: env(safe-area-inset-top)` và `padding-bottom: env(safe-area-inset-bottom)` để tránh bị che bởi tai thỏ và thanh điều hướng dưới cùng.
2. **Domain Whitelisting:** Bắt buộc khai báo domain của backend và static hosting (`https://nguyen-vong-ai.pages.dev`) trong tab **Cấu hình ứng dụng ➔ Domain Whitelist** trên trang Zalo Developer.
3. **Fail-Closed & Offline First:** Khi gọi các API SDK như `getUserInfo` hoặc `getPhoneNumber`, luôn có khối `try/catch` và fallback hiển thị giao diện phù hợp khi người dùng từ chối cấp quyền.
4. **Light Mode Solid & No Glassmorphism:** Giữ độ tương phản cao, nút mobile tối thiểu 48px, phù hợp với trải nghiệm người dùng Việt Nam trên Zalo.
