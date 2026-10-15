import React from "react";
import { gop } from "@/components/ui/nut-the";

interface DinhDangMarkdownProps {
  noiDung: string;
  className?: string;
}

/** Tách văn bản thành các khối (bảng, tiêu đề, danh sách, đoạn văn, phân cách). */
export function DinhDangMarkdown({ noiDung, className }: DinhDangMarkdownProps) {
  if (!noiDung) return null;

  const lines = noiDung.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let keyIdx = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Phân cách ngang: --- hoặc ***
    if (/^(\-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push(<hr key={keyIdx++} className="border-t border-vien my-2.5" />);
      i++;
      continue;
    }

    // 2. Tiêu đề: # H1, ## H2, ### H3, #### H4
    const matchH = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (matchH) {
      const level = matchH[1].length;
      const text = matchH[2];
      if (level === 1) {
        blocks.push(<h2 key={keyIdx++} className="text-[17px] font-bold text-muc mt-3 mb-1.5 leading-snug">{parseInline(text)}</h2>);
      } else if (level === 2) {
        blocks.push(<h3 key={keyIdx++} className="text-[15.5px] font-bold text-muc mt-2.5 mb-1 leading-snug">{parseInline(text)}</h3>);
      } else {
        blocks.push(<h4 key={keyIdx++} className="text-[14px] font-bold text-muc mt-2 mb-1 leading-snug">{parseInline(text)}</h4>);
      }
      i++;
      continue;
    }

    // 3. Bảng Markdown: dòng bắt đầu bằng '|' và có dòng tiếp theo là '|---|---|'
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCols = tableLines[0].split("|").slice(1, -1).map((c) => c.trim());
        const hasDivider = /^[|\s\-:]+$/.test(tableLines[1]);
        const bodyStart = hasDivider ? 2 : 1;
        const bodyRows = tableLines.slice(bodyStart).map((r) => r.split("|").slice(1, -1).map((c) => c.trim()));

        blocks.push(
          <div key={keyIdx++} className="my-2.5 overflow-x-auto rounded-xl border border-vien bg-trang shadow-xs [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-xanh-nhat/80 border-b border-vien text-muc font-bold">
                  {headerCols.map((col, cIdx) => (
                    <th key={cIdx} className="px-3 py-2 whitespace-nowrap">
                      {parseInline(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-vien/60 text-chu">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className={gop("hover:bg-slate-50 transition-colors", rIdx % 2 === 1 ? "bg-slate-50/50" : "bg-white")}>
                    {row.map((cell, cIdx) => {
                      const isNhan = /thử sức|vừa sức|an toàn|dự phòng/i.test(cell);
                      const nhanTone = /thử sức/i.test(cell)
                        ? "bg-cam-nhat text-cam-chu border-cam/30"
                        : /vừa sức/i.test(cell)
                        ? "bg-xanh-nhat text-xanh border-xanh/30"
                        : /an toàn/i.test(cell)
                        ? "bg-luc-nhat text-luc-chu border-luc/30"
                        : "bg-slate-100 text-chu border-slate-200";

                      return (
                        <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                          {isNhan ? (
                            <span className={gop("inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border", nhanTone)}>
                              {cell}
                            </span>
                          ) : (
                            parseInline(cell)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 4. Danh sách gạch đầu dòng: - item hoặc * item hoặc 1. item
    const matchBullet = trimmed.match(/^([-*]|\d+\.)\s+(.+)$/);
    if (matchBullet) {
      const listItems: { isOrdered: boolean; text: string }[] = [];
      const isFirstOrdered = /^\d+\./.test(trimmed);

      while (i < lines.length) {
        const curTrim = lines[i].trim();
        const m = curTrim.match(/^([-*]|\d+\.)\s+(.+)$/);
        if (!m) break;
        listItems.push({ isOrdered: /^\d+\./.test(curTrim), text: m[2] });
        i++;
      }

      if (isFirstOrdered) {
        blocks.push(
          <ol key={keyIdx++} className="my-1.5 list-decimal pl-5 space-y-1 text-[13.5px] text-chu">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{parseInline(item.text)}</li>
            ))}
          </ol>
        );
      } else {
        blocks.push(
          <ul key={keyIdx++} className="my-1.5 list-disc pl-5 space-y-1 text-[13.5px] text-chu">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{parseInline(item.text)}</li>
            ))}
          </ul>
        );
      }
      continue;
    }

    // 5. Khối trích dẫn: > quote
    if (trimmed.startsWith(">")) {
      const quotes: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quotes.push(lines[i].trim().replace(/^>\s*/, ""));
        i++;
      }
      blocks.push(
        <blockquote key={keyIdx++} className="my-2 border-l-3 border-xanh bg-xanh-nhat/40 px-3 py-1.5 rounded-r-xl text-[13px] text-chu italic">
          {quotes.map((q, qIdx) => (
            <p key={qIdx} className="leading-relaxed">{parseInline(q)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 6. Dòng trống
    if (trimmed === "") {
      i++;
      continue;
    }

    // 7. Đoạn văn bản thông thường
    const paragraphLines: string[] = [];
    while (i < lines.length) {
      const curTrim = lines[i].trim();
      if (
        curTrim === "" ||
        /^(\-{3,}|\*{3,})$/.test(curTrim) ||
        /^#{1,4}\s+/.test(curTrim) ||
        (curTrim.startsWith("|") && curTrim.endsWith("|")) ||
        /^([-*]|\d+\.)\s+/.test(curTrim) ||
        curTrim.startsWith(">")
      ) {
        break;
      }
      paragraphLines.push(lines[i]);
      i++;
    }

    if (paragraphLines.length > 0) {
      blocks.push(
        <p key={keyIdx++} className="my-1.5 leading-relaxed text-[14px]">
          {paragraphLines.map((pLine, pIdx) => (
            <React.Fragment key={pIdx}>
              {parseInline(pLine)}
              {pIdx < paragraphLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    }
  }

  return <div className={gop("space-y-1 break-words text-chu", className)}>{blocks}</div>;
}

/** Parse in đậm `**`, in nghiêng `*`, code inline `` ` ``, và link `[text](url)` */
function parseInline(text: string): React.ReactNode {
  if (!text) return null;

  // Tách các token: `code`, **bold**, *italic*, [label](url)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code key={index} className="px-1 py-0.5 rounded bg-slate-100 text-[12px] font-mono text-muc border border-slate-200">
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <b key={index} className="font-bold text-muc">
          {part.slice(2, -2)}
        </b>
      );
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <i key={index} className="italic">
          {part.slice(1, -1)}
        </i>
      );
    }

    const matchLink = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (matchLink) {
      return (
        <a key={index} href={matchLink[2]} target="_blank" rel="noreferrer" className="text-xanh font-semibold hover:underline">
          {matchLink[1]}
        </a>
      );
    }

    return part;
  });
}

