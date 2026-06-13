/**
 * Browser-safe base64 encode/decode for Yjs snapshots (no Node Buffer).
 * Shared by the ducklet create dialog and the practice solve page.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function base64ToUint8Array(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** Whether this browser can gzip a snapshot before upload. */
export function supportsGzip(): boolean {
  return typeof CompressionStream !== "undefined";
}

/**
 * Gzip a Yjs update and base64-encode it. A live solve doc can be hundreds of
 * KB; compressing ~5-10x keeps the upload under the proxy's request-body limit.
 * The server gunzips before storing, so the at-rest format is unchanged.
 */
export async function gzipToBase64(bytes: Uint8Array): Promise<string> {
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  // Copy into an ArrayBuffer-backed view — under cross-origin isolation the
  // source may be SharedArrayBuffer-backed, which isn't a valid BufferSource.
  void writer.write(new Uint8Array(bytes));
  void writer.close();
  const compressed = await new Response(cs.readable).arrayBuffer();
  return uint8ArrayToBase64(new Uint8Array(compressed));
}
