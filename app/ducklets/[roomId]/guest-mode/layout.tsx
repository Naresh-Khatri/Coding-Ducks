import { getRoom } from "../../../../hooks/useRoomsData";
import generateMeta from "_components/SEO/generateMeta";

export async function generateMetadata({ params }) {
  const { roomId } = params;
  try {
    const data = await getRoom({ id: +roomId });
    const currRoom = data.data.room;
    if (!currRoom.isPublic) return;
    const metaData = generateMeta({
      title: `${currRoom.name} | Ducklets`,
      description: `Join ${currRoom.name}, created By ${currRoom.owner?.fullname} - ${currRoom.description}`,
      url: `https://www.codingducks.xyz/ducklets/${roomId}`,
    });
    return metaData;
  } catch (err) {
    console.warn("cant fetch details of private ducklet");
  }
}
function GuestModeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
export default GuestModeLayout;
