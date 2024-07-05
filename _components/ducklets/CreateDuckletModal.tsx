import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  Text,
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { faGlobe, faLock } from "@fortawesome/free-solid-svg-icons";
import FAIcon from "_components/FAIcon";
import { useCreateRoom } from "hooks/useRoomsData";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const CreateDuckletModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const initialRef = useRef(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const { mutate, isLoading } = useCreateRoom();

  const toast = useToast();
  const router = useRouter();
  const handleCreateDucklet = async () => {
    const payload = { name, description, isPublic };
    mutate(payload, {
      onSettled(data, error, variables, context) {
        if (error) {
          toast({
            title: "Error creating ducklet",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        toast({
          title: "Ducklet created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        const { id } = data.data;
        router.push("/ducklets/" + id);
      },
    });
  };
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} initialFocusRef={initialRef}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create new Ducklet</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel fontWeight={"bold"}>Ducklet Name</FormLabel>
              <Input
                ref={initialRef}
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel fontWeight={"bold"}>Description (optional)</FormLabel>
              <Textarea
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel fontWeight={"bold"}>Visibility</FormLabel>
              <Button
                onClick={() => setIsPublic((p) => !p)}
                variant={"ghost"}
                px={0}
                _hover={{}}
                _focus={{}}
                _active={{}}
              >
                <HStack
                  bg={!isPublic ? "red.400" : ""}
                  px={2}
                  py={1}
                  borderRadius={"5px"}
                >
                  <FAIcon icon={faLock} />
                  <Text>Private</Text>
                </HStack>
                <HStack
                  bg={isPublic ? "green.400" : ""}
                  px={2}
                  py={1}
                  borderRadius={"5px"}
                >
                  <FAIcon icon={faGlobe} />
                  <Text>Public</Text>
                </HStack>
              </Button>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              colorScheme="purple"
              ml={3}
              onClick={handleCreateDucklet}
              isLoading={isLoading}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
export default CreateDuckletModal;
