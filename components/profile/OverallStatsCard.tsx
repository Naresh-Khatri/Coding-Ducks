import { Card, Divider, Flex, HStack, Text } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../FAIcon";
import { IUserStatsResponse } from "../../hooks/useUsersData";
import { LEAGUES } from "../../data/leagues";
import { faFire } from "@fortawesome/free-solid-svg-icons";

function OverallStatsCard({ statsData }: { statsData: IUserStatsResponse }) {
  return (
    <Card w={"100%"} bg={"whiteAlpha.100"} borderRadius={10} mb={5} p={5}>
      <Text fontWeight={"bold"} >Stats</Text>
      <Flex h={"100%"} w={"100%"} alignItems={"center"} mb={5}>
        <Flex
          w={"50%"}
          h={"100%"}
          direction={"column"}
          justify={"space-between"}
          align={"center"}
        >
          <HStack flex={1}>
            <FAIcon
              height={"2rem"}
              icon={LEAGUES[statsData.league].icon}
              color={LEAGUES[statsData.league].color}
            />
          </HStack>
          <Text fontSize={"sm"} fontWeight={"bold"}>
            {LEAGUES[statsData.league].label}
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
          <HStack flex={1}>
            <FAIcon height={"2rem"} icon={faFire} />
            <Text fontSize={"4xl"} fontWeight={"bold"}>
              {statsData.longestStreak.length > 0
                ? statsData.longestStreak.length
                : 0}
            </Text>
            <Text fontSize={"xl"} alignSelf={"end"} mb={2}>
              days
            </Text>
          </HStack>
          <Text fontSize={"sm"} fontWeight={"bold"}>
            Longest Streak{" "}
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
          <Text fontSize={"2xl"} fontWeight={"bold"}>
            {statsData.points}
          </Text>
          <Text fontSize={"sm"}> Points </Text>
        </Flex>
        <Divider orientation="vertical" height={10} />
        <Flex
          w={"50%"}
          h={"100%"}
          direction={"column"}
          justify={"center"}
          align={"center"}
        >
          <Text fontSize={"2xl"} fontWeight={"bold"}>
            {statsData.accuracy}%
          </Text>
          <Text fontSize={"sm"}> success rate </Text>
        </Flex>
      </Flex>
    </Card>
  );
}

export default OverallStatsCard;
