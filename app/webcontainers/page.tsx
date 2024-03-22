"use client";
import {
  Button,
  Container,
  HStack,
  Input,
  Radio,
  RadioGroup,
  SimpleGrid,
  Stack,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import axiosInstance from "../../lib/axios";

const FRAMEWORKS = [
  "nextjs",
  "nextsjs-ts",
  "vue",
  "vue-ts",
  "react",
  "react-ts",
  "svelte",
  "vanilla",
  "vanilla-ts",
];
const createWC = async (projectName: string, framework: string) => {
  const { data } = await axiosInstance.post("http://localhost:3333/projects/", {
    framework,
    typescript: false,
    projectName,
  });
  console.log(data);
  return data;
};
const getRooms = async () => {
  const { data } = await axiosInstance.get(
    "http://localhost:3333/projects/user"
  );
  console.log(data);
  return data.data;
};
function WebContainerPage() {
  const [projectName, setProjectName] = useState("");
  const [framework, setFramework] = useState("react");
  const { mutate } = useMutation(["createWC", projectName], () =>
    createWC(projectName, framework)
  );
  const {
    data: projects,
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useQuery(["rooms"], getRooms);
  return (
    <Container maxW={"container.lg"}>
      <Button onClick={() => setProjectName(crypto.randomUUID())}>
        random name
      </Button>
      <Input
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
      />
      <RadioGroup onChange={setFramework} value={framework}>
        <Stack direction="row">
          {FRAMEWORKS.map((f) => (
            <Radio key={f} value={f}>
              {f}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>
      <Button
        onClick={() =>
          mutate(undefined, {
            onSuccess: refetchProjects,
          })
        }
        colorScheme="purple"
        isDisabled={projectName.trim().length <= 3}
      >
        create wc
      </Button>

      <SimpleGrid columns={3}>
        {projectsLoading ? (
          <div>loading</div>
        ) : (
          projects?.map((project) => (
            <Button key={project.id}>{project.name}</Button>
          ))
        )}
      </SimpleGrid>
    </Container>
  );
}

export default WebContainerPage;
