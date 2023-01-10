import { Box, Container, Flex, Text, useToast } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import UserInfo from "../../components/UserInfo";
import UserStats from "../../components/UserStats";

import NormalLayout from "../../layout/NormalLayout";
import axios from "../../utils/axios";

// import "react-calendar-heatmap/dist/styles.css";
// import CalendarHeatmap from "react-calendar-heatmap";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

function UsersPage() {
  const router = useRouter();
  const { username } = router.query;
  const [user, setUser] = useState();
  const [progress, setProgress] = useState();
  const [graphValues, setGraphValues] = useState([]);
  const toast = useToast();
  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getUserByUsername(username);
        setUser(user);
        const progress = await getUserProgress(user.id);
        setProgress(progress);
        console.log(progress);
        createGraphValues(progress);
      } catch (err) {
        toast({
          title: "User not found",
          description: "The user you are looking for does not exist",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        router.push("/users");
        console.log(err);
      }
    }
    if (username) fetchUser();
  }, [username, router]);

  const createGraphValues = (progress) => {
    const temp = {};
    for (let examId in progress) {
      progress[examId].forEach((sub) => {
        const date = sub.timestamp.split("T")[0];
        if (temp[date]) {
          temp[date]++;
        } else {
          temp[date] = 1;
        }
      });
    }
    for (let date in temp)
      setGraphValues((prev) => [...prev, { date, count: temp[date] }]);
  };
  //get current date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  function shiftDate(date, numDays) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + numDays);
    return newDate;
  }
  function generateData(count, yrange) {
    var i = 0;
    var series = [];
    while (i < count) {
      var x = (i + 1).toString();
      var y =
        Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

      series.push({
        x: x,
        y: y,
      });
      i++;
    }
    return series;
  }
  const series = [
    {
      name: "Mon",
      data: generateData(18, {
        min: 0,
        max: 90,
      }),
    },
    {
      name: "Tue",
      data: generateData(18, {
        min: 0,
        max: 90,
      }),
    },
    {
      name: "Wed",
      data: generateData(18, {
        min: 0,
        max: 90,
      }),
    },
    {
      name: "Thu",
      data: generateData(18, {
        min: 0,
        max: 90,
      }),
    },
    {
      name: "Fri",
      data: generateData(18, {
        min: 0,
        max: 90,
      }),
    },
    {
      name: "Sat",
      data: generateData(18, {
        min: 0,
        max: 90,
      }),
    },
    {
      name: "Sun",
      data: generateData(18, {
        min: 0,
        max: 90,
      }),
    },
  ];
  // console.log(series);

  const options = {
    chart: {
      height: 200,
      type: "heatmap",
    },
    dataLabels: {
      enabled: false,
    },
    colors: ["#008FFB"],
  };
  return (
    <NormalLayout>
      <Container maxW={"8xl"} minH={"100vh"}>
        <Flex align="center" justify={"center"} w={"100%"} h={"100%"} mt={100}>
          <Flex>{user && <UserInfo viewingUser={user} />}</Flex>
          <Flex flexGrow={1} ml={40}>
            {progress && Object.keys(progress).length > 0 ? (
              <UserStats progress={progress} />
            ) : (
              <Text fontSize={"2xl"}>No progress yet</Text>
            )}
          </Flex>
        </Flex>
        {progress && Object.keys(progress).length > 0 && (
          <Flex justify={"center"}>
            <Box w={"900px"} mt={20}>
              <Text fontSize={"xl"} fontWeight={"extrabold"} mb={5}>
                Submission history
              </Text>
              <ReactApexChart
                options={options}
                series={series}
                type="heatmap"
                height={350}
              />
              {/* <CalendarHeatmap
              startDate={shiftDate(new Date(), -365)}
              endDate={new Date()}
              values={graphValues}
              tooltipDataAttrs={(value) => {
                console.log(value);
                return {
                  "data-tip": `oiajsdfkjasldkfj`,
                };
              }}
              showWeekdayLabels={true}
            /> */}
            </Box>
          </Flex>
        )}
      </Container>
    </NormalLayout>
  );
}

// export const getServerSideProps = async (ctx) => {
//   const { username } = ctx.params;
//   // const user = await getUserByUsername(username);
//   return {
//     props: {
//       // user,
//       username,
//     },
//   };
// };

const getUserByUsername = async (username) => {
  const user = await axios.get("/users/username/" + username);
  return user.data;
};
const getUserProgress = async (userId) => {
  const user = await axios.get("/users/progress/" + userId);
  return user.data;
};

export default UsersPage;
