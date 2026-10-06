// Định dạng số theo cách viết của người Việt: dấu phẩy thập phân. Dùng cho mọi con số hiển thị cho học sinh.
export const dinhDang = (n: number, soLe = 1): string => n.toFixed(soLe).replace(".", ",");
