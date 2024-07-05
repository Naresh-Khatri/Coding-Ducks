import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { dracula } from "@uiw/codemirror-theme-dracula";
const supportedLangs = {
  py: python(),
  js: javascript(),
  cpp: cpp(),
  c: cpp(),
  java: java(),
};
import {
  Avatar,
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useSubmissionData } from "../../hooks/useSubmissionsData";
import Link from "next/link";

interface SubmissionViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: number;
}
function SubmissionViewerModal({
  isOpen,
  onClose,
  submissionId,
}: SubmissionViewerModalProps) {
  const { data, isLoading, error } = useSubmissionData(submissionId, isOpen);

  const submission = data?.data;
  if (isLoading || !submission) return <Spinner />;
  const { User: user, Exam: exam, Problem: problem } = submission;
  return (
    <Modal
      onClose={onClose}
      size={"6xl"}
      motionPreset="slideInRight"
      isOpen={isOpen}
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="2px" />
      <ModalContent borderRadius={20}>
        <ModalHeader>Edit Problem</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading || !data ? (
            <Box> loading... </Box>
          ) : (
            <>
              <SimpleGrid columns={2} spacing={10}>
                <Stack>
                  <Box>
                    <HStack gap={10}>
                      <Avatar
                        src={user?.photoURL}
                        name={user.fullname}
                        size={"xl"}
                      />
                      <Box fontWeight="bold">
                        <Box>Name: {user?.fullname}</Box>
                        <Box>Username: {user?.username}</Box>
                        <Box>roll: {user?.roll || "N/A"}</Box>
                      </Box>
                    </HStack>
                  </Box>
                  <Box mt={10}>
                    <SimpleGrid columns={2} spacing={10}>
                      <Box as="span" fontWeight="bold">
                        <HStack>
                          <Text>Tests</Text>
                          <Text
                            as={"span"}
                            fontSize={"6xl"}
                            fontWeight={"bold"}
                            color={
                              submission.tests_passed === submission.total_tests
                                ? "green.500"
                                : "red.500"
                            }
                          >
                            {submission.tests_passed}/{submission.total_tests}
                          </Text>
                        </HStack>
                      </Box>
                      {exam && (
                        <Box as="span" fontWeight="bold">
                          <Text>
                            Exam: {exam?.id}. {exam?.title}
                          </Text>
                          <Link href={`/contests/${exam?.slug}`}>
                            <Button>Open Exam</Button>
                          </Link>
                        </Box>
                      )}
                    </SimpleGrid>
                  </Box>
                  <Box>
                    <TestsTable tests={submission.tests} />
                  </Box>
                  <Box>
                    <Text fontWeight={"bold"} fontSize={"xl"}>
                      {problem.id}. {problem.title}
                    </Text>
                    <Text
                      mt={4}
                      dangerouslySetInnerHTML={{ __html: problem.description }}
                    ></Text>
                  </Box>
                </Stack>
                <Box>
                  <Box as="span">
                    Language:{" "}
                    <Text as={"span"} fontWeight={"bold"}>
                      {submission.lang}
                    </Text>
                  </Box>
                  <CodeMirror
                    autoFocus
                    value={submission.code}
                    height="67vh"
                    style={{ fontSize: "1.2rem", maxWidth: "60vw" }}
                    extensions={[supportedLangs[submission.lang]]}
                    theme={dracula}
                    readOnly={true}
                  />
                </Box>
              </SimpleGrid>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <HStack>
            <Button variant={"outline"} onClick={onClose}>
              Close
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

const TestsTable = ({ tests }) => {
  return (
    <Table>
      <thead>
        <tr>
          <th>id</th>
          <th>input</th>
          <th>output</th>
          <th>expected</th>
          <th>status</th>
        </tr>
      </thead>
      <tbody>
        {tests.map((test, idx) => {
          return (
            <tr key={idx}>
              <td>
                <Text fontWeight="bold">{idx + 1}</Text>
              </td>
              <td>
                <Text
                  fontWeight="bold"
                  dangerouslySetInnerHTML={{ __html: test.input }}
                ></Text>
              </td>
              <td>
                <Text
                  fontWeight="bold"
                  dangerouslySetInnerHTML={{ __html: test.actualOutput }}
                ></Text>
              </td>
              <td>
                <Text
                  fontWeight="bold"
                  dangerouslySetInnerHTML={{ __html: test.output }}
                ></Text>
              </td>
              <td>
                <Text
                  fontWeight="bold"
                  color={test.isCorrect ? "green.400" : "red.400"}
                >
                  {test.isCorrect === true ? "Passed" : "Failed"}
                </Text>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default SubmissionViewerModal;
