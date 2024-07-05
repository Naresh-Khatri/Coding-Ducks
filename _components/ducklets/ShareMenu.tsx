"use client";
import { Button, useClipboard, useToast } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../FAIcon";
import { faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";

function ShareMenu() {
  const { hasCopied, onCopy } = useClipboard(window?.location?.href);
  const toast = useToast();
  return (
    <>
      <Button
        onClick={() => {
          onCopy();
          toast({
            title: "Link Copied",
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "top",
          });
        }}
        variant={hasCopied ? "solid" : "outline"}
        size={"sm"}
        aria-label="share button"
        leftIcon={<FAIcon icon={faArrowUpFromBracket} />}
      >
        Share
      </Button>
    </>
  );
}

export default ShareMenu;
