"use client";

import { use } from "react";
import { userContext } from "../../../../contexts/userContext";
import { useParams } from "next/navigation";
import { useRoomData } from "../../../../hooks/useRoomsData";
import { IUser } from "../../../../types";
import { ISocketRoom } from "../../../../lib/socketio/socketEvents";
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import FAIcon from "../../../../components/FAIcon";
import {
  faBars,
  faCloud,
  faEye,
  faEyeSlash,
  faSlash,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import ShareMenu from "../../../../components/ducklets/ShareMenu";
import { InfoIcon, WarningIcon, WarningTwoIcon } from "@chakra-ui/icons";
import Image from "next/image";
import { getTimeAgo } from "../../../../lib/formatDate";
import DucksletsList from "../../../../components/ducklets/DucksletsList";
import DuckletsNavbar from "../../../../components/ducklets/Navbar";

export default function GuestModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userLoaded } = use(userContext);
  const { roomId } = useParams() as { roomId: string };
  const { data: currRoom, isLoading } = useRoomData({ id: +roomId });
  if (!currRoom) return null;
  return (
    <Flex direction={"column"} h={"100vh"}>
      <DuckletsNavbar user={user} userLoaded={userLoaded} room={currRoom} />
      <Flex flex={1}>{children}</Flex>
    </Flex>
  );
}
