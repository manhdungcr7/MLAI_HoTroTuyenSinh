/** Bỏ dấu tiếng Việt và hạ chữ thường, để tìm "bach khoa" ra "Bách Khoa". */
export function fold(text: string | null | undefined): string {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Mọi từ khóa (cách nhau bằng khoảng trắng) đều có trong văn bản, không phân biệt dấu. */
export function matchesQuery(haystack: string, query: string): boolean {
  const h = fold(haystack);
  return fold(query).split(" ").filter(Boolean).every((word) => h.includes(word));
}
