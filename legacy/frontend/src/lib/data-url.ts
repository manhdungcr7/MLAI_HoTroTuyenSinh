/** Đường dẫn tới file dữ liệu công khai, đúng cả khi web chạy ở thư mục con (GitHub Pages). */
export const dataUrl = (path: string): string => `${import.meta.env.BASE_URL}data/${path}`;
