# 01. Audit runtime AI tư vấn "Nguyện Vọng AI"

Phạm vi: chỉ đọc code ở worktree sạch `D:\nv-ai` (HEAD `cb84d4c`). Không sửa code, không chạy test, không gọi mạng, không chạy dev server. Đã chạy 1 lệnh `npx tsx` nhỏ để đo độ dài prompt (kết quả ở mục 7).
Quy ước: `file:dòng` là số dòng đã đọc ở HEAD trên. Chỗ ghi "(không chắc)" là suy luận hoặc kiến thức ngoài repo, chưa kiểm chứng.

Lưu ý ngoài phạm vi: ở repo chính `D:\07-Competitions-Hackathons\mlai\nguyenvongai` đang có thay đổi chưa commit ở `bac-thang.ts`, `sinh-van-ban.ts`, `lay-du-lieu.ts`, `cau-tra-loi.ts`, `tien-do-chat.ts`, và file mới `src/features/tu-van/bo-dieu-phoi.ts`, `tests/rearchitect-chatbot.test.ts` (theo `git status` lúc mở phiên, tôi không đọc chúng). Cần thống nhất với người đang sửa trước khi thiết kế, kẻo trùng việc hoặc xung đột.

---

## 1. Sơ đồ luồng hiện tại (học sinh gõ câu hỏi đến khi hiện câu trả lời)

```
[CLIENT, trình duyệt]
 tu-van.tsx:87 gui()  /  khung-chat-mini.tsx:344 gui()
   -> dang-cho.ts:19 guiNen()  (ghi câu hỏi vào localStorage, chạy ở mức module nên rời màn vẫn nhận đáp)
   -> cau-tra-loi.ts:191 layTinTraLoi()
        1. y-dinh.ts:28 nhanYDinhQuyTac     LUẬT CỨNG: chào, cảm ơn, trợ giúp, hỏi lượt AI, ngoài phạm vi   -> trả ngay (cau-tra-loi.ts:194-199)
        2. tien-do-chat.ts:87 traLoiTienDoChat  LUẬT CỨNG: tiến độ chương trình lớp 12                    -> trả ngay (:204-205)
        3. dựng YeuCauTuVan (:209-212): tomTatHoSo, chonDuLieuKemTheo (lay-du-lieu.ts:168, :192), nguCanhVoiNV1 (:21)
        4. traLoiTuDong (lay-du-lieu.ts:649)  LUẬT CỨNG, luôn tính sẵn (:214) dù sau đó có dùng hay không
        5. rẽ nhánh (đều là LUẬT CỨNG, không gọi server):
             - chế độ "tietKiem"                         (:218-227)
             - phien.luot.con <= 0 (hết lượt, theo bản ghi cục bộ) (:230-241)
             - traLoiNoiBo() = true (:261-264, định nghĩa :129-136): có ý định rõ, có "diem chuan|hoc phi|to hop|du bao|ke hoach|lich hoc|nguyen vong", hoặc kiểu câu khác "khac"
        6. nhánh SO SÁNH + chế độ AI (:245-258): dựng bảng tất định (bang-so-sanh.ts) rồi hoiAI({..., bangSoSanh})
        7. còn lại: hoiAI(y, phien, onChunk) (:266)  <-- ĐƯỜNG DUY NHẤT gọi server
        8. AI lỗi -> rơi về traLoiTuDong (:281-306)

   hoiAI (cau-tra-loi.ts:38): POST /api/tu-van, header accept "text/event-stream, application/json", body {...y, stream:true, hoSoId, requestId} (:45-50),
     AbortSignal.timeout(25 s) (:30, :49); đọc SSE (:53-106) hoặc JSON (:108-125)

[SERVER, Cloudflare Pages Function]  functions/api/tu-van.ts:32 xuLy
   405 nếu không POST (:33) -> 503 "chua-cau-hinh" nếu không có khóa LLM và không có binding AI (:34)
   -> đọc body theo luồng, trần 16 KB (:35-57) -> JSON.parse (:59) -> kiemTraYeuCau làm sạch (:60, engine/tu-van.ts:125)
   -> kiểm hoSoId/requestId là UUID (:63) -> bắt buộc RATE_KV (:66)
   -> choPhepTanSuat 8 yêu cầu/phút/IP (KV) (:69; engine/tu-van.ts:117)
   -> Turnstile (:72-74)
   -> bắt buộc D1 `DB` (:76); giữ lượt: IP (:89), hồ sơ (:93), toàn hệ thống (:98), lượt web (:108-111)
   -> traLoiBacThang (:118)  [functions/_thu-vien/ai/bac-thang.ts:122]
        a. BẬC 1 CACHE KV  khóa = SHA-256(câu hỏi chuẩn hóa, id+nhãn ngành, hồ sơ, DATA_VERSION, ngữ cảnh, prompt)  (:127; cache.ts:85)
              trúng -> trả ngay {tang:"cache"} (:128-131)
        b. BẬC 2 CLEF (@cf/cloudflare/clef-omni, Workers AI)  chạy SONG SONG với bậc 3 (:137-141) – chỉ khi có binding AI và >= 2 ứng viên và không phải so sánh
              chỉ cho tín hiệu: danh sách 4-6 ngành ưu tiên + "việc nên làm tiếp"; KHÔNG đổi nhãn
        c. BẬC 3 RAG  Vectorize + bge-m3 (:142-147): ghi chú cộng đồng và tư liệu chính thức, tối đa 6 mảnh, hạn 2 giây
        d. không có khóa LLM -> {ok:false, loi:"chua-cau-hinh", goiY} (:150-153)   (chỉ xảy ra khi có binding AI nhưng không có LLM)
        e. BẬC 4 LLM: dungNoiDung (engine/tu-van.ts:408) + phanMoRong (:155); nhánh tìm web OpenRouter (:165-167); rồi goiMoHinh (:169)
        f. docPhanHoiLLM (:173) -> hậu kiểm số liệu soLieuLech (:180-181) -> lệch thì {ok:false, loi:"so-lieu-khong-khop"} (:184-185)
        g. ghi cache (:191), trả {tang:"llm", ...}
   -> chốt/hoàn lượt (:119-130) -> luotConLai (:131)
   -> nếu stream:true hoặc accept SSE: phát lại câu trả lời ĐÃ HOÀN TẤT thành các đoạn 16 ký tự (:134-159)  <-- stream giả (xem mục 4)
   -> ngược lại json(traVe) (:161); ngoại lệ bất kỳ -> 502 chung (:162-167)

[CLIENT nhận]  onChunk -> tu-van.tsx:95 chèn/cập nhật tin "mayChu" tạm (cheDo:"ai") -> khi xong guiNen ghi lịch sử và bắn SU_KIEN_XONG (dang-cho.ts:40-41)
   -> TinMayChu (tin-may-chu.tsx:48) vẽ thẻ trường, chip hành động, nguồn web, DataSourceLabel (:182)
```

