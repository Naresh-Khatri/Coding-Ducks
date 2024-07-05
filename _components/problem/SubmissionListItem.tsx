import React from "react";
import { ISubmission } from "../../types";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import {
  Badge,
  Box,
  Flex,
  IconButton,
  ListItem,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { formatDate } from "../../lib/formatDate";
import ViewSubmissionModal from "./ViewSubmissionModal";
import { lang2Label } from "../../lib/utils";
import FAIcon from "../FAIcon";

interface SubmissionListItemProps {
  submission: ISubmission;
}
function SubmissionListItem({ submission }: SubmissionListItemProps) {
  const { onOpen, isOpen, onClose } = useDisclosure();

  return (
    <ListItem
      key={submission.id}
      listStyleType={"none"}
      style={{
        border: "1px solid rgba(255,255,255,.125)",
        borderRadius: "10px",
      }}
      h={16}
      p={2}
      px={4}
    >
      <Flex h={"100%"} alignItems={"center"} justifyContent={"space-between"}>
        <Flex direction={"column"}>
          <Text
            fontWeight={"bold"}
            color={submission.marks === 10 ? "green.500" : "red.500"}
          >
            {submission.marks === 10 ? "Accepted" : "Error"}
          </Text>
          <Text fontSize={"sm"} color={"whiteAlpha.700"}>
            {formatDate(submission.timestamp)}
          </Text>
        </Flex>
        <Box>
          <Badge colorScheme={"blue"} p={1} px={2} mr={10} borderRadius={15}>
            {lang2Label[submission.lang]}
          </Badge>
          <IconButton
            onClick={onOpen}
            aria-label="view-submission"
            icon={<FAIcon icon={faEye} />}
          />
        </Box>
      </Flex>
      {isOpen && (
        <ViewSubmissionModal
          isOpen={isOpen}
          onClose={onClose}
          submissionId={submission.id}
        />
      )}
    </ListItem>
  );
}

export default SubmissionListItem;
