export function getAvatarUrl(seed: string | null | undefined, size = 128) {
  const s = seed || "default";
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(s)}&size=${size}`;
}
