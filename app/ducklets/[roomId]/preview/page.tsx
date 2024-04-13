"use server";
import { getRoom } from "hooks/useRoomsData";

async function DuckletPreview({ params }) {
  const { roomId } = params as { roomId: number };
  const { data } = await getRoom({ id: roomId });
  const { room, role } = data;
  let srcDoc = `
  <head>${room.contentHEAD}</head>
  <body>${room.contentHTML}</body>
  <style>${room.contentCSS}</style>
  <script>${room.contentJS}</script>
  <script>const as = document.querySelectorAll('a')
as.forEach(a=>{
  a.href = "javascript:void(0)"
})</script>
</html>`;
  return <iframe srcDoc={srcDoc} style={{ width: "100vw", height: "100vh" }} />;
}

export default DuckletPreview;
