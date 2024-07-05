import {
  Avatar,
  Box,
  Button,
  Flex,
  Link,
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
import { useRouter } from "next/router";
import NextLink from "next/link";
import React from "react";
import { IUser } from "../types";

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
                    <UserList
                      key={follower.id}
                      user={follower}
                      onClose={onClose}
                    />
                  ))
                ) : (
                  <No text={"followers"} />
                )}
              </TabPanel>
              <TabPanel>
                {following.length > 0 ? (
                  following.map((user) => (
                    <UserList key={user.id} user={user} onClose={onClose} />
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
interface UserListProps {
  user: IUser;
  caption?: string;
  onClose: () => void;
}
export const UserList = ({ user, caption, onClose }: UserListProps) => {
  return (
    <Link as={NextLink} href={`/users/${user.username}`} onClick={onClose}>
      <Flex justify={"space-between"} alignItems="center" my={2}>
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            width={50}
            height={50}
            alt={user.fullname}
            style={{ borderRadius: "50%" }}
          />
        ) : (
          <Avatar name={user.fullname} />
        )}
        <Text fontSize={"md"} fontWeight={"extrabold"}>
          {user.fullname}
        </Text>
        <Text fontSize={"sm"} color={"whiteAlpha.500"}>
          {caption}
        </Text>
      </Flex>
    </Link>
  );
};

const No = ({ text }) => {
  return <Text> This user has no {text}</Text>;
};

export default FollowDetailsModal;
