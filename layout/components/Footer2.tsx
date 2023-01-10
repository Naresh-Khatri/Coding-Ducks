import { Button, Flex, HStack, useColorModeValue } from "@chakra-ui/react";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useContext } from "react";
import problemsContext from "../../contexts/problemsContext";

function Footer() {
  const {
    setSelectedOptions,
    currentProblemId,
    goToNextProblem,
    goToPreviousProblem,
    currentSelectedOption,
  } = useContext(problemsContext);

  //TODO: send response to backend
  const handleNextBtnClick = () => {
    setSelectedOptions((prevSelectedOptions) => {
      console.log("before: ", prevSelectedOptions);
      let newOptions = prevSelectedOptions.map((option, idx) => {
        if (idx == currentProblemId) {
          return currentSelectedOption;
        } else return option;
      });
      console.log("after: ", prevSelectedOptions);

      return newOptions;
      // console.log(newOptions);
    });
    goToNextProblem();
  };
  return (
    <Flex
      bg={useColorModeValue("gray.300", "gray.900")}
      h={"80px"}
      position="fixed"
      bottom={0}
      w={"100%"}
      zIndex={1}
      justify={"space-around"}
      align={"center"}
    >
      <Button
        variant={"ghost"}
        leftIcon={<FontAwesomeIcon icon={faBookmark} />}
        disabled
      >
        Mark for review
      </Button>
      <HStack>
        <Button variant={"outline"} onClick={goToPreviousProblem}>
          Previous
        </Button>
        <Button variant={"solid"} onClick={handleNextBtnClick}>
          Save & Next
        </Button>
      </HStack>
    </Flex>
  );
}

export default Footer;
