import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import AdminLayout from "../../layout/AdminLayout";

import {
  useAChallengeAttemptsData,
  useChallengesData,
  useARecalcScores,
  useARemoveChallenge,
  useAUpdateChallenge,
} from "hooks/useChallengesData";
import Image from "next/image";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import FAIcon from "_components/FAIcon";
import { faEdit, faStar, faTrash } from "@fortawesome/free-solid-svg-icons";
import { IUIChallenge, UIChallengeDifficulty } from "types";
import { useEffect, useRef, useState } from "react";
import { CHALLENGE_DIFFICULTIES } from "constants/index";
import { useRouter } from "next/router";
import axiosInstance from "lib/axios";
import dynamic from "next/dynamic";
import EditorsWithPreview from "_components/editors/EditorsWithPreview";

import "react-quill/dist/quill.snow.css";
import { getTimeAgo } from "lib/formatDate";
import UserAvatar from "_components/utils/UserAvatar";
const QuillNoSSRWrapper = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const COLUMNS = [
  {
    Header: "ID",
    accessor: "id",
  },
  {
    Header: "Preview",
    accessor: "desktopPreview",
  },
  {
    Header: "Title",
    accessor: "title",
  },
  {
    Header: "Active",
    accessor: "active",
  },
  {
    Header: "Actions",
    accessor: "",
  },
];

