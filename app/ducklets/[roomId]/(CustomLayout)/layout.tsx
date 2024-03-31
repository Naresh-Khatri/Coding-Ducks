import axios from "axios";
import generateMeta from "components/SEO/generateMeta";
import { getRoom } from "hooks/useRoomsData";
import { ReactNode } from "react";

export async function generateMetadata({ params }) {
  const { roomId } = params;
  try {
    // const data = await axios.get(`http://localhost:3333/rooms/${roomId}`);
    const data = await getRoom({ id: +roomId });
    const metaData = generateMeta({
      title: `${data.data.name} | Ducklets`,
      description: `Join ${data.data.name}, created By ${data.data.owner?.fullname}\n ${data.data.description}`,
      url: `https://www.codingducks.xyz/ducklets/${roomId}`,
    });
    return metaData;
  } catch (err) {
    console.error(err);
  }
}
function DuckletLayout({ children }: { children: ReactNode }) {
  return children;
}

export default DuckletLayout;
