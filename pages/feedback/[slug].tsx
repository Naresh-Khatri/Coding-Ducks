import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
} from "@chakra-ui/icons";
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import Image from "next/image";
import { useState } from "react";
import axiosInstance from "../../lib/axios";
import { useRouter } from "next/router";
import Link from "next/link";
import SetMeta from "../../_components/SEO/SetMeta";

type Rating = null | 1 | 2 | 3 | 4 | 5;
interface Ratings {
  difficulty: Rating;
  ui: Rating;
  usefulness: Rating;
  overall: Rating;
  interestInFutureEvents: null | Boolean;
  comment: string;
}
const RATING_DESC_UI = ["Very Bad", "Bad", "Okay", "Good", "Awesome!"];
const RATING_DESC_DIFF = [
  "Very Challenging!",
  "Difficult",
  "Somewhat okay",
  "Easy",
  "Very easy",
];
const RATING_DESC_USEFUL = [
  "Not Useful at all!",
  "Not userful for me",
  "I Dont Know",
  "Useful",
  "Very Useful!",
];

const QUESTIONS = [
  "How was your experience with the user interface?",
  "How was the difficulty level of the questions?",
  "How was the event usefullness?",
  "How would you rate the overall experience?",
  "Would you like to see future events like this?",
  "Any comments? (Optional)",
];
function FeedbackPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [stepCount, setStepCount] = useState(0);
  const [ratings, setRatings] = useState<Ratings>({
    difficulty: null,
    ui: null,
    usefulness: null,
    overall: null,
    interestInFutureEvents: false,
    comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleOnSubmitFeedback = async () => {
    setIsSubmitting(true);
    try {
      const payload = { ...ratings, examSlug: slug };
      const res = await axiosInstance.post("/exams/feedback", payload);
      setIsSubmitting(false);

      setStepCount((p) => p + 1);
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex
      h={"100vh"}
      w={"100vw"}
      px={10}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <SetMeta
        title="Coding Ducks - Feedback and Suggestions"
        description="Provide your valuable feedback and suggestions to help us improve Coding Ducks. We value your input and strive to enhance your coding experience on our platform."
        keywords="feedback, suggestions, user input, coding experience, platform improvement"
      />
      <Stack
        spacing={10}
        maxW={"800px"}
        bg={"white"}
        p={10}
        borderRadius={20}
        justifyContent={"center"}
      >
        {stepCount === 0 && (
          <>
            <Text fontSize={"5xl"} fontWeight={"extrabold"} color={"gray.800"}>
              Awesome job! Now, let&apos;s take a look at your feedback.
            </Text>
            <Button
              w={"40"}
              rightIcon={<ChevronRightIcon />}
              bg={"purple.500"}
              _hover={{ bg: "purple.600" }}
              _active={{ bg: "purple.700" }}
              alignSelf={"end"}
              onClick={() => setStepCount(stepCount + 1)}
            >
              Start!
            </Button>
          </>
        )}
        {stepCount === 1 && (
          <>
            <Text fontSize={"4xl"} fontWeight={"extrabold"} color={"gray.900"}>
              {QUESTIONS[stepCount - 1]}
            </Text>
            <HStack alignSelf={"center"} spacing={5}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <IconButton
                  key={rating}
                  aria-label="star icon"
                  variant={"ghost"}
                  _hover={{ bg: "none" }}
                  _focus={{ bg: "none" }}
                  _active={{ bg: "none" }}
                  onClick={() =>
                    setRatings({ ...ratings, ui: rating as Rating })
                  }
                  icon={
                    <StarIcon
                      fontSize={60}
                      color={
                        ratings.ui && rating <= ratings.ui
                          ? "goldenrod"
                          : "gray.200"
                      }
                    />
                  }
                />
              ))}
            </HStack>
            <Text color={"GrayText"} textAlign={"center"}>
              {(ratings.ui && RATING_DESC_UI[ratings.ui - 1]) ||
                "Select a rating"}
            </Text>

            <HStack alignSelf={"end"}>
              <Button
                size={"lg"}
                leftIcon={<ChevronLeftIcon />}
                variant={"ghost"}
                color={"gray.900"}
                onClick={() => setStepCount(stepCount - 1)}
              >
                Back
              </Button>
              <Button
                size={"lg"}
                rightIcon={<ChevronRightIcon />}
                bg={"purple.500"}
                _hover={{ bg: "purple.600" }}
                _active={{ bg: "purple.700" }}
                disabled={ratings.ui === null}
                onClick={() => setStepCount(stepCount + 1)}
              >
                Next
              </Button>
            </HStack>
          </>
        )}
        {stepCount === 2 && (
          <>
            <Text fontSize={"4xl"} fontWeight={"extrabold"} color={"gray.900"}>
              {QUESTIONS[stepCount - 1]}
            </Text>
            <HStack alignSelf={"center"} spacing={5}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <IconButton
                  key={rating}
                  aria-label="star icon"
                  variant={"ghost"}
                  _hover={{ bg: "none" }}
                  _focus={{ bg: "none" }}
                  _active={{ bg: "none" }}
                  onClick={() =>
                    setRatings({ ...ratings, difficulty: rating as Rating })
                  }
                  icon={
                    <StarIcon
                      fontSize={60}
                      color={
                        ratings.difficulty && rating <= ratings.difficulty
                          ? "goldenrod"
                          : "gray.200"
                      }
                    />
                  }
                />
              ))}
            </HStack>
            <Text color={"GrayText"} textAlign={"center"}>
              {(ratings.difficulty &&
                RATING_DESC_DIFF[ratings.difficulty - 1]) ||
                "Select a rating"}
            </Text>

            <HStack alignSelf={"end"}>
              <Button
                size={"lg"}
                leftIcon={<ChevronLeftIcon />}
                variant={"ghost"}
                color={"gray.900"}
                onClick={() => setStepCount(stepCount - 1)}
              >
                Back
              </Button>
              <Button
                size={"lg"}
                rightIcon={<ChevronRightIcon />}
                bg={"purple.500"}
                _hover={{ bg: "purple.600" }}
                _active={{ bg: "purple.700" }}
                disabled={ratings.difficulty === null}
                onClick={() => setStepCount(stepCount + 1)}
              >
                Next
              </Button>
            </HStack>
          </>
        )}
        {stepCount === 3 && (
          <>
            <Text fontSize={"4xl"} fontWeight={"extrabold"} color={"gray.900"}>
              {QUESTIONS[stepCount - 1]}
            </Text>
            <HStack alignSelf={"center"} spacing={5}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <IconButton
                  key={rating}
                  aria-label="star icon"
                  variant={"ghost"}
                  _hover={{ bg: "none" }}
                  _focus={{ bg: "none" }}
                  _active={{ bg: "none" }}
                  onClick={() =>
                    setRatings({ ...ratings, usefulness: rating as Rating })
                  }
                  icon={
                    <StarIcon
                      fontSize={60}
                      color={
                        ratings.usefulness && rating <= ratings.usefulness
                          ? "goldenrod"
                          : "gray.200"
                      }
                    />
                  }
                />
              ))}
            </HStack>
            <Text color={"GrayText"} textAlign={"center"}>
              {(ratings.usefulness &&
                RATING_DESC_USEFUL[ratings.usefulness - 1]) ||
                "Select a rating"}
            </Text>

            <HStack alignSelf={"end"}>
              <Button
                size={"lg"}
                leftIcon={<ChevronLeftIcon />}
                variant={"ghost"}
                color={"gray.900"}
                onClick={() => setStepCount(stepCount - 1)}
              >
                Back
              </Button>
              <Button
                size={"lg"}
                rightIcon={<ChevronRightIcon />}
                bg={"purple.500"}
                _hover={{ bg: "purple.600" }}
                _active={{ bg: "purple.700" }}
                disabled={ratings.usefulness === null}
                onClick={() => setStepCount(stepCount + 1)}
              >
                Next
              </Button>
            </HStack>
          </>
        )}
        {stepCount === 4 && (
          <>
            <Text fontSize={"4xl"} fontWeight={"extrabold"} color={"gray.900"}>
              {QUESTIONS[stepCount - 1]}
            </Text>
            <HStack alignSelf={"center"} spacing={5}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <IconButton
                  key={rating}
                  aria-label="star icon"
                  variant={"ghost"}
                  _hover={{ bg: "none" }}
                  _focus={{ bg: "none" }}
                  _active={{ bg: "none" }}
                  onClick={() =>
                    setRatings({ ...ratings, overall: rating as Rating })
                  }
                  icon={
                    <StarIcon
                      fontSize={60}
                      color={
                        ratings.overall && rating <= ratings.overall
                          ? "goldenrod"
                          : "gray.200"
                      }
                    />
                  }
                />
              ))}
            </HStack>
            <Text color={"GrayText"} textAlign={"center"}>
              {(ratings.overall && RATING_DESC_UI[ratings.overall - 1]) ||
                "Select a rating"}
            </Text>

            <HStack alignSelf={"end"}>
              <Button
                size={"lg"}
                leftIcon={<ChevronLeftIcon />}
                variant={"ghost"}
                color={"gray.900"}
                onClick={() => setStepCount(stepCount - 1)}
              >
                Back
              </Button>
              <Button
                size={"lg"}
                rightIcon={<ChevronRightIcon />}
                bg={"purple.500"}
                _hover={{ bg: "purple.600" }}
                _active={{ bg: "purple.700" }}
                disabled={ratings.overall === null}
                onClick={() => setStepCount(stepCount + 1)}
              >
                Next
              </Button>
            </HStack>
          </>
        )}
        {stepCount === 5 && (
          <>
            <Text fontSize={"4xl"} fontWeight={"extrabold"} color={"gray.900"}>
              {QUESTIONS[stepCount - 1]}
            </Text>
            <SimpleGrid columns={2} spacing={10}>
              <Flex
                direction={"column"}
                alignItems={"center"}
                border={
                  ratings.interestInFutureEvents === false
                    ? "6px solid #9d4edd"
                    : "2px solid gray"
                }
                p={2}
                borderRadius={20}
                onClick={() =>
                  setRatings({
                    ...ratings,
                    interestInFutureEvents: false,
                  })
                }
              >
                <Image
                  src="https://ik.imagekit.io/couponluxury/63d98670936397.5bb439fbdfabb_jxOOxoUWlm.gif"
                  alt="no"
                  style={{
                    filter:
                      ratings.interestInFutureEvents === false
                        ? "grayscale(0%)"
                        : "grayscale(100%)",
                  }}
                  width={250}
                  height={250}
                />
                <Text
                  color={"gray.900"}
                  fontWeight={"extrabold"}
                  textAlign={"center"}
                  fontSize={"xl"}
                >
                  No
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                alignItems={"center"}
                border={
                  ratings.interestInFutureEvents === true
                    ? "6px solid #9d4edd"
                    : "2px solid gray"
                }
                p={2}
                borderRadius={20}
                onClick={() =>
                  setRatings({
                    ...ratings,
                    interestInFutureEvents: true,
                  })
                }
              >
                <Image
                  src="https://ik.imagekit.io/couponluxury/4d576970936397.5bb439fbdc379_Xb4K44zuY.gif"
                  alt="Yes"
                  style={{
                    filter:
                      ratings.interestInFutureEvents === true
                        ? "grayscale(0%)"
                        : "grayscale(100%)",
                  }}
                  width={250}
                  height={250}
                />
                <Text
                  color={"gray.900"}
                  fontWeight={"extrabold"}
                  textAlign={"center"}
                  fontSize={"xl"}
                >
                  Yes
                </Text>
              </Flex>
            </SimpleGrid>

            <HStack alignSelf={"end"}>
              <Button
                size={"lg"}
                leftIcon={<ChevronLeftIcon />}
                variant={"ghost"}
                color={"gray.900"}
                onClick={() => setStepCount(stepCount - 1)}
              >
                Back
              </Button>
              <Button
                size={"lg"}
                rightIcon={<ChevronRightIcon />}
                bg={"purple.500"}
                _hover={{ bg: "purple.600" }}
                _active={{ bg: "purple.700" }}
                disabled={ratings.interestInFutureEvents === null}
                onClick={() => setStepCount(stepCount + 1)}
              >
                Next
              </Button>
            </HStack>
          </>
        )}
        {stepCount === 6 && (
          <>
            <Text fontSize={"4xl"} fontWeight={"extrabold"} color={"gray.900"}>
              {QUESTIONS[stepCount - 1]}
            </Text>
            <Textarea
              style={{ border: "2px solid gray", borderRadius: "10px" }}
              value={ratings.comment}
              onChange={(e) =>
                setRatings({ ...ratings, comment: e.target.value })
              }
              color={"gray.900"}
              border={"black"}
              placeholder="Here is a sample placeholder"
              size="sm"
              resize={"vertical"}
            />

            <HStack alignSelf={"end"}>
              <Button
                size={"lg"}
                leftIcon={<ChevronLeftIcon />}
                variant={"ghost"}
                color={"gray.900"}
                onClick={() => setStepCount(stepCount - 1)}
              >
                Back
              </Button>
              <Button
                size={"lg"}
                bg={"purple.500"}
                _hover={{ bg: "purple.600" }}
                _active={{ bg: "purple.700" }}
                isLoading={isSubmitting}
                onClick={handleOnSubmitFeedback}
              >
                Submit
              </Button>
            </HStack>
          </>
        )}
        {stepCount === 7 && (
          <>
            <Text fontSize={"4xl"} fontWeight={"extrabold"} color={"gray.900"}>
              Thank you for your feedback!
            </Text>
            <Link
              href={"/"}
              style={{ display: "flex", flexDirection: "row-reverse" }}
            >
              <Button
                bg={"purple.500"}
                _hover={{ bg: "purple.600" }}
                _active={{ bg: "purple.700" }}
              >
                Home
              </Button>
            </Link>
          </>
        )}
      </Stack>
    </Flex>
  );
}

export default FeedbackPage;
