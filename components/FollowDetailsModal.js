import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const UserList = ({ user }) => {
  return (
    <Link href={"/users/" + user.username}>
      <Flex justify={"space-between"} alignItems="center" my={2}>
        <Image
          src={user.photoURL}
          width={50}
          height={50}
          alt={user.fullname}
          style={{ borderRadius: "50%" }}
        />
        <Text fontSize={"lg"} fontWeight={"extrabold"}>
          {user.fullname}
        </Text>
        <Box></Box>
      </Flex>
    </Link>
  );
};

const No = ({ text }) => {
  return <Text> This user has no {text}</Text>;
};

function FollowDetailsModal({ onClose, isOpen, followData }) {
  const { followedBy, following } = followData;
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{followData.fullname} </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs isFitted variant="enclosed">
            <TabList mb="1em">
              <Tab>followers</Tab>
              <Tab>following</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                {followedBy.length > 0 ? (
                  followedBy.map((follower) => (
                    <UserList key={follower.id} user={follower} />
                  ))
                ) : (
                  <No text={"followers"} />
                )}
              </TabPanel>
              <TabPanel>
                {following.length > 0 ? (
                  following.map((user) => (
                    <UserList key={user.id} user={user} />
                  ))
                ) : (
                  <No text={"following"} />
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default FollowDetailsModal;
