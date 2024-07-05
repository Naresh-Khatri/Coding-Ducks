import {
  Button,
  Flex,
  HStack,
  ListItem,
  Text,
  Tooltip,
  UnorderedList,
  useMediaQuery,
} from "@chakra-ui/react";
import { faThumbsDown, faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import { FC } from "react";
import {
  useProblemRatingData,
  useUpdateProblemRating,
} from "../../hooks/useProblemsData";
import Image from "next/image";
import Link from "next/link";
import FAIcon from "../FAIcon";
import { IRatingUser } from "../../types";
import UserAvatar from "_components/utils/UserAvatar";

interface LikeDislikeButtonsProps {
  problemId: number;
}
const LikeDislikeButtons: FC<LikeDislikeButtonsProps> = ({ problemId }) => {
  const [isMobile] = useMediaQuery("(max-width: 768px)", {
    fallback: true,
  });
  const {
    data: ratingData,
    isLoading: ratingIsLoading,
    refetch: refetchRating,
  } = useProblemRatingData({ problemId });

  const likeMutation = useUpdateProblemRating({
    action: "like",
    problemId,
    onSuccess: refetchRating,
  });

  const dislikeMutation = useUpdateProblemRating({
    action: "dislike",
    problemId,
    onSuccess: refetchRating,
  });

  const removeBothMutation = useUpdateProblemRating({
    action: "remove",
    problemId,
    onSuccess: refetchRating,
  });

  const handleBtnPress = (action: "like" | "dislike") => {
    if (ratingData?.userRating === action) {
      removeBothMutation.mutate();
    } else {
      if (ratingData?.userRating) {
        removeBothMutation.mutate();
      }
      if (action === "like") {
        likeMutation.mutate();
      } else {
        dislikeMutation.mutate();
      }
    }
  };

  // console.log(ratingData);
  return (
    <HStack>
      <Tooltip
        hasArrow
        borderRadius={10}
        bg={"gray.700"}
        label={
          ratingData?.rating?.likes && !isMobile ? (
            <UsersList users={ratingData.rating.likes} />
          ) : null
        }
        openDelay={0}
      >
        <Button
          aria-label="like problem"
          variant={"solid"}
          rounded={"full"}
          colorScheme={ratingData?.userRating === "like" ? "purple" : "gray"}
          isLoading={
            ratingIsLoading ||
            likeMutation.isLoading ||
            removeBothMutation.isLoading
          }
          onClick={() => handleBtnPress("like")}
          leftIcon={<FAIcon icon={faThumbsUp} />}
        >
          {ratingData?.rating?.likes?.length || "0"}
        </Button>
      </Tooltip>
      <Tooltip
        hasArrow
        borderRadius={10}
        bg={"gray.700"}
        label={
          ratingData?.rating?.dislikes && !isMobile ? (
            <UsersList users={ratingData.rating.dislikes} />
          ) : null
        }
        openDelay={0}
      >
        <Button
          aria-label="dislike problem"
          variant={"solid"}
          rounded={"full"}
          colorScheme={ratingData?.userRating === "dislike" ? "purple" : "gray"}
          isLoading={
            ratingIsLoading ||
            dislikeMutation.isLoading ||
            removeBothMutation.isLoading
          }
          onClick={() => handleBtnPress("dislike")}
          leftIcon={<FAIcon icon={faThumbsDown} />}
        >
          {ratingData?.rating?.dislikes?.length || "0"}
        </Button>
      </Tooltip>
    </HStack>
  );
};

const UsersList: FC<{ users: IRatingUser[] }> = ({ users }) => {
  return (
    <UnorderedList>
      {users.map((user) => (
        <ListItem key={user.id} style={{ listStyle: "none" }}>
          <Flex alignItems="center" justifyContent="space-between" p={1}>
            <UserAvatar
              src={user.photoURL || ""}
              name={user.username}
              alt="user profile"
              w={30}
              h={30}
              style={{ borderRadius: "50%" }}
            />
            <Link href={`/users/${user.username}`}>
              <Text ml={4} color={"gray.50"} fontWeight={"bold"}>
                {user.username}
              </Text>
            </Link>
          </Flex>
        </ListItem>
      ))}
    </UnorderedList>
  );
};

export default LikeDislikeButtons;
