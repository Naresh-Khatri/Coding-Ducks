import generateMeta from "_components/SEO/generateMeta";
import { getRoom } from "hooks/useRoomsData";
import { ReactNode } from "react";

export async function generateMetadata({ params }) {
  const { roomId } = params;
  try {
    const data = await getRoom({ id: +roomId });
    const currRoom = data.data.room;
    const metaData = generateMeta({
      title: `${currRoom.name} | Ducklets`,
      description: `Join ${currRoom.name}, created By ${currRoom.owner?.fullname} - ${currRoom.description}`,
      url: `https://www.codingducks.xyz/ducklets/${roomId}`,
      image: currRoom.previewImage,
    });
    return metaData;
  } catch (err) {
    console.warn("cant fetch details of private ducklet");
    return generateMeta({
      title: "Private Ducklet | CodingDucks",
      description: "Join private ducklet, created By - - ",
      url: `https://www.codingducks.xyz/ducklets/${roomId}`,
    });
  }
}
function DuckletLayout({ children }: { children: ReactNode }) {
  return children;
}

export default DuckletLayout;
