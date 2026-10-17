// Liên kết trong nội dung markdown chỉ được dẫn tới http:, https:, mailto:. Chạy: npx tsx tests/markdown-lien-ket.test.ts
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DinhDangMarkdown, hrefAnToan } from "../src/components/ui/dinh-dang-markdown";

assert.equal(hrefAnToan("https://a.vn/x"), "https://a.vn/x");
assert.equal(hrefAnToan("http://a.vn"), "http://a.vn");
assert.equal(hrefAnToan("mailto:a@b.vn"), "mailto:a@b.vn");
for (const xau of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", " javascript:alert(1)", "java\tscript:alert(1)", "data:text/html,<b>", "vbscript:x", "//evil.vn", "/tuong-doi"]) assert.equal(hrefAnToan(xau), null, xau);

const html = renderToStaticMarkup(createElement(DinhDangMarkdown, { noiDung: "Xem [đề án](https://a.vn/x) và [bấm](javascript:alert(1))." }));
assert.ok(html.includes('href="https://a.vn/x"'), html);
assert.ok(!html.includes("javascript:"), "không còn liên kết javascript:");
assert.ok(html.includes("bấm"), "chữ vẫn hiện thường");
console.log("markdown-lien-ket: OK");