Nơi chạy: bước 1-5, 8 và toàn bộ thẻ tương tác ở client; kiểm hợp lệ, quota, cache, Clef, RAG, LLM, hậu kiểm ở server. Luật cứng `traLoiTuDong` chạy ở **client**, không có bản ở server.

---

## 2. Bậc thang dự phòng (`bac-thang.ts`)

Thứ tự thực tế trong `traLoiBacThang` (`bac-thang.ts:122-196`): cache (128-131) -> [Clef || RAG] song song (137-147) -> (web) -> LLM (169) -> hậu kiểm (180-185) -> ghi cache (191). Không có bậc "rules" ở server: luật cứng chỉ nằm ở client.

Điều kiện chuyển bậc, tất cả đã đọc:

| Bậc | Điều kiện bỏ qua | Lỗi xử lý thế nào |
|---|---|---|
| Cache | thiếu KV hoặc `khoa` rỗng | đọc lỗi = miss (`cache.ts:90-98`), ghi lỗi nuốt (`cache.ts:100-103`) |
| Clef | không có `env.AI`, hoặc < 2 ứng viên, hoặc là so sánh (`:137`) | `.catch(() => ({r:null}))` (`:141`); `hoiClef` nuốt lỗi, chỉ `console.warn` (`clef.ts:60-63`); hạn 3 giây (`:45`) |
| RAG | là so sánh (`:142`) | `.catch` + `sau()` hạn 2 giây trả rỗng (`:144`); `truyVanNhieuBoLoc` trả `null` khi thiếu binding hoặc lỗi (`chi-muc.ts:141-160`) |
| Web | chỉ khi `canTimWeb` và còn lượt web và có `OPENROUTER_API_KEY` (`tu-van.ts:108`) | lỗi trong 5 giây đầu bị nuốt rồi rơi sang LLM thường; sau 5 giây thì ném (`:167`) |
| LLM | không có khóa -> `chua-cau-hinh` (`:150`) | lỗi nhà cung cấp ném lên `tu-van.ts:162` -> 502 |

**Có im lặng thay AI bằng luật cứng mà vẫn trình bày như AI không?** Có, theo hai cách, đều ở client:

1. `cau-tra-loi.ts:245-257`: nhánh so sánh + AI lỗi thì `void loi` (`:256`), không ghi chú, rơi xuống `traLoiNoiBo` (`:261`) hoặc `hoiAI` lần hai (`:266`). Với câu so sánh, `traLoiNoiBo` thường đúng nên học sinh nhận câu luật cứng mà không có `ghiChu`. Học sinh không biết AI vừa lỗi.
2. `cau-tra-loi.ts:305-306`: `loi` = `mang` hoặc `chua-cau-hinh` mà `td.khongHieu` là false thì trả `tinTuDong(td, ..., {viecTiep})` không có `ghiChu`, không `thuLai`. Chỉ nhánh `khongHieu && loi==="mang"` mới nói "dịch vụ AI chưa phản hồi" (`:300-304`). Các nhánh `het-luot`, `het-luot-chung`, `so-lieu` có `ghiChu` (`:283-298`).
3. Phía giao diện: bong bóng tạm khi stream luôn đặt `cheDo:"ai"` (`tu-van.tsx:101`, `khung-chat-mini.tsx:358`), kể cả khi nội dung là luật cứng (vì `onChunk?.(td.traLoi)` cũng được gọi ở `cau-tra-loi.ts:221,239,262,305`). Tin cuối cùng được ghi lại với `cheDo:"tuDong"`, nhưng không có thành phần nào hiển thị nhãn này.

**Client có biết bậc nào trả lời không?** Server trả trường `tang: "cache" | "llm"` (`bac-thang.ts:12`, `engine/tu-van.ts:67`). Client lưu nó vào `TinNhan.tang` (`cau-tra-loi.ts:252,272`; `hoi-thoai.ts:26,86`). Nhưng **không có chỗ nào đọc `.tang` để hiển thị** (`grep "\.tang\b"` trong `src` chỉ ra các dòng gán/lưu). Thiếu: nhãn cho Clef, RAG, web, và cho bậc "luật cứng client". `cheDo` chỉ được dùng để ẩn một nhãn (`nhan-nguon-du-lieu.tsx:14-18`). Không có trường nào báo "câu này có dùng RAG hay Clef".

---

## 3. Nhà cung cấp mô hình

