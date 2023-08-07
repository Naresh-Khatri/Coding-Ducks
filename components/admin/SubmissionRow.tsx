import {
  Avatar,
  HStack,
  IconButton,
  Td,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import React from "react";
import SubmissionViewerModal from "./SubmissionViewerModal";
import { ISubmission } from "../../types";
import FAIcon from "../FAIcon";

function SubmissionRow({ submission }: { submission: ISubmission }) {
  const dateTime = new Date(submission.timestamp).toLocaleString().split(",");
  const time = `${dateTime[1].split(":")[0]}:${dateTime[1].split(":")[1]}`;
  const date = `${dateTime[0]}`;
  const {
    User,
    code,
    examId,
    id,
    lang,
    marks,
    tests,
    tests_passed,
    timestamp,
    total_tests,
    userId,
  } = submission;
  const { onOpen, onClose, isOpen } = useDisclosure();

  return (
    <>
      <Td>{id}</Td>
      <Td>{examId}</Td>
      <Td>
        <Avatar
          src={User.photoURL}
          name="profile picture"
          width={50}
          height={50}
          style={{ borderRadius: "50%" }}
        />
      </Td>
      <Td>{User.fullname}</Td>
      <Td>{lang}</Td>
      <Td>{marks}</Td>
      <Td>
        <Text align={"center"}>
          {time}
          <br />
          {date}
        </Text>
      </Td>
      <Td>
        {tests_passed}/{total_tests}
      </Td>

      <Td>
        <HStack>
          <IconButton
            aria-label="Edit Problem"
            icon={<FAIcon icon={faEye} />}
            onClick={onOpen}
          />
          {isOpen && (
            <SubmissionViewerModal
              submissionId={id}
              isOpen={isOpen}
              onClose={onClose}
            />
          )}
        </HStack>
      </Td>
    </>
  );
}

export default SubmissionRow;
