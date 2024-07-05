import { Card, Flex, Text } from "@chakra-ui/react";
import { cloneElement } from "react";
import { Activity, ThemeInput } from "react-activity-calendar";
import ActivityCalendar from "react-activity-calendar";

import { Tooltip as ReactTooltip } from "react-tooltip";
type levels = 0 | 1 | 2 | 3 | 4;
interface SubmissionCalenderCardProps {
  subsData: Activity[];
}
const explicitTheme: ThemeInput = {
  // dark: ["#3a3a3a", "#1f6f46", "#28a745", "#48e06f", "#64e36e"],
  dark: ["#3a3a3a", "#6B46C1", "#805AD5", "#9F7AEA", "#B794F4"],
};
function SubmissionsCalenderCard({ subsData }: SubmissionCalenderCardProps) {
  const maxCount = Math.max(...subsData.map((sub) => sub.count));
  const data: Activity[] = subsData
    .map((submission: { date: string; count: number }): Activity => {
      return {
        count: submission.count,
        date: submission.date,
        level: Math.ceil((submission.count / maxCount) * 4) as levels,
      };
    })
    .reverse(); // dont forget to reverse since the calendar starts from the bottom

  const d = new Date();
  const lastYearDate = `${d.getFullYear() - 1}-${
    (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1)
  }-${(d.getDate() < 10 ? "0" : "") + d.getDate()}`;
  const thisYearDate = `${d.getFullYear()}-${
    (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1)
  }-${(d.getDate() < 10 ? "0" : "") + d.getDate()}`;

  if (data[0]?.date !== lastYearDate)
    data.unshift({
      level: 0,
      date: lastYearDate,
      count: 0,
    });
  const lastElement = data.at(-1);
  if (lastElement && lastElement.date !== thisYearDate)
    data.push({
      level: 0,
      date: thisYearDate,
      count: 0,
    });

  return (
    <Card w={"100%"} bg={"whiteAlpha.100"} borderRadius={10} p={5} mb={5}>
      <Text fontWeight={"extrabold"} fontSize={"xl"} mb={2}>
        Submission history
      </Text>
      <Flex justify={"end"} h={"100%"}>
        <Flex w={"100%"} overflowX={"auto"}>
          <ActivityCalendar
            data={data}
            theme={explicitTheme}
            showWeekdayLabels
            renderBlock={(block, activity) =>
              cloneElement(block, {
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
