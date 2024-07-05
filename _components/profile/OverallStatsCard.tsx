import { Card, Divider, Flex, HStack, Text } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../FAIcon";
import { LEAGUES } from "../../data/leagues";
import { IUserStatsResponse } from "../../types";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

function OverallStatsCard({ statsData }: { statsData: IUserStatsResponse }) {
  return (
    <Card w={"100%"} bg={"whiteAlpha.100"} borderRadius={10} mb={5} p={5}>
      <Text fontWeight={"bold"}>Stats</Text>
      <Flex h={"100%"} w={"100%"} alignItems={"center"} mb={5}>
        <Flex
          w={"50%"}
          h={"100%"}
          direction={"column"}
          justify={"space-between"}
          align={"center"}
        >
          <Text fontWeight={"bold"} fontSize={"4xl"}>
            {statsData.rank}
          </Text>
          <Text fontSize={"sm"} fontWeight={"bold"}>
            Rank
          </Text>
        </Flex>
        <Divider orientation="vertical" height={20} />
        <Flex
          w={"50%"}
          h={"100%"}
          direction={"column"}
          justify={"space-between"}
          align={"center"}
        >
          <FAIcon
            height={"2rem"}
            icon={LEAGUES[statsData.league].icon as IconProp}
            color={LEAGUES[statsData.league].color}
          />
          <Text fontSize={"sm"} fontWeight={"bold"} mt={3}>
            {LEAGUES[statsData.league].label}
          </Text>
        </Flex>
      </Flex>
      <Flex h={"100%"} w={"100%"} alignItems={"center"}>
        <Flex
          w={"50%"}
          h={"100%"}
          direction={"column"}
          justify={"center"}
          align={"center"}
        >
          <Text fontSize={"2xl"} fontWeight={"bold"}>
            {statsData.totalProblemsSolved}
          </Text>
          <Text fontSize={"sm"}> solved </Text>
        </Flex>
        <Divider orientation="vertical" height={10} />
        <Flex
          w={"50%"}
          h={"100%"}
          direction={"column"}
          justify={"center"}
          align={"center"}
        >
          <HStack>
            {/* <FAIcon height={"1.4rem"} icon={faFire} /> */}
            <Text fontSize={"3xl"} fontWeight={"bold"} lineHeight={1.2}>
              {statsData.longestStreak || "N/A"}
            </Text>
            <Text fontSize={"md"} alignSelf={"end"} color={"whiteAlpha.600"}>
              days
            </Text>
          </HStack>
          <Text fontSize={"sm"} textAlign={"center"}>
            Longest Streak{" "}
          </Text>
        </Flex>
        <Divider orientation="vertical" height={10} />
        <Flex
          w={"50%"}
          h={"100%"}
          direction={"column"}
          justify={"space-between"}
          align={"center"}
        >
          <Text fontSize={"2xl"} fontWeight={"bold"}>
            {statsData.points}
          </Text>
          <Text fontSize={"sm"}> Points </Text>
        </Flex>
      </Flex>
    </Card>
  );
}

export default OverallStatsCard;
