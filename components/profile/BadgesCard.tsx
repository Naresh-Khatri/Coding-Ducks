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
import { IUser } from "../../types";
import Image from "next/image";

function BadgesCard({ userData }: { userData: IUser }) {
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
      justifyContent={"space-between"}
    >
      <Text fontWeight={"extrabold"}>Badges</Text>
      {!userData.isNoob ? (
        <SimpleGrid columns={3} spacing={5} mt={5}>
          <Popover>
            <PopoverTrigger>
              <Flex>
                <Image
                  src="https://ik.imagekit.io/couponluxury/coding_ducks/badges/tutorial-complete_OIT9T9EMn.svg"
                  height={50}
                  width={50}
                  alt="badge"
                />
                {/* <Text>completed tutorial</Text> */}
              </Flex>
            </PopoverTrigger>
            <Portal>
              <PopoverContent w={"200px"}>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverBody>Completed Tutorial!</PopoverBody>
              </PopoverContent>
            </Portal>
          </Popover>
        </SimpleGrid>
      ) : (
        <Text color={"whiteAlpha.400"} textAlign={"center"}>
          No badges yet 😢
          <br /> Complete the basic to get your first badge!
        </Text>
      )}
      <Box></Box>
    </Card>
  );
}

export default BadgesCard;