function ChallengesPage() {
  const {
    data: challengesData,
    isLoading: challengesDataIsLoading,
    error: challengesDataError,
    refetch: refetchChallengeData,
  } = useChallengesData();
  console.log(challengesData);
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [selectedChallenge, setSelectedChallenge] = useState<IUIChallenge>();
  const [showArchive, setShowArchive] = useState(false);
  const filteredChallenges = challengesData?.filter(
    (challenge) => challenge.isPublic || showArchive
  );

  if (challengesDataIsLoading || !challengesData) return <div>Loading...</div>;

  return (
    <AdminLayout>
      <Flex direction={"column"} w={"full"} overflow={"auto"}>
        <HStack p={10} w={"100%"} justifyContent={"space-between"}>
          <HStack>
            <Link href="/dashboard/add-ui-challenge">
              <Button bg="green.400">Add Challenge</Button>
            </Link>
            <Button bg="green.400" onClick={() => refetchChallengeData()}>
              Refresh
            </Button>
          </HStack>
          <HStack>
            <Checkbox
              checked={showArchive}
              onChange={(e) => setShowArchive(e.target.checked)}
            >
              Show Archive
            </Checkbox>
          </HStack>
        </HStack>
        <TableContainer overflowY={"scroll"}>
          <Table>
            <Thead>
              <Tr>
                <Th isNumeric>ID</Th>
                <Th>Preview</Th>
                <Th>title</Th>
                <Th>Active</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredChallenges?.map((challenge) => (
                <Tr key={challenge.id}>
                  <Td isNumeric>{challenge.id}</Td>
                  <Td>
                    <HStack>
                      <Image
                        src={challenge.desktopPreview}
                        alt="preview"
                        width={300}
                        height={300}
                        style={{ height: "150px", width: "auto" }}
                      />
                      <Image
                        src={challenge.mobilePreview}
                        alt="preview"
                        width={300}
                        height={300}
                        style={{ height: "150px", width: "auto" }}
                      />
                      <Image
                        src={challenge.ogImage}
                        alt="preview"
                        width={300}
                        height={300}
                        style={{ height: "150px", width: "auto" }}
                      />
                    </HStack>
                  </Td>
                  <Td>{challenge.title}</Td>
                  <Td>{challenge.isPublic ? <CheckIcon /> : <CloseIcon />}</Td>
                  <Td>
                    <HStack>
                      <ViewScoresModal challengeId={challenge.id} />
                      <IconButton
                        aria-label="Edit Exam"
                        icon={<FAIcon icon={faEdit} />}
                        onClick={() => {
                          setSelectedChallenge(challenge);
                          onEditOpen();
                        }}
                      />
                      <IconButton
                        aria-label="Delete Exam"
                        bg="red.300"
                        icon={<FAIcon icon={faTrash} />}
                        onClick={() => {
                          setSelectedChallenge(challenge);
                          onDeleteOpen();
                        }}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
            {/* <Tfoot>
              <Tr>
                <Th isNumeric>ID</Th>
                <Th>Preview</Th>
                <Th>Active</Th>
                <Th>Action</Th>
              </Tr>
            </Tfoot> */}
          </Table>
        </TableContainer>
        {/* <CustomTable
          columns={COLUMNS}
          data={challengesData}
          refetchData={refetchChallengeData}
          hasSort
        /> */}
        {isEditOpen && challengesData && (
          <EditModal
            isOpen={isEditOpen}
            onClose={onEditClose}
            challengeData={selectedChallenge!}
            refetch={refetchChallengeData}
          />
        )}
        {isDeleteOpen && challengesData && (
          <DeleteModal
            isOpen={isDeleteOpen}
            onClose={onDeleteClose}
            challengeData={selectedChallenge!}
            refetch={refetchChallengeData}
          />
        )}
      </Flex>
    </AdminLayout>
  );
}

export default ChallengesPage;
const ViewScoresModal = ({ challengeId }: { challengeId: number }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const finalRef = useRef(null);
  const { data: attempts, isLoading: attemptsIsLoading } =
    useAChallengeAttemptsData(challengeId);
  const { mutate: recalculate, isLoading: isRecalculating } =
    useARecalcScores();
    const toast = useToast()
  const handleOnRecalculateClick = (attemptId: number) => {
    recalculate({ challengeId, attemptId }, {
      onSuccess: (data) => {
        toast({
          title: "Recalculated",
          description: "New score is" +data[0].score,
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      }
    });
  };
  return (
    <>
      <IconButton
        aria-label="view scores"
        icon={<FAIcon icon={faStar} />}
        onClick={onOpen}
      />
      <Modal
        finalFocusRef={finalRef}
        isOpen={isOpen}
        onClose={onClose}
        size={"6xl"}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>View Attempts</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>id</Th>
                    <Th>user</Th>
                    <Th> time</Th>
                    <Th>images</Th>
                    <Th> score</Th>
                    <Th> action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {attempts?.map((attempt) => (
                    <Tr key={attempt.id}>
                      <Td>{attempt.id}</Td>
                      <Td>
                        <VStack>
                          <UserAvatar
                            alt="preview"
                            src={attempt.user.photoURL}
                            h={40}
                            w={40}
                          />
                          <Text>{attempt.user.username}</Text>
                        </VStack>
                      </Td>
                      <Td>{getTimeAgo(attempt.createdAt)}</Td>
                      <Td>
                        <HStack>
                          <Image
                            src={attempt.imgCode}
                            alt="preview"
                            width={300}
                            height={300}
                            style={{ height: "150px", width: "auto" }}
                          />
                        </HStack>
                      </Td>
                      <Td>{attempt.score}</Td>
                      <Td>
                        <HStack>
                          <Button
                            isLoading={isRecalculating}
                            onClick={() => {
                              handleOnRecalculateClick(attempt.id);
                            }}
                          >
                            Recalculate
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
                <Tfoot>
                  <Tr>
                    <Th>To convert</Th>
                    <Th>into</Th>
                    <Th isNumeric>multiply by</Th>
                  </Tr>
                </Tfoot>
              </Table>
            </TableContainer>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant="ghost">Secondary Action</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

const EditModal = ({
  isOpen,
  onClose,
  challengeData,
  refetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  challengeData: IUIChallenge;
  refetch: () => void;
}) => {
  const [title, setTitle] = useState(challengeData.title);
  const [slug, setSlug] = useState(challengeData.slug);
  const [desc, setDesc] = useState(challengeData.description);
  const [isPublic, setIsPublic] = useState(challengeData.isPublic);
  const [diffLevel, setDiffLevel] = useState(challengeData.difficulty);
  const [ogImageScale, setOgImageScale] = useState(challengeData.ogImageScale);

  const [content, setContent] = useState({
    head: challengeData.contentHEAD,
    html: challengeData.contentHTML,
    css: challengeData.contentCSS,
    js: challengeData.contentJS,
  });

  const { mutate: updateChallenge, isLoading: challengeUpdating } =
    useAUpdateChallenge();

  const toast = useToast();

  const beforeunload = (e) => {
    console.log("called unload");
    e.preventDefault();
    return (e.returnValue = "");
  };
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!title && !slug && !desc && !diffLevel) {
      removeEventListener("beforeunload", beforeunload);
    } else {
      addEventListener("beforeunload", beforeunload);
      addEventListener("unload", beforeunload);
    }
  }, [title, slug, desc, diffLevel]);

  const handleUpdateClicked = async () => {
    const payload = {
      title,
      description: desc,
      difficulty: diffLevel,
      slug,
      head: content.head,
      html: content.html,
      css: content.css,
      js: content.js,
      isPublic,
      ogImageScale: ogImageScale,
    };

    updateChallenge(
      { challengeId: challengeData.id, payload },
      {
        onSuccess: () => {
          toast({
            title: "Problem created!",
            status: "success",
            description: "New Problem has been created.",
            duration: 9000,
            isClosable: true,
          });
          refetch();
          onClose();
        },
        onError: () => {
          toast({
            title: "Please check the fields!",
            description: "An error has occured.",
            status: "error",
            duration: 9000,
            isClosable: true,
          });
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxWidth={"80%"}>
        <ModalHeader>Update UI Challenge</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack>
            <HStack>
              <FormControl mr="5%">
                <FormLabel htmlFor="title" fontWeight={"normal"}>
                  Title
                </FormLabel>
                <Input
                  id="title"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormControl>
              <FormControl mr="5%">
                <FormLabel htmlFor="slug" fontWeight={"normal"}>
                  Slug
                </FormLabel>
                <Input
                  id="slug"
                  placeholder="Slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  htmlFor="difficulty"
                  display={"flex"}
                  gap={2}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                >
                  Difficulty
                  <Box
                    h={"1rem"}
                    w={"1rem"}
                    borderRadius={"full"}
                    bg={
                      CHALLENGE_DIFFICULTIES.find(
                        (diff) => diff.name === diffLevel
                      )?.colorScheme + ".400"
                    }
                  ></Box>
                </FormLabel>
                <Select
                  id="difficulty"
                  value={diffLevel}
                  onChange={(e) =>
                    setDiffLevel(e.target.value as UIChallengeDifficulty)
                  }
                >
                  {CHALLENGE_DIFFICULTIES.map((diff) => (
                    <option value={diff.name} key={diff.name}>
                      {diff.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl display="flex" alignItems="center" pl={"2rem"}>
                <FormLabel htmlFor="is-public" mb="0">
                  isPublic
                </FormLabel>
                <Switch
                  id="is-public"
                  defaultChecked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
              </FormControl>
              <FormControl>
                <FormLabel
                  htmlFor="og-img-scale"
                  display={"flex"}
                  gap={2}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                >
                  OG Image Scale
                </FormLabel>
                <Select
                  id="og-img-scale"
                  value={ogImageScale}
                  onChange={(e) =>
                    // @ts-ignore
                    setOgImageScale(+e.target.value)
                  }
                >
                  <option value="0">Ignore</option>
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                  <option value="4">4x</option>
                </Select>
              </FormControl>
            </HStack>

            <HStack justifyContent={"end"}>
              <RecalculateScoreAlert challengeId={challengeData.id} />
            </HStack>
            <FormControl mt="2%">
              <FormLabel htmlFor="description" fontWeight={"normal"}>
                Description
              </FormLabel>
              <Box bg="white" color={"black"}>
                <QuillNoSSRWrapper
                  theme="snow"
                  id="description"
                  value={desc}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      [
                        "bold",
                        "italic",
                        "underline",
                        "strike",
                        "blockquote",
                        "script",
                      ],
                      ["code"],
                      [
                        { list: "ordered" },
                        { list: "bullet" },
                        { indent: "-1" },
                        { indent: "+1" },
                      ],
                      ["link", "image"],
                      ["clean"],
                    ],
                  }}
                  onChange={setDesc}
                />
              </Box>
            </FormControl>
            <FormControl>
              <EditorsWithPreview
                content={content}
                setContent={setContent}
                height="500px"
              />
            </FormControl>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <HStack>
            <Button variant={"outline"} onClick={onClose}>
              Close
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleUpdateClicked}
              isLoading={challengeUpdating}
            >
              update
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
function RecalculateScoreAlert({ challengeId }: { challengeId: number }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef(null);
  const { mutate: recalculateScores, isLoading: recalculatingScores } =
    useARecalcScores();

  return (
    <>
      <Button
        colorScheme="red"
        onClick={onOpen}
        isLoading={recalculatingScores}
      >
        Recalculate Scores
      </Button>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Recalculate Scores?
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? You can&apos;t undo this action afterwards.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => recalculateScores({ challengeId })}
                ml={3}
                isLoading={recalculatingScores}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

const DeleteModal = ({
  isOpen,
  onClose,
  challengeData,
  refetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  challengeData: IUIChallenge;
  refetch: () => void;
}) => {
  const { mutate, isLoading } = useARemoveChallenge();

  const toast = useToast();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{challengeData.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>Are you sure you wanna delete this challenge?</Text>
          <Flex justify={"center"} p={5} pointerEvents={"none"}>
            <Image
              src={challengeData.desktopPreview}
              alt="preview"
              width={300}
              height={300}
            />
          </Flex>
        </ModalBody>

        <ModalFooter>
          <HStack>
            <Button variant={"outline"} onClick={onClose}>
              Close
            </Button>
            <Button
              bg="red.500"
              isLoading={isLoading}
              onClick={() => {
                mutate(challengeData.id, {
                  onSuccess: () => {
                    onClose();
                    refetch();
                    toast({
                      title: "Challenge deleted",
                      status: "success",
                      duration: 2000,
                      isClosable: true,
                    });
                  },
                  onError: () => {
                    toast({
                      title: "Could'nt delete challenge",
                      status: "error",
                      duration: 9000,
                      isClosable: true,
                    });
                  },
                });
              }}
            >
              Delete
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