Biến môi trường (`sinh-van-ban.ts:5-10`): `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `AI_MODEL`, binding `AI` (Workers AI), `CF_AI_LLM`. Ưu tiên cứng theo thứ tự OpenRouter > Anthropic > OpenAI > Workers AI (`goiMoHinh`, `sinh-van-ban.ts:31-100`). Không có chuyển nhà cung cấp khi lỗi: có OpenRouter thì chỉ dùng OpenRouter.

Mô hình mặc định: OpenRouter `anthropic/claude-haiku-5.5` (`:47`), Anthropic `claude-haiku-4-5-20251001` (`:65`), OpenAI `gpt-4o-mini` (`:76`), Workers AI `@cf/meta/llama-3.3-70b-instruct` (`:85`). **Nhưng `wrangler.jsonc:38` đặt `AI_MODEL = "deepseek/deepseek-v4.1-flash"`**, và `modelNgoai` (`:26`) chuyển nguyên giá trị đó cho cả OpenRouter, Anthropic và OpenAI trừ id bắt đầu `@cf/`. Hệ quả: nếu chỉ có `ANTHROPIC_API_KEY` hoặc `OPENAI_API_KEY`, mô hình `deepseek/...` sẽ bị gửi tới API của hãng đó và (không chắc, chưa chạy) bị từ chối. `docs/TU-VAN-AI.md` không nhắc biến này đã bị ghi đè trong `wrangler.jsonc`. Không chắc cấu hình thực tế đang chạy production dùng khóa nào.

Tham số: `temperature` 0,2; `max_tokens` = 650 (tư vấn) hoặc 700 (so sánh) (`bac-thang.ts:104,158`), `TOKEN_RA` 450 chỉ còn là mặc định (`sinh-van-ban.ts:23`); `reasoning:{enabled:false}` (`:51,130`); `provider:{sort:"latency"}` (`:52`); timeout `AbortSignal.timeout` tối đa 10 giây (`HAN_GOI_MS` `:21`), thực tế = phần còn lại trong ngân sách 12 giây tổng (`bac-thang.ts:45,156`).

Phân biệt lỗi: **gần như không có.** `goiMoHinh` chỉ ném `Error("openrouter 401")`, `"anthropic 429"`, `"openai 500"` (`:56,67,78`), `cf-ai-timeout` (`:93`), `chua-cau-hinh` (`:101`), `het-thoi-gian` (`:32`). Không đọc thân lỗi, không phân biệt auth / rate limit / provider / context overflow / schema / tool calling. Timeout của `AbortSignal` ném `TimeoutError` cũng không được tách. Tất cả rơi vào `catch` ở `tu-van.ts:162-167` thành **một** 502 chung; mã chẩn đoán chỉ vào log, cắt 80 ký tự (`:165`). Không retry (`sinh-van-ban.ts:88-90` ghi lý do: sợ tính tiền hai lần), không circuit breaker, không back-off, không cooldown khi nhà cung cấp lỗi liên tục.

Mã lỗi trả client (đã được sửa gần đây, xác nhận bằng đọc): không lộ mã nhà cung cấp (`tu-van.ts:167`); `so-lieu-khong-khop` -> 422 (`:122`); `het-luot-ngay` 429 (`:94`), `het-luot-ip` 429 (`:90`), `het-luot-he-thong` 429 (`:104`); `da-xu-ly` 409; client gộp thành `LoiAI` = `chua-cau-hinh | mang | het-luot | het-luot-chung | so-lieu` (`cau-tra-loi.ts:32`; ánh xạ `:111-117`). Tách `so-lieu` và `het-luot-chung` đúng như đã nêu. Các mã còn lại (400, 403 Turnstile, 409, 413, 429 "hỏi hơi nhanh", 502) đều bị gộp thành `mang`, kết quả là câu "dịch vụ AI chưa phản hồi" (`:117`).

Chỗ nuốt lỗi (đã xác nhận): cache (`cache.ts:97,102`), Clef (`bac-thang.ts:141`, `clef.ts:60`), RAG (`bac-thang.ts:144`, `chi-muc.ts:156,158`), hoàn lượt (`tu-van.ts:82,110,115-116`), web 5 giây đầu (`bac-thang.ts:167`), `docPhanHoiLLM` (không bao giờ ném, `engine/tu-van.ts:312-327`).

Chi phí: không có bảng giá hay đếm token thật trong code. Chỉ có `tokenVaoUocTinh = ceil(chữ/3)` ghi log (`bac-thang.ts:192`) và `msClef/msRag/msLLM/msTong` (cùng dòng). Không lấy `usage` của nhà cung cấp.

Turnstile: client **không gửi** token (không có `cf-turnstile-response` trong `src`). `xacThucTurnstile` (`turnstile.ts:19-60`) chỉ bỏ qua khi chưa đặt `TURNSTILE_SECRET_KEY`; nếu đặt secret mà thiếu token thì trả 403 (`:27-29`). Nếu production đặt secret, mọi lượt AI sẽ 403 rồi bị client hiểu là `mang`. Không chắc production có đặt secret hay không.

---

## 4. Streaming

- **Có SSE nhưng là stream giả.** Server chờ `traLoiBacThang` hoàn tất (gồm cả LLM không-stream), rồi mới cắt câu trả lời thành đoạn 16 ký tự và ghi liên tục không có độ trễ (`tu-van.ts:139-150`), kèm sự kiện cuối `{xong:true, ...traVe}` (`:145`). Các lệnh gọi LLM không dùng `stream:true` (`sinh-van-ban.ts:44-60,64-70`). Học sinh không thấy chữ ra sớm hơn: độ trễ đến chữ đầu bằng tổng thời gian xử lý.
- Lỗi (422/429/503/502) luôn là JSON, kể cả khi client xin SSE (SSE chỉ ở nhánh thành công, `tu-van.ts:119-134`). Client xử lý cả hai (`cau-tra-loi.ts:53,108`).
- Sự kiện tiến độ backend (stage): **không có.** SSE chỉ có `token` và `xong`. Server có sẵn mốc đo để phát (`msClef`, `msRag`, `msLLM` ở `bac-thang.ts:192`) nhưng chỉ ghi log.
- Client: `AbortSignal.timeout(25 s)` (`cau-tra-loi.ts:30,49`); **không có nút hủy** (không có `AbortController` do người dùng điều khiển); không retry tự động (chỉ nút "Thử lại" thủ công khi tin có `thuLai`, `tin-may-chu.tsx:189-194`). Yêu cầu chạy ở mức module nên rời màn không hủy (`dang-cho.ts:9-41`). Khung "đang chờ" chỉ có dòng chữ đổi sau 8 giây (`tu-van.tsx:80-84,199`; `khung-chat-mini.tsx:66-70,386`): đây là **đồng hồ giả theo thời gian**, không phản ánh bước thật.
- Phần SSE ở client không xử lý trường hợp luồng đứt giữa chừng khác với lỗi trống: nếu có `fullTraLoi` thì dùng làm đáp (`:87-88`), tức có thể hiện một câu trả lời cụt như thật (không chắc có xảy ra trong thực tế, vì server ghi toàn bộ trước).

**Nếu thêm streaming sự kiện thật, cần đổi:**
1. `tu-van.ts:118-159`: chuyển từ "chờ rồi phát lại" sang tạo `TransformStream` trước, ghi sự kiện `stage` ngay khi bắt đầu và ở từng mốc; `traLoiBacThang` cần nhận callback `baoTienDo(stage)` (hiện không có tham số này, `bac-thang.ts:122`).
2. Quota: hiện toàn bộ giữ/chốt/hoàn lượt chạy **trước** khi mở luồng (`:89-131`). Khi đã trả `200` + header SSE thì không đổi được mã trạng thái; lỗi sau đó phải đi bằng sự kiện `loi` thay vì 422/502. Cần quy ước sự kiện lỗi thay cho mã HTTP. Cân nhắc giữ nguyên "trả JSON cho lỗi sớm (trước khi giữ lượt xong), SSE cho phần sau".
3. Hậu kiểm số liệu (`soLieuLech`) chạy trên **toàn văn** sau khi LLM xong (`bac-thang.ts:180`). Nếu stream token LLM thật tới client, chữ sai sẽ hiện trước khi bị chặn. Phương án an toàn: chỉ stream sự kiện tiến độ (stage) và các thẻ tất định, còn văn bản AI giữ phát sau hậu kiểm (như hiện nay).
4. Client `hoiAI` (`cau-tra-loi.ts:53-106`) đã phân tích SSE theo khối `\n\n` với `data:`; thêm loại sự kiện (`stage`, `the`, `loi`) bằng cách đọc `parsed.su` (hiện bỏ qua mọi trường lạ), nên tương thích ngược về phía client. Phía server cũ mà client mới: bỏ qua sự kiện lạ.

Hạn chế của Cloudflare Pages Functions (kiến thức ngoài repo, **không chắc**, nên kiểm tra tài liệu hiện hành): Functions chạy như Workers nên trả `ReadableStream` được; giới hạn là thời gian CPU, không phải thời gian chờ, nên chờ LLM không tính CPU; có thể có buffering ở một số lớp nén/proxy nếu thiếu `content-type: text/event-stream` và `cache-control: no-cache` (code đã đặt hai header này, `tu-van.ts:152-158`; `connection: keep-alive` không cần với HTTP/2 và có thể bị bỏ qua). `public/_headers` không có cấu hình riêng cho `/api/*`. Cần nhớ: `ctx.waitUntil` cần cho việc ghi cache/hoàn lượt sau khi đã đóng luồng, hiện chưa dùng (hàm `onRequest` chỉ nhận `request, env`, `tu-van.ts:171`).

Tương thích ngược: giữ `stream:true` hiện tại; thêm `stream:"v2"` hoặc header `accept: application/x-ndjson`/tham số `su:1` để máy chủ phát thêm sự kiện; client cũ vẫn chỉ đọc `token` và `xong`.

---

## 5. Công cụ (tool calling)

- **LLM trên đường tư vấn KHÔNG gọi công cụ nào.** Mọi lệnh gọi chỉ có `messages` (system + user), không có `tools`/`functions` (`sinh-van-ban.ts:44-60,64-70,72-82,85-98`). Ngoại lệ duy nhất là plugin tìm web của OpenRouter (`plugins:[{id:"web",max_results:3}]`, `:131`), do nhà cung cấp chạy, không phải hàm của app.
- `src/capabilities` (`catalog.ts`, `index.ts`, `schema.ts`) gồm 8 khả năng: `search_universities`, `get_university`, `search_majors`, `get_admission_rules`, `calculate_admission_score`, `analyze_student_profile`, `recommend_preferences`, `validate_preference_order` (`schema.ts:253-262`), thực thi ở `executeCapability` (`index.ts:167`) với kiểm schema chặt `validateSchema` (`schema.ts:267`). Chúng được dùng bởi `functions/mcp/[ma].ts`, `functions/_thu-vien/ket-noi-cong-cu.ts`, và `functions/api/v1/{admission-score,majors,universities}.ts`. **`functions/api/tu-van.ts` và `bac-thang.ts` không import `src/capabilities`** (grep xác nhận: chỉ 5 file trên). Tức là hai thế giới tách biệt: chatbot web chưa dùng bộ công cụ tất định này.
- MCP có thêm công cụ tên Việt (`lay_ho_so`, `lay_nguyen_vong`, `goi_y_nganh`, `diem_chuan`, `ke_hoach_tuan`, `de_xuat_them_nguyen_vong`, `get_university_profile`, `get_app_capabilities`, `get_study_plan`, `update_study_progress`) ở `ket-noi-cong-cu.ts` (các dòng `ten:` 60-210), cần OAuth/mã kết nối và bản chụp hồ sơ (`BanChup`); `analyze_student_profile`, `recommend_preferences`, `validate_preference_order` báo `AUTH_REQUIRED` nếu thiếu bản chụp (`index.ts:175-176`). Chỉ là đọc, chỉ đề xuất, không ghi (`de_xuat_them_nguyen_vong` ở trạng thái "cho" chờ xác nhận).
- Ai tính số? **Công cụ tất định tính, không phải LLM:**
  - Tổng điểm, nhãn Thử sức/Vừa sức/An toàn/Dự phòng, chênh điểm, dự báo, học phí được client tính (`lay-du-lieu.ts:118-150`, engine `phan-tich`, `du-bao-diem-chuan`) rồi gửi như `SuKien`; server chỉ chuyển ngữ (`bac-thang.ts` ghi chú ở `dungUngVien`).
  - Bảng so sánh tính ở client (`bang-so-sanh.ts:64`), LLM chỉ diễn giải (`NHAC_SO_SANH`).
  - Điểm ưu tiên: có trong `capabilities.calculate_admission_score` nhưng chatbot không gọi.
- Phần còn để LLM tự nói số liệu: LLM tự viết toàn văn. Hậu kiểm `soLieuLech` (`engine/tu-van.ts:333-370`) chỉ kiểm số đứng cạnh "điểm", "triệu/tr", "%", "chỉ tiêu", "tỉ lệ" và năm. **Không kiểm:** (a) số đúng giá trị nhưng gán sai ngành/trường (chỉ kiểm có nằm trong tập số hay không, `:355`); (b) số viết cạnh từ khác ("hạng 3", "khoảng 120 sinh viên"); (c) tên trường, mã trường viết trong văn bản (chỉ danh sách `thucThe`, `hanhDong`, `nguon` được lọc theo dữ liệu gửi kèm, `kiemTraPhanHoiCauTruc` `:271-309`, `locNguon` `:423`); (d) chính sách, quy chế, xác suất bằng chữ ("khả năng cao") không có mẫu regex nào bắt; (e) kiến thức chung (được phép) trong `NHAC_TU_VAN` mục B, tức là câu như "quy chế xét tuyển" hay "ra trường làm gì" có thể mang số hoặc quy định chưa kiểm chứng ngoài các chữ số bị bắt.
  - Khi có web, số trong đoạn trích web được coi là hợp lệ (`bac-thang.ts:180`), trừ câu có "điểm chuẩn" (`:181`).

---

## 6. Dữ liệu gửi lên model

Client dựng `YeuCauTuVan` (`cau-tra-loi.ts:209-212`), server làm sạch bằng `kiemTraYeuCau` (`engine/tu-van.ts:125-169`, loại trường lạ, ép kiểu, cắt độ dài), rồi `dungNoiDung` (`:408-420`) tạo prompt người dùng:

- `HỒ SƠ` (`gonHoSo`, `:397`): lớp, tỉnh, ngành quan tâm, ngân sách, tổ hợp cao nhất kèm tổng; chứng chỉ ngoại ngữ, ĐGNL, học bạ, giải HSG chỉ khi câu hỏi nhắc tới (`:401-404`).
- `DỮ LIỆU`: 2 ngành (3 nếu "so sánh"), mỗi ngành là JSON gọn `gonSuKien` (`:378`): id, ngành, trường, 1 năm điểm (2 năm nếu hỏi xu hướng), tổ hợp, nhãn, chênh, tongCuaEm, học phí, việc làm, khoảng dự báo, trạng thái dữ liệu. Ngân sách đầu vào `NGAN_SACH_TOKEN_DU_LIEU = 300` token ước tính (`:373,416`). Sau Clef còn tối đa 3 ngành (`bac-thang.ts:148`).
- `NGỮ CẢNH`: tối đa 200 ký tự (`:418`), gồm dòng NV1 + kế hoạch học + các lượt trước (câu "Em hỏi/Mình đáp", `hoi-thoai.ts:144-155`). Client gửi tối đa 700 ký tự (`GIOI_HAN.nguCanh`, `:80`), nhưng server cắt còn 200 ở `dungNoiDung`, **nên phần NV1/kế hoạch đặt ở đầu thường còn, còn lượt trước bị cắt mạnh** (suy từ `cau-tra-loi.ts:21-27` và `:418`; chưa chạy để xác nhận độ dài thực).
- RAG: tối đa 6 mảnh, mỗi mảnh tối đa 600 ký tự (`chi-muc.ts:12`, `bac-thang.ts` `MAX_MANH`); mỗi mảnh bọc `bocDuLieuNguoiDung`.
- `CÂU HỎI`: bọc `bocDuLieuNguoiDung` (`:175`: bỏ `<` `>` rồi bọc trong thẻ `<du_lieu_nguoi_dung>`), tối đa 1000 ký tự. Prompt hệ thống dặn không làm theo chỉ dẫn trong thẻ (`DONG_CHONG_CHEN` `:173`).

Dữ liệu cá nhân: không có tên, liên hệ (`HoSoTomTat` `:43`, `lamSachHoSo` `:88`). Vẫn gửi: tỉnh, lớp, điểm, mục tiêu (ngành và trường), giải thưởng ("Giải X môn Y cấp Z", `lay-du-lieu.ts:80`), chứng chỉ, kế hoạch tuần. Khi tắt "Kèm hồ sơ của bạn" thì `hoSo` = null và mọi nhánh dùng state rỗng (`cau-tra-loi.ts:171-188,202,207`). `hoSoId` (UUID) và IP được dùng cho hạn mức. `docs/TU-VAN-AI.md` nói có nút "Xem dữ liệu sẽ gửi đi" nhưng `grep` trong `src` không tìm thấy (không chắc: có thể tên khác).
Các điểm chưa chặt: (1) không bọc dữ liệu hồ sơ trong thẻ, chỉ bỏ `<>` (`:409`) nên dựa vào độ sạch của `lamSachHoSo`; trường `mucTieu`, `giaiThuongHsg` là chuỗi tự do do người dùng nhập, cắt 150/50 ký tự, không bọc thẻ. (2) Clef nhận `interests` đã `bo()` bỏ email, số điện thoại (`clef.ts:107,114`), prompt LLM thì không có bước tương đương.

Kích thước: body client tối đa 16 KB (`GIOI_HAN.kichThuocBody`, `tu-van.ts:35-57`). Ước tính prompt LLM (đã đo bằng `npx tsx` một lần): `NHAC_TU_VAN` 2.028 ký tự, `NHAC_SO_SANH` 1.574, `NHAC_HE_THONG` 2.448 (chỉ là mặc định/khóa cache); `dungNoiDung` với 3 ngành mẫu ~580 ký tự. Thêm RAG tối đa ~3.600 ký tự. Tổng ước tính ~1.200-2.500 token đầu vào (3 ký tự/token theo `bac-thang.ts:192`; tiếng Việt thực tế có thể nhiều token hơn, không chắc), ra tối đa 650-700 token.

Chú ý: mô tả prompt trong `docs/TU-VAN-AI.md` đã lệch code: doc ghi `PHIEN_BAN_LOGIC` = 4 (code `cache.ts:7` là "5"), `max_tokens` 450 (code 650/700), bỏ sót lane `NHAC_TU_VAN`, so sánh, tìm web. `NHAC_HE_THONG` hầu như không còn được dùng trên đường chính (`bac-thang.ts:126` chọn `NHAC_SO_SANH` hoặc `NHAC_TU_VAN`).

---

## 7. Hiệu năng và chi phí

Số lượt gọi mỗi câu hỏi AI (đường đầy đủ, `bac-thang.ts`):
- Workers AI: 1 lần Clef (nếu `AI` và >= 2 ứng viên) + 1 lần nhúng bge-m3 (`chi-muc.ts:143`).
- Vectorize: tối đa ~8 truy vấn song song (bộ lọc tỉnh, các tỉnh nêu trong câu, tối đa 3 trường, 1 toàn kho; `bac-thang.ts` `boLocRag`).
- LLM: 1 lần; lên 2 lần nếu nhánh web lỗi nhanh (< 5 giây) rồi rơi sang đường thường (`:165-169`). Câu so sánh bỏ Clef và RAG.
- D1: đường thành công chạm D1 khoảng 8-10 lượt (giữ 3-4 lượt: IP, hồ sơ, tổng, tùy web, mỗi lượt gồm 1 batch cộng có thể 1 SELECT; chốt 3-4; `luotConLai` 1). Ước tính từ `han-muc-ai.ts:27-45,48-50,60-63`, không đo.
- KV: 1 get + 1 put đếm tần suất, 1 get cache, 1 put ghi cache.

Quota và trần (đã đọc):
| Trần | Giá trị | Nguồn |
|---|---|---|
| theo IP mỗi phút (KV, không nguyên tử) | 8 | `engine/tu-van.ts:80,117` |
| theo hồ sơ mỗi ngày (D1) | 50, `AI_QUOTA_DAILY` 1..10000 | `han-muc-ai.ts:9,17-20` |
| theo IP mỗi ngày (D1) | 40, `AI_IP_NGAY` | `tu-van.ts:22,79` |
| toàn hệ thống mỗi ngày | 500, `AI_TONG_NGAY` | `tu-van.ts:15,96` |
| lượt có tìm web mỗi ngày | 150, `AI_WEB_NGAY` | `tu-van.ts:18,109` |
Giữ chỗ quá 2 phút bị coi là bỏ và hoàn (`han-muc-ai.ts:11,32-33`). Cache hit hoàn tất cả lượt (`tu-van.ts:125`). `422 so-lieu-khong-khop` **vẫn tính lượt** (`:113-122`) vì mô hình đã được gọi. Giới hạn đã biết: `hoSoId` do trình duyệt sinh nên đổi được (`docs/TU-VAN-AI.md`), IP là lớp thứ hai; hai IP đứng sau NAT chia chung trần IP.

Cache: KV 6 giờ (`cache.ts:5`), tiền tố `tvc5:`. Khóa gồm toàn bộ `hoSo` tóm tắt và `nguCanh` (`cache.ts:85-88`), nên **tỷ lệ trúng chéo giữa các học sinh thấp** (hồ sơ mỗi người khác nhau), hầu hết là trúng khi cùng một em hỏi lại. Không cache khi có RAG mà RAG rỗng (`bac-thang.ts:190-191`). Không cache lỗi. `CACHE_KV` và `RATE_KV` cùng một namespace id (`wrangler.jsonc` cả hai là `dd9e8bea...`), nên trần đếm và cache chia chung một kho; dùng chung tiền tố khác nhau (`tv:` và `tvc5:`) nên không đè nhau (không chắc về giới hạn dung lượng).

Độ trễ: ngân sách 12 giây (`bac-thang.ts:45`: Clef 3 giây, RAG 2 giây, LLM tối thiểu 3 giây), client chờ 25 giây (`cau-tra-loi.ts:30`). Không có số đo thật trong repo ngoài log `msClef/msRag/msLLM`.

---

## 8. Khoảng trống so với mục tiêu (cố vấn tuyển sinh thật)

Thang công sức: giờ làm việc của một dev đã quen repo. Rủi ro: thấp, vừa, cao đối với hồi quy hoặc xung đột.

| # | Khoảng trống | Tác động | Đề xuất (1 câu) | Công sức | Rủi ro |
|---|---|---|---|---|---|
| G1 | Không có sự kiện tiến độ thật; chỉ có đồng hồ 8 giây đổi chữ (`tu-van.tsx:80-84`) và stream giả 16 ký tự (`tu-van.ts:141`) | Học sinh thấy "đang soạn" như nhau dù đang tra luật cứng, Clef, RAG hay LLM; không đạt "trạng thái xử lý trung thực" | Thêm `traLoiBacThang(..., baoTienDo)` phát sự kiện `stage` thật qua SSE (đọc, truy xuất, soạn, kiểm số liệu), client hiển thị đúng bước | 10-14 | vừa (đổi vị trí quota/giữ luồng) |
| G2 | `tang` có sẵn nhưng UI không hiển thị; luật cứng client không có nhãn; fallback im lặng (`cau-tra-loi.ts:245-257,305-306`) | Học sinh có thể tưởng câu luật cứng là AI, hoặc ngược lại; khó đối chiếu độ tin cậy | Thêm `nguonCauTraLoi: "quy-tac" \| "du-lieu" \| "cache" \| "ai" \| "ai+web"` vào `TinNhan` và hiện chip nhỏ; luôn ghi `ghiChu` khi AI lỗi rồi thay bằng luật cứng | 4-6 | thấp |
| G3 | Không có `Evidence` có cấu trúc: server chỉ trả `nguon: string[]` id (`engine/tu-van.ts:66`), không kèm số nào trích từ bản ghi nào | Không thể hiện "con số này lấy từ đề án năm X trang Y" cạnh từng ý; khó hậu kiểm gắn đúng ngành | Trả `bangChung: {id, truong, nganh, nam, loai, trang, url}[]` dựng từ `SuKien`+`moTaNguon`, và để LLM chỉ tham chiếu id | 8-12 | vừa (đổi hợp đồng JSON) |
| G4 | Hậu kiểm số chỉ kiểm "có nằm trong tập số" (`engine/tu-van.ts:355`), không kiểm đúng ngành/năm, không kiểm tên trường hay chính sách bằng chữ | Có thể lọt "UIT 27,1" gán sang ngành khác, hoặc câu chính sách bịa không số | Chuyển sang xác thực gắn thực thể: mỗi câu có số phải đi kèm một `[nguồn: id]` và số phải thuộc đúng id đó; thêm danh sách trắng tên trường | 10-16 | cao (có thể chặn nhiều câu tốt, cần đo tỷ lệ chặn) |
| G5 | LLM không dùng công cụ; `src/capabilities` không nối với chatbot (`tu-van.ts` không import) | Nhiều câu "tính điểm", "gợi ý nguyện vọng", "kiểm thứ tự" chỉ dựa vào luật cứng client hoặc để LLM diễn đạt, không có đường tính tất định dùng chung | Dựng `Orchestrator` gọi `executeCapability` (tính điểm, tra trường/ngành) trước khi mời LLM, đưa kết quả công cụ vào evidence | 12-20 | vừa |
| G6 | Chưa có thẻ what-if (điều chỉnh giả định: điểm, tổ hợp, ngân sách, khu vực, ưu tiên) trong chat; chỉ có thẻ ngành, so sánh, tiến độ (`tin-may-chu.tsx`) và màn `thu-tinh-huong` riêng | Học sinh không thử "nếu em tăng 1 điểm Toán" ngay trong chat | Thêm loại thẻ `giaDinh` (slider/chọn) gọi engine tất định (`engine/phan-tich`, `diem-uu-tien`, `du-bao`) ở client, trả bảng thay đổi nhãn | 14-24 | vừa |
| G7 | Phân loại lỗi và độ bền nhà cung cấp: một 502 chung, không retry/back-off/circuit breaker, không đổi nhà cung cấp, `AI_MODEL` ghi đè dùng chung cho cả 3 nhà (`sinh-van-ban.ts:26`, `wrangler.jsonc:38`) | Lỗi auth, rate limit, timeout, context đều hiện như "mạng"; chi phí và sự cố khó chẩn đoán; sai model id với Anthropic/OpenAI | Tách lỗi thành `{loai: auth\|rate\|timeout\|provider\|schema\|context}` ở `goiMoHinh`, log có cấu trúc, tách biến model theo nhà, thêm cooldown ngắn khi 5xx liên tục | 6-10 | thấp |
| G8 | Không có hủy/stop do người dùng; không retry tự động; `hoiAI` không cho `AbortController` ngoài (`cau-tra-loi.ts:49`) | Học sinh phải đợi tối đa 25 giây, không dừng được | Thêm `AbortController` vào `hoiAI`, nút "Dừng", hoàn lượt khi hủy trước khi LLM chạy | 4-6 | thấp |
| G9 | Router ý định chủ yếu regex ở client, rải ở `y-dinh.ts`, `hieu-cau.ts`, `traLoiNoiBo` (`cau-tra-loi.ts:129-136`); `traLoiNoiBo` trả đúng cho mọi câu có "nguyen vong", "diem chuan"... nên các câu tư vấn mở chứa từ này không bao giờ lên LLM | Câu như "Điểm chuẩn thấp nhưng em nên chọn ngành nào" bị trả bằng luật cứng; khó mở rộng | Gom thành một `IntentRouter` có kết quả `{intent, confidence, needsLLM, needsTools}`, có test bảng ý định | 10-16 | vừa (hồi quy hành vi cũ, đã có nhiều test) |
| G10 | Hạn mức tính theo hồ sơ trình duyệt (đổi được) và IP; `422` vẫn trừ lượt; không có quota token hay chi phí thật, không đếm token từ `usage` | Khó kiểm soát chi phí và công bằng; hết lượt cục bộ (`phien.luot.con <= 0`) là bản ghi client, có thể lệch | Ghi `usage` của nhà cung cấp vào log/D1, thêm trần chi phí/ngày thay vì chỉ trần số lượt | 6-10 | thấp |
| G11 | Ngữ cảnh nhiều lượt bị cắt mạnh: client gửi 700 ký tự nhưng server chỉ dùng 200 (`engine/tu-van.ts:418`); không có "bộ nhớ hội thoại" có cấu trúc (trường/ngành đang bàn, giả định đã đặt) | Câu nối tiếp ("còn ngành kia thì sao") phụ thuộc `nganhLuotTruoc` ở client; AI mất ngữ cảnh | Dựng `ContextResolver` ở client: gửi `{truongDangBan, nganhDangBan, giaDinhDangDung}` có cấu trúc thay vì chuỗi tự do | 8-12 | vừa |
| G12 | Tài liệu và mã lệch (doc ghi cache v4, max_tokens 450, thiếu lane web/so sánh; `docs/TU-VAN-AI.md`); Turnstile client không gửi token (`turnstile.ts:27`, grep `src`) | Dễ cấu hình sai khi triển khai (đặt secret là 403 toàn bộ); người mới đọc doc hiểu sai | Cập nhật doc theo code; thêm widget Turnstile hoặc ghi rõ "không đặt secret" | 2-4 | thấp |

Năm khoảng trống quan trọng nhất: G1, G2, G3, G4, G5 (G6 là sản phẩm hóa thẻ what-if, phụ thuộc G5).

---

## 9. Đề xuất kiến trúc mục tiêu (1 trang)

Nguyên tắc: **ranh giới tin cậy** = mọi con số và mã đi qua `Evidence` có cấu trúc do code tất định tạo; LLM chỉ diễn đạt và chọn id. Tái dùng tối đa, thêm một lớp mỏng, giữ `/api/tu-van` cũ chạy song song.

```
Câu hỏi
  -> ContextResolver (client, TS thuần)   gom: hồ sơ, giả định đang đặt, trường/ngành đang bàn, lượt trước  [mới, tái dùng nguCanhLuotTruoc, tomTatHoSo, nganhLuotTruoc]
  -> IntentRouter (client)               {intent, confidence, can: [tinh|truy-xuat|llm]}  [gom từ y-dinh.ts, hieu-cau.ts, traLoiNoiBo, tien-do-chat.ts]
  -> Orchestrator
       tất định:   traLoiTuDong, engine/*, executeCapability (src/capabilities)           [tái dùng]
       truy xuất:  cache KV -> Clef -> RAG                                                [tái dùng bac-thang.ts]
       LLM:        goiMoHinh (chỉ diễn đạt từ Evidence)                                   [tái dùng, tách lỗi]
       hybrid:     tất định trước, LLM diễn đạt, kiểm sau
  -> EvidenceValidator (server)          mỗi con số/mã/tên phải thuộc một Evidence.id;  [nâng cấp soLieuLech, locNguon, kiemTraPhanHoiCauTruc]
  -> ResponseComposer (client)           văn bản + thẻ + nhãn bậc + giả định + nguồn
```

Dùng lại có sẵn: `kiemTraYeuCau` (làm sạch), `bocDuLieuNguoiDung` (chống chèn), `giuLuot/chotLuot/traLaiLuot` (quota nguyên tử), bậc thang cache/Clef/RAG (`bac-thang.ts`), `SuKien`/`gonSuKien`/`dungSuKien` (nguồn sự thật gửi lên), `docPhanHoiLLM` + `kiemTraPhanHoiCauTruc` (kiểm cấu trúc), `src/capabilities` (công cụ), engine tính điểm/nhãn/dự báo/ưu tiên, `TinMayChu` + các thành phần thẻ, `guiNen` (chạy nền).

Thêm mới: (1) `AdvisorResponse` và `Evidence`; (2) `baoTienDo` callback và sự kiện SSE; (3) `IntentRouter` gom luật; (4) `EvidenceValidator` gắn thực thể; (5) thẻ `giaDinh`/what-if; (6) phân loại lỗi nhà cung cấp.

Tương thích ngược: thêm trường tùy chọn vào phản hồi cũ (mọi trường mới `?`); giữ `traLoi`, `nguon`, `tang`, `congDong`, `viecTiep`, `nguonWeb`, `luot`, `intent`, `thucThe`, `hanhDong`, `hoiLai`, `trangThaiDuLieu`; client cũ bỏ qua trường lạ; server nhận `stream:"v2"` mới phát `stage`; cache tăng `PHIEN_BAN_LOGIC` ("6") khi đổi hợp đồng; `TinNhan` đã có `lamSachLichSu` bỏ trường lạ nên lịch sử cũ vẫn đọc được (`hoi-thoai.ts:75-110`).

Kiểu đề xuất (đối chiếu với kiểu thật: `TraLoiTuVan` + `PhanHoiCauTruc` ở `engine/tu-van.ts:62,246`, `KetQuaTuDong` ở `lay-du-lieu.ts:272`, `TinNhan` ở `hoi-thoai.ts:21`, `HanhDongDeXuat` ở `engine/tu-van.ts:236`):

```ts
/** Bậc đã tạo ra câu trả lời, để UI gắn nhãn trung thực. */
type BacTraLoi = "quy-tac" | "du-lieu" | "cache" | "truy-xuat" | "ai" | "ai-web";

