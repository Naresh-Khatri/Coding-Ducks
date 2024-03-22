import React from "react";
import NormalLayout from "../layout/NormalLayout";
import { Container } from "@chakra-ui/react";
import DuckletsOnboardingModal from "../components/modals/DuckletsOnboardingModal";

function DuckletsPage() {
  return (
    <NormalLayout>
      <DuckletsOnboardingModal />
      <Container maxW="container.xl" minH={"80vh"}></Container>
    </NormalLayout>
  );
}

export default DuckletsPage;
