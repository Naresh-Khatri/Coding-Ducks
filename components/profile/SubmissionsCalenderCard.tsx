import React from "react";

import { Box, Card, Flex, Text } from "@chakra-ui/react";
import { Activity, ThemeInput } from "react-activity-calendar";
import ActivityCalendar from "react-activity-calendar";

import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
type levels = 0 | 1 | 2 | 3 | 4;
interface SubmissionCalenderCardProps {
  subsData: Activity[];
  isLoading: boolean;
}
const explicitTheme: ThemeInput = {
  dark: ["#3a3a3a", "#1f6f46", "#28a745", "#48e06f", "#64e36e"],
};
function SubmissionsCalenderCard({
  subsData,
  isLoading,
}: SubmissionCalenderCardProps) {
  console.log(subsData);
  const maxCount = Math.max(...subsData.map((sub) => sub.count));
  const data: Activity[] = subsData.map(
    (submission: { date: string; count: number }): Activity => {
      return {
        count: submission.count,
        date: submission.date,
        level: Math.ceil((submission.count / maxCount) * 4) as levels,
      };
    }
  );
  const d = new Date();
  const lastYearDate = `${d.getFullYear() - 1}-${
    (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1)
  }-${(d.getDate() < 10 ? "0" : "") + d.getDate()}`;
  const thisYearDate = `${d.getFullYear()}-${
    (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1)
  }-${(d.getDate() < 10 ? "0" : "") + d.getDate()}`;

  data.unshift({
    level: 0,
    date: lastYearDate,
    count: 0,
  });
  data.push({
    level: 0,
    date: thisYearDate,
    count: 0,
  });
  console.log(new Date().toISOString().split("T")[0]);

  return (
    <Card w={"100%"} bg={"whiteAlpha.100"} borderRadius={10} p={5} mb={5}>
      <Text fontWeight={"extrabold"} fontSize={"xl"} mb={2}>
        Submission history
      </Text>
      <Flex justify={"end"} h={"100%"}>
        <Flex w={{ base: "100%", md: "700px" }} overflowX={"auto"}>
          <ActivityCalendar
            style={{ width: "800px" }}
            data={data}
            theme={explicitTheme}
            showWeekdayLabels
            renderBlock={(block, activity) =>
              React.cloneElement(block, {
                "data-tooltip-id": "react-tooltip",
                "data-tooltip-html": `${activity.count} activities on ${activity.date}`,
              })
            }
          />
          <ReactTooltip id="react-tooltip" />
        </Flex>
      </Flex>
    </Card>
  );
}

export default SubmissionsCalenderCard;
