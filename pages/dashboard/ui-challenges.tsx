import {
  Box,
  Button,
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
} from "@chakra-ui/react";
import Link from "next/link";
import AdminLayout from "../../layout/AdminLayout";

import {
  useChallengesData,
  useRemoveChallenge,
  useUpdateChallenge,
} from "hooks/useChallengesData";
import Image from "next/image";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import FAIcon from "components/FAIcon";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { IUIChallenge, UIChallengeDifficulty } from "types";
import { useEffect, useState } from "react";
import { CHALLENGE_DIFFICULTIES } from "constants/index";
import { useRouter } from "next/router";
import axiosInstance from "lib/axios";
import dynamic from "next/dynamic";
import EditorsWithPreview from "components/editors/EditorsWithPreview";

import "react-quill/dist/quill.snow.css";
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

  if (challengesDataIsLoading || !challengesData) return <div>Loading...</div>;

  return (
    <AdminLayout>
      <Container maxW="container.xl" overflow={"auto"}>
        <HStack m={10}>
          <Link href="/dashboard/add-ui-challenge">
            <Button bg="green.400">Add Challenge</Button>
          </Link>
          <Button bg="green.400" onClick={() => refetchChallengeData()}>
            Refresh
          </Button>
        </HStack>

        <TableContainer>
          <Table variant="">
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
              {challengesData?.map((challenge) => (
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
                    </HStack>
                  </Td>
                  <Td>{challenge.title}</Td>
                  <Td>{challenge.isPublic ? <CheckIcon /> : <CloseIcon />}</Td>
                  <Td>
                    <HStack>
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
      </Container>
    </AdminLayout>
  );
}

export default ChallengesPage;

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

  const [content, setContent] = useState({
    head: challengeData.contentHEAD,
    html: challengeData.contentHTML,
    css: challengeData.contentCSS,
    js: challengeData.contentJS,
  });

  const { mutate, isLoading } = useUpdateChallenge();

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

  const updateChallenge = async () => {
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
    };

    mutate(
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
              onClick={updateChallenge}
              isLoading={isLoading}
            >
              update
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

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
  const { mutate, isLoading } = useRemoveChallenge();

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
