import React from "react";
import { useCurrentUserSubmissionDataForProblem } from "../../hooks/useSubmissionsData";
import { UnorderedList } from "@chakra-ui/react";
import SubmissionListItem from "./SubmissionListItem";

interface SubmissionsTabProps {
  problemId: number;
}
function SubmissionsTab({ problemId }: SubmissionsTabProps) {
  const { data: subData, isLoading } =
    useCurrentUserSubmissionDataForProblem(problemId);

  if (!subData || isLoading) return <p> loading submissions</p>;

  return (
    <UnorderedList
      spacing={4}
      overflow={"auto"}
      height={"80vh"}
      style={{ padding: 0, margin: 0 }}
    >
      {subData.data?.map((sub) => {
        return <SubmissionListItem submission={sub} key={sub.id} />;
      })}
    </UnorderedList>
  );
}

export default SubmissionsTab;
