import { Box, Card, Flex, Text } from "@chakra-ui/react";

import ActivityCalender from "react-activity-calendar";
import React from "react";

type levels = 0 | 1 | 2 | 3 | 4;
interface SubsData {
  date: string;
  count: number;
  level?: levels;
}
interface SubmissionCalenderCardProps {
  subsData: SubsData[];
  isLoading: boolean;
}
function SubmissionsCalenderCard({
  subsData,
  isLoading,
}: SubmissionCalenderCardProps) {
  const maxCount = subsData.reduce(
    (acc: number, curr: { date: string; count: number }) => {
      if (curr.count > acc) return curr.count;
      return acc;
    },
    0
  );
  const data: SubsData[] = subsData.map(
    (submission: { date: string; count: number }): SubsData => {
      return {
        count: submission.count,
        date: submission.date,
        level: Math.floor((submission.count / maxCount) * 4) as levels,
      };
    }
  );
  data.unshift({
    level: 0,
    date: "2022-01-01",
    count: 0,
  });
  return (
    <Card w={"100%"} bg={"whiteAlpha.100"} borderRadius={10} p={5} mb={5}>
      <Text fontWeight={"extrabold"} fontSize={"xl"} mb={2}>
        Submission history
      </Text>
      <Flex justify={"center"} h={"100%"} overflowX={"scroll"}>
        <Box w={{ base: "100%", md: "900px" }}>
          <ActivityCalender
            data={data}
            style={{ width: "900px" }}
            loading={isLoading}
            dateFormat=""
            theme={{
              level0: "#ffffff",
              level1: "#c6e48b",
              level2: "#7bc96f",
              level3: "#239a3b",
              level4: "#196127",
            }}
            labels={{
              legend: {
                less: "Less",
                more: "More",
              },
              months: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ],
              tooltip: "<strong>{{count}} Submissions /strong> on {{date}}",
              totalCount: "{{count}} Submissions in {{year}}",
              weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            }}
          />
        </Box>
      </Flex>
    </Card>
  );
}

export default SubmissionsCalenderCard;
