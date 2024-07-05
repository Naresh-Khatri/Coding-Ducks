import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  FormControl,
  FormLabel,
  Input,
  HStack,
  Stack,
  Container,
  Select,
  Switch,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";

import AdminLayout from "../../layout/AdminLayout";

import "react-quill/dist/quill.snow.css";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import axios from "../../lib/axios";
import { UIChallengeDifficulty } from "../../types";
import { CHALLENGE_DIFFICULTIES } from "constants/index";
import EditorsWithPreview from "_components/editors/EditorsWithPreview";

const QuillNoSSRWrapper = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const AddProblemPage = () => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [diffLevel, setDiffLevel] = useState(CHALLENGE_DIFFICULTIES[0].name);
  const [ogImageScale, setOgImageScale] = useState(0);

  const [content, setContent] = useState({
    head: "",
    html: "",
    css: "body{\n  font-family: Montserrat,sans-serif;\n  margin:0px;\n  height: 100vh;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n",
    js: "",
  });

  const router = useRouter();
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

  const submit = async () => {
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

    try {
      const res = await axios.post("/ui-challenges", payload);
      console.log(res);
      toast({
        title: "Problem created!",
        status: "success",
        description: "New Problem has been created.",
        duration: 9000,
        isClosable: true,
      });
      router.push("/dashboard/ui-challenges");
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

  return (
    <>
      <AdminLayout>
        <Container maxW={"8xl"} overflowY="scroll">
          <Stack>
            <Heading
              textAlign={"left"}
              fontWeight={"extrabold"}
              fontSize={"4xl"}
              m={10}
            >
              Create a Challenge!
            </Heading>
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
                  defaultValue={"newbie"}
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
                  checked={isPublic}
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
                  onChange={(e) => setOgImageScale(+e.target.value)}
                >
                  <option value="0">Ignore</option>
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                  <option value="4">4x</option>
                </Select>
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

            <FormControl>
              <Button bg="green.500" mt={3} onClick={submit}>
                Create
              </Button>
            </FormControl>
          </Stack>
        </Container>
      </AdminLayout>
    </>
  );
};

export default AddProblemPage;
