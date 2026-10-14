import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const MOCK_STATE = {
  phienBan: 2,
  hoSo: {
    laMau: true, hoTen: "Nguyễn Minh Anh", khoi: 12, tinh: "TP. Hồ Chí Minh", giaiDoan: "", nganhQuanTam: ["CNTT"],
    diem: { toan: 8.4, vatLy: 8.2, hoaHoc: 7.8, sinh: 8.0, nguVan: 7.5, tiengAnh: 8.6 },
    diemManh: ["Tư duy logic", "Giải quyết vấn đề", "Tiếng Anh"], canCaiThien: ["Vật lý", "Diễn đạt"],
    nganSach: "30-60", choO: "oNha", khuVuc: ["TP.HCM"],
    hocXaNha: true, quanTamViecLam: "rat", hoanTat: true,
    chungChiNgoaiNgu: { loai: "IELTS", diem: 7.0 },
    diemDgnl: { hcm: 875, hn: null, tsa: null },
    hocBa: { dtbLop10: 8.6, dtbLop11: 8.8, dtbLop12: 9.0, dtb3Nam: 8.8, hocLuc: "gioi", hanhKiem: "tot" },
    giaiThuongHsg: { cap: "tinh", mon: "Toán", giai: "ba" },
  },
  mucTieu: {
    luaChonId: "qsc-060cb1c0", phuongThuc: "THPT", maToHop: "A01",
    toHop: ["toan", "vatLy", "tiengAnh"], diemMucTieu: 26.5, ngayThi: "2026-06-25"
  },
  nguyenVong: ["qsc-060cb1c0", "qst-5caf16b0", "bvh-1a2b3c4d", "bka-789xyz12"],
  yeuThich: ["qsc-060cb1c0"],
  soSanh: ["qsc-060cb1c0", "qst-5caf16b0"],
  diemThi: [
    { mon: "toan", diem: 8.4, ngay: "2026-10-01" },
    { mon: "vatLy", diem: 8.2, ngay: "2026-10-01" },
    { mon: "tiengAnh", diem: 8.6, ngay: "2026-10-01" }
  ],
  coDinh: [
    { id: "cd-1", ten: "Học trên lớp", loai: "truong", thu: 2, batDau: "07:30", ketThuc: "11:30" },
    { id: "cd-2", ten: "Học trên lớp", loai: "truong", thu: 3, batDau: "07:30", ketThuc: "11:30" },
    { id: "cd-3", ten: "Học thêm Toán", loai: "hocThem", thu: 3, batDau: "18:00", ketThuc: "19:30" },
    { id: "cd-4", ten: "Học trên lớp", loai: "truong", thu: 4, batDau: "07:30", ketThuc: "11:30" },
    { id: "cd-5", ten: "Học trên lớp", loai: "truong", thu: 5, batDau: "07:30", ketThuc: "11:30" },
    { id: "cd-6", ten: "Học thêm Lý", loai: "hocThem", thu: 5, batDau: "18:00", ketThuc: "19:30" },
    { id: "cd-7", ten: "Học trên lớp", loai: "truong", thu: 6, batDau: "07:30", ketThuc: "11:30" },
  ],
  viec: [
    { id: "v-1", tieuDe: "Ôn tập chuyên đề Hàm số & Đạo hàm", mon: "toan", mucUuTien: "cao", phut: 90, xong: true, lyDo: "Môn trọng tâm kéo điểm khối A01" },
    { id: "v-2", tieuDe: "Luyện giải đề Vật lý Dao động cơ", mon: "vatLy", mucUuTien: "cao", phut: 75, xong: false, lyDo: "Điểm thi thử gần nhất dưới mục tiêu 0.3 điểm" },
    { id: "v-3", tieuDe: "Luyện đọc hiểu tiếng Anh dạng đề chuẩn", mon: "tiengAnh", mucUuTien: "trungBinh", phut: 60, xong: false, lyDo: "Duy trì phong độ môn thế mạnh" },
  ],
  trangThaiViec: { "v-1": "xong" },
  khoiHoc: [],
  cauHinh: { gioBatDau: "19:30", gioKetThuc: "22:30", gioHocToiDaMoiNgay: 3, nghiGiuaTietPhut: 10, thoiDiemTot: "toi" },
  tamTrang: "binhThuong",
  nhacNho: { bat: true, truocPhut: 15, nhacChuanBiBai: true, gioChuanBiBai: "20:00" },
  lichSu: [{ viecId: "v-1", ten: "Ôn tập chuyên đề Hàm số & Đạo hàm", trangThai: "xong", luc: new Date().toISOString() }],
  cauNoiHomNay: 0,
  loiNhan: [],
};

const SEED_SCRIPT = `
<script>
  try {
    if (window.location.search.includes('seed=mau')) {
      localStorage.setItem('nvai:v2', JSON.stringify(${JSON.stringify(MOCK_STATE)}));
    } else if (window.location.search.includes('seed=empty')) {
      localStorage.removeItem('nvai:v2');
    }
  } catch(e) {}
</script>
`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let [urlPath] = req.url.split('?');
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(DIST, urlPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    if (ext === '.html') {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace('</head>', `${SEED_SCRIPT}</head>`);
      res.end(content);
    } else {
      fs.createReadStream(filePath).pipe(res);
    }
  } else {
    const indexFile = path.join(DIST, 'index.html');
    let content = fs.readFileSync(indexFile, 'utf8');
    content = content.replace('</head>', `${SEED_SCRIPT}</head>`);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
  }
});

const PORT = 4188;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server listening on http://127.0.0.1:${PORT}`);
});

