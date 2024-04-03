import { getRoom } from "hooks/useRoomsData";

async function DuckletPreview({ params }) {
  const { roomId } = params as { roomId: number };
  const { data } = await getRoom({ id: roomId });
  const srcDoc = `<html>
  <head>${data.contentHEAD}</head>
  <body>${data.contentHTML}</body>
  <style>${data.contentCSS}</style>
  <script>${data.contentJS}</script>
  <script>const as = document.querySelectorAll('a')
as.forEach(a=>{
  a.href = "javascript:void(0)"
})</script>
</html>`;
  return <iframe srcDoc={srcDoc} style={{ width: "100vw", height: "100vh" }} />;
}

export default DuckletPreview;
