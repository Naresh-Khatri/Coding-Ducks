"use client";

import { use, useEffect } from "react";
import { userContext } from "../../../../contexts/userContext";
import { useParams } from "next/navigation";
import { getRoom, useRoomData } from "../../../../hooks/useRoomsData";
import DuckletsNavbar from "../../../../components/ducklets/Navbar";
// import generateMeta from "components/SEO/generateMeta";
import { Flex } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

// export async function generateMetadata({ params }) {
//   const { roomId } = params;
//   try {
//     const data = await getRoom({ id: roomId });
//     const metaData = generateMeta({
//       title: `${data.data.name}(guest) | Ducklets`,
//       description: `Join ${data.data.name}, created By ${data.data.owner?.fullname}\n ${data.data.description}`,
//       url: `https://www.codingducks.live/ducklets/${roomId}`,
//     });
//     return metaData;
//   } catch (err) {}
// }
export default function GuestModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userLoaded } = use(userContext);
  const { roomId } = useParams() as { roomId: string };
  const { data: currRoom, isLoading } = useRoomData({ id: +roomId });
  const router = useRouter();
  useEffect(() => {
    // if current user is owner or in allowed list then redirect to edit
    const userIsAllowedToEdit =
      user &&
      currRoom &&
      (user.id === currRoom.ownerId ||
        currRoom.allowedUsers?.some((u) => u.id === user.id));
    if (userIsAllowedToEdit) router.push(`/ducklets/${roomId}`);
  }, [userLoaded]);
  if (!currRoom || !userLoaded) return null;
  return (
    <Flex direction={"column"} h={"100vh"}>
      <DuckletsNavbar user={user} userLoaded={userLoaded} room={currRoom} />
      <Flex flex={1}>{children}</Flex>
    </Flex>
  );
}
