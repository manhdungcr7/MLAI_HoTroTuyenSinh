// Danh mục gốc nạp lười (xem src/data/lua-chon-that.ts). Test cần dữ liệu `import "./nap-du-lieu";` làm dòng import ĐẦU TIÊN:
// await ở mức module chặn các import phía sau cho đến khi danh mục sẵn sàng.
import { napDanhMuc } from "../src/data/lua-chon-mau";

await napDanhMuc();
