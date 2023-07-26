import {
  Box,
  Card,
  Flex,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Portal,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { IBadge, IUser } from "../../types";
import Image from "next/image";

function BadgesCard({ userData }: { userData: IUser }) {
  const badges: IBadge[] = [];
  if (!userData.isNoob)
    badges.push({
      name: "completed tutorial",
      description: "Completed the tutorial",
      image:
        "https://ik.imagekit.io/couponluxury/coding_ducks/badges/tutorial-complete_OIT9T9EMn.svg",
    });

  return (
    <Card
      w={"100%"}
      minH={"221px"}
      h={"100%"}
      bg={"whiteAlpha.100"}
      borderRadius={10}
      p={5}
      mb={5}
      display={"flex"}
      // justifyContent={"center"}
    >
      <Text fontWeight={"extrabold"}>Badges</Text>

      {badges.length ? (
        <SimpleGrid columns={3} spacing={5} mt={5}>
          {badges.map((badge) => (
            <Badge key={badge.name} badge={badge} />
          ))}
        </SimpleGrid>
      ) : (
        <Box mt={"50px"}>
          <Text color={"whiteAlpha.400"} textAlign={"center"}>
            No badges yet 😢
            <br /> Complete the basic to get your first badge!
          </Text>
        </Box>
      )}
      {/* <Box></Box> */}
    </Card>
  );
}

const Badge = ({ badge }: { badge: IBadge }) => {
  return (
    <Popover>
      <PopoverTrigger>
        <Flex w={'fit-content'}>
          <Image
            src={badge.image}
            height={50}
            width={50}
            alt="badge"
            style={{ cursor: "pointer" }}
          />
        </Flex>
      </PopoverTrigger>
      <Portal>
        <PopoverContent w={"200px"}>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverBody>{badge.description}</PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};

export default BadgesCard;
