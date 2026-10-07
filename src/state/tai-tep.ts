// Tải một tệp văn bản về máy (dùng cho bản sao lưu khi không lưu được hoặc app gặp lỗi).
export function taiTepJson(noiDung: string, tenTep = `nguyen-vong-ai-${new Date().toISOString().slice(0, 10)}.json`) {
  const url = URL.createObjectURL(new Blob([noiDung], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = tenTep;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
