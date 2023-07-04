import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { IProblem } from "../../types";
import ProblemStatementTab from "../ProblemStatement";
import SubmissionsTab from "./SubmissionsTab";

interface LeftTabsContainerProps {
  problemData: IProblem;
  tabIndex: number;
  setTabIndex: (index: number) => void;
}
function LeftTabsContainer({
  problemData,
  tabIndex,
  setTabIndex,
}: LeftTabsContainerProps) {
  return (
    <Box>
      <Tabs
        variant="line"
        colorScheme="purple"
        index={tabIndex}
        onChange={(idx) => setTabIndex(idx)}
      >
        <TabList mb="1em">
          <Tab fontWeight={"bold"}>Description</Tab>
          <Tab fontWeight={"bold"}>Editorial</Tab>
          <Tab fontWeight={"bold"}>Discussions</Tab>
          <Tab fontWeight={"bold"}>Submissions</Tab>
        </TabList>
        <TabPanels>
          <TabPanel m={0} p={0}>
            <ProblemStatementTab problem={problemData} />
          </TabPanel>
          <TabPanel>
            <p>Editorial would be here soon!</p>
          </TabPanel>
          <TabPanel>
            <p>Discussions coming soon...</p>
          </TabPanel>
          <TabPanel>
            <SubmissionsTab problemId={problemData.id} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default LeftTabsContainer;
