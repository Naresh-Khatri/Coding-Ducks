import React, { useState } from "react";
import {
  Box,
  Button,
  Heading,
  Flex,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  Text,
  HStack,
  RadioGroup,
  Radio,
  Stack,
  Container,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  IconButton,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
} from "@chakra-ui/react";

import AdminLayout from "../../layout/AdminLayout";
import ExerciseRow from "../../components/admin/ExerciseRow";

import { useToast } from "@chakra-ui/react";

import "react-quill/dist/quill.snow.css";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import axios from "../../lib/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const SectionInfo = ({ sections, secIdx, setSections }) => {
  // const [problems, setProblems] = useState(section.problems);

  const handleOnRemoveSectionClick = () => {
    setSections((p) => p.filter((item, index) => secIdx != index));
  };

  const handleOnSectionTitleChange = (e) => {
    setSections((secs) =>
      secs.map((sec, index) => {
        if (secIdx == index) return { ...sec, title: e.target.value };
        else return sec;
      })
    );
  };
  const handleOnAddNewProblem = () => {
    setSections((secs) =>
      secs.map((sec, _secIdx) => {
        if (secIdx == _secIdx)
          return {
            ...sec,
            probelms: sec.problems.push({
              id: sec.problems.length,
              title: "",
              description: "",
              code: "",
            }),
          };
        else return sec;
      })
    );
  };
  console.log(sections);
  if (!sections[0]) return null;
  else
    return (
      <TabPanel>
        <Flex>
          <FormControl mr="5%">
            <FormLabel htmlFor="section-title" fontWeight={"normal"}>
              Section Title
            </FormLabel>
            <Input
              id="first-name"
              placeholder="Title"
              w={"-moz-fit-content"}
              value={sections[secIdx].title}
              onChange={handleOnSectionTitleChange}
            />
          </FormControl>
          <Button colorScheme={"red"} onClick={handleOnRemoveSectionClick}>
            Remove Section
          </Button>
        </Flex>
        <TableContainer>
          <Table>
            <Thead>
              <Tr>
                <Th>Id</Th>
                <Th>Title</Th>
                <Th>problem description</Th>
                <Th>code</Th>
                <Th>delete</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sections[secIdx].problems.map((problem, probIdx) => (
                <ExerciseRow
                  key={problem.id}
                  secIdx={secIdx}
                  probIdx={probIdx}
                  setSections={setSections}
                />
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        <Button colorScheme={"green"} onClick={handleOnAddNewProblem}>
          Add problem
        </Button>
      </TabPanel>
    );
};

const AddExam = () => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [diffLevel, setDiffLevel] = useState("easy");
  const [sections, setSections] = useState([
    {
      id: 0,
      title: "Python Variables",
      problems: [{ id: 0, title: "", description: "", code: "" }],
    },
  ]);

  const router = useRouter();
  const toast = useToast();
  const submit = async () => {
    const payload = {};
    try {
      const res = await axios.post("/problems", payload);
      console.log(res);
      toast({
        title: "Exercise created!",
        status: "success",
        description: "New exam has been created.",
        duration: 9000,
        isClosable: true,
      });
      router.push("/dashboard/problems");
    } catch (error) {
      toast({
        title: "Please check the fields!",
        description: "An error has occured.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      console.log(error);
    }
  };
  const addSectionHandler = () => {
    setSections((p) => [
      ...p,
      {
        id: p.length,
        title: "Insert title here",
        problems: [{ id: 0, title: "", description: "", code: "" }],
      },
    ]);
  };

  return (
    <>
      <AdminLayout>
        <Flex
          direction={"column"}
          p={10}
          w={"100%"}
          alignItems="center"
          overflowY="auto"
        >
          <Container maxW={"8xl"} overflowY="auto">
            <Heading
              w="100%"
              textAlign={"center"}
              fontWeight={"extrabold"}
              fontSize={"4xl"}
              mb={20}
            >
              Create a exercise!
            </Heading>
            <HStack my={3}>
              <FormControl mr="5%">
                <FormLabel htmlFor="first-name" fontWeight={"normal"}>
                  Title
                </FormLabel>
                <Input
                  id="first-name"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormControl>
              <RadioGroup onChange={setDiffLevel} value={diffLevel}>
                <Stack direction="row">
                  <Radio value="easy">Easy</Radio>
                  <Radio value="medium">Medium</Radio>
                  <Radio value="hard">hard</Radio>
                </Stack>
              </RadioGroup>
            </HStack>

            <FormControl mt="2%">
              <FormLabel htmlFor="email" fontWeight={"normal"}>
                Description
              </FormLabel>
              <Box bg="white" color={"black"}>
                <QuillNoSSRWrapper
                  theme="snow"
                  value={desc}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      ["bold", "italic", "underline", "strike", "blockquote"],
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
              <FormHelperText>Describe about your exam</FormHelperText>
            </FormControl>
            <Box my={4}>
              <Text mb={2}>Sections</Text>
              <Tabs variant="enclosed">
                <TabList>
                  {sections.map((section, index) => (
                    <Tab key={index}>{`section: ${index}`}</Tab>
                  ))}

                  <IconButton
                    aria-label="Add section"
                    icon={<FontAwesomeIcon icon={faAdd as IconProp} />}
                    onClick={addSectionHandler}
                  />
                </TabList>
                <TabPanels>
                  {/* {sections.map((section, index) => (
                    <TabPanel key={index}>
                      <Box>{JSON.stringify(section)}</Box>
                    </TabPanel>
                  ))} */}

                  {sections.map((section, index) => (
                    <SectionInfo
                      key={index}
                      sections={sections}
                      secIdx={index}
                      setSections={setSections}
                    />
                  ))}
                </TabPanels>
              </Tabs>
            </Box>
            <FormControl>
              <Button bg="green.500" mt={3} onClick={submit}>
                Create
              </Button>
            </FormControl>
          </Container>
        </Flex>
      </AdminLayout>
    </>
  );
};
export default AddExam;