interface Evidence {                       // MỚI: mọi con số/mã hiển thị phải trỏ về một Evidence
  id: string;                              // id chương trình hoặc id mảnh RAG, như SuKien.id
  loai: "diem-chuan" | "hoc-phi" | "du-bao" | "to-hop" | "co-dong" | "chinh-sach" | "web";
  maTruong?: string; nganh?: string; nam?: number;
  giaTri?: number | string;                // số đã được tính/ghi bởi code
  trangThai: TrangThaiDuLieu;              // tái dùng: da-xac-minh | lich-su | uoc-tinh | du-bao | chua-co ...
  nguon: string; url?: string;             // tái dùng moTaNguon
}

interface TienDo { stage: "doc-ho-so" | "tra-cuu" | "tinh" | "soan" | "kiem-so-lieu"; ms?: number }  // MỚI, sự kiện thật

interface GiaDinh {                         // MỚI: cho thẻ what-if
  khoa: "diem" | "toHop" | "nganSach" | "khuVuc" | "uuTien"; nhan: string; giaTri: number | string;
  khoangChon?: [number, number]; ketQuaTuDong: true;   // luôn tính bằng engine, không do LLM
}

interface AdvisorResponse extends PhanHoiCauTruc {   // kế thừa: intent, thucThe, hanhDong, hoiLai, trangThaiDuLieu
  traLoi: string;
  bac: BacTraLoi;                          // thay cho `tang` (giữ `tang` để tương thích)
  bangChung: Evidence[];                   // thay cho `nguon: string[]` (giữ `nguon`)
  giaDinh?: GiaDinh[];                     // thẻ what-if
  soSanh?: { ids: string[] };              // như KetQuaTuDong.soSanh
  nguonWeb?: NguonWeb[]; congDong?: string[]; viecTiep?: string;
  luaChon?: LuaChonNhanh[];                // như KetQuaTuDong
  canXacNhan?: boolean;                    // tái dùng từ HanhDongDeXuat
  ghiChu?: string;                         // lý do khi rơi bậc
  loi?: "auth" | "rate" | "timeout" | "provider" | "schema" | "context" | "so-lieu" | "het-luot";
  luot?: { con: number; toiDa: number };
}
```

Thứ tự triển khai gợi ý (giảm rủi ro): (1) G2 nhãn bậc + `ghiChu` khi rơi bậc (không đổi server); (2) G7 phân loại lỗi; (3) G1 `baoTienDo` + SSE v2; (4) G3/G4 `Evidence` + validator; (5) G5 nối capabilities; (6) G6 thẻ what-if. Cần chốt với người đang sửa `bac-thang.ts` và `bo-dieu-phoi.ts` ở repo chính trước bước (3).

---

## Chỗ không chắc (tóm tắt)
- Cấu hình production thật (khóa nào, có `TURNSTILE_SECRET_KEY` không, `AI_MODEL` thật) không đọc được từ repo.
- Giới hạn Cloudflare Pages Functions nêu ở mục 4 là kiến thức ngoài repo, chưa kiểm tra tài liệu hiện hành.
- Số D1/Vectorize/token mỗi lượt là ước tính từ code, không đo.
- Việc `traLoiNoiBo` chặn câu tư vấn mở (G9) suy từ regex, chưa chạy ví dụ thật.
- Nút "Xem dữ liệu sẽ gửi đi" ghi trong doc nhưng không tìm thấy bằng grep.
- Các file đang sửa ở repo chính (không thuộc worktree này) chưa đọc.
