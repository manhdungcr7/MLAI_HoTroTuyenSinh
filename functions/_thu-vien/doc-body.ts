/** Read at most the allowed bytes, including requests without Content-Length. */
export class ThanQuaLon extends Error {}
export async function docChuGioiHan(request: Request, toiDa: number): Promise<string> {
  if (Number(request.headers.get("content-length")) > toiDa) throw new ThanQuaLon();
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let soByte = 0, chu = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      soByte += value.byteLength;
      if (soByte > toiDa) { await reader.cancel(); throw new ThanQuaLon(); }
      chu += decoder.decode(value, { stream: true });
    }
    return chu + decoder.decode();
  } finally { reader.releaseLock(); }
}
