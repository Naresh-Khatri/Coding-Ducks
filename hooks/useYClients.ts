import { useEffect, useState } from "react";
import { IYJsUser } from "../lib/socketio/socketEvents";
import { SocketIOProvider } from "y-socket.io";
import { useToast } from "@chakra-ui/react";

// dont use this hook as of now!
function useYClients(provider: SocketIOProvider) {
  const [clients, setClients] = useState<IYJsUser[]>([]);

  const toast = useToast();
  useEffect(() => {
    if (!provider) {
      console.error("provider not provided");
      return;
    }
    provider.awareness.on("update", (changes) => {
      const { added, removed } = changes;
      const _clients = Array.from(provider.awareness.getStates()).map(
        (c: [number, IYJsUser]) => ({
          ...c[1],
          clientId: c[0],
        })
      );
      console.log(added, removed, clients, _clients);
      // if client is added then find him and show toast
      if (added[0]) {
        const clientFound = Array.from(provider.awareness.getStates()).find(
          (c: [number, IYJsUser]) => c[0] === added[0]
        );
        console.log("added user", clientFound);
        if (clientFound) {
          toast({
            title: "User joined",
            description: clientFound[1].username,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      }
      if (removed[0]) {
        // console.log("removed user", clientFound, removed[0], clients);
        console.log(clients, _clients);
        const clientFound = clients.find((oldClient) =>
          _clients.some((newClient) => newClient.id === oldClient.id)
        );
        if (clientFound) {
          toast({
            title: "User Left",
            description: clientFound[1].username,
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
        }
      }

      console.log(_clients);
      setClients(_clients);
    });
  }, []);

  return [clients];
}

export default useYClients;
