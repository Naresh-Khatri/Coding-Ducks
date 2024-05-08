import {
  Box,
  Button,
  CloseButton,
  Divider,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useUserRoomsData } from "../../hooks/useUsersData";
import { formatDate, getTimeAgo } from "../../lib/formatDate";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

interface IDuckletsListProp {
  userId: number;
}
function DucksletsList({ userId }: IDuckletsListProp) {
  const { data, isLoading, error } = useUserRoomsData({ userId });

  const [searchText, setSearchText] = useState("");

  const filteredDucklets = data
    ? data.filter((room) =>
        room.name.toLowerCase().includes(searchText.toLowerCase())
      )
    : [];

  const { roomId } = useParams() as { roomId: string };
  if (error) return <p> Something went wrong</p>;
  if (isLoading) return <Spinner />;
  if (data?.length === 0) return <p>No rooms found</p>;
  return (
    <div>
      <HStack mb={"2rem"}>
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search Your Ducklets"
        />
        <CloseButton onClick={() => setSearchText("")} />
      </HStack>
      {filteredDucklets?.map((room) => (
        <Box key={room.id}>
          <a href={`/ducklets/${room.id}`}>
            <HStack
              justifyContent={"space-between"}
              h={"3rem"}
              bg={+roomId === room.id ? "gray.600" : "none"}
              _hover={{ bg: "gray.500" }}
              borderRadius={"5px"}
              my={2}
              px={2}
              cursor={"pointer"}
            >
              <Text fontWeight={"bold"}>{room.name}</Text>
              <Text textAlign={"right"} color={"gray.500"}>
                {room.updatedAt ? getTimeAgo(room.updatedAt) : "NA"}
              </Text>
            </HStack>
          </a>
          <Divider />
        </Box>
      ))}
    </div>
  );
}

export default DucksletsList;
