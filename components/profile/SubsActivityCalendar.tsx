import ActivityCalender, {
  CalendarData,
  Skeleton,
} from "react-activity-calendar";

interface SubsData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}
interface SubsActivityCalendarProps {
  subsData: SubsData[];
  isLoading: boolean;
}
function SubsActivityCalendar({
  subsData,
  isLoading,
}: SubsActivityCalendarProps) {
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
        level: Math.floor((submission.count / maxCount) * 4) as
          | 0
          | 1
          | 2
          | 3
          | 4,
      };
    }
  );
  data.unshift({
    level: 0,
    date: "2022-01-01",
    count: 0,
  });
  return (
    <ActivityCalender
      data={data}
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
  );
}

export default SubsActivityCalendar;
