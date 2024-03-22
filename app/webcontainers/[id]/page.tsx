"use client";
import { Box, Button } from "@chakra-ui/react";
import { javascript } from "@codemirror/lang-javascript";
import { vim } from "@replit/codemirror-vim";
import { useQuery } from "@tanstack/react-query";
import { dracula } from "@uiw/codemirror-theme-dracula";
import ReactCodeMirror from "@uiw/react-codemirror";
import { FileSystemTree, WebContainer } from "@webcontainer/api";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Split from "react-split";
import "xterm/css/xterm.css";
import axiosInstance from "../../../lib/axios";
import { IDirectory } from "../../../lib/socketio/socketEventTypes";
import FileExplorer from "./WCFileExplorer";
import Path from "path";

const getRoom = async (roomId: number) => {
  const { data } = await axiosInstance.get(
    "http://192.168.31.149:3333/projects/" + roomId
  );
  return data.data;
};
const createFileSystem = (dir: IDirectory) => {
  const fs = {};
  if (dir.files)
    dir.files.forEach((file) => {
      fs[file.fileName] = {
        file: {
          __meta: {
            id: file.id,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
            parentDirId: file.parentDirId,
            ownerId: file.ownerId,
          },
          contents: file.code,
        },
      };
    });

  if (dir.childDirs) {
    dir.childDirs.forEach((dir) => {
      fs[dir.name] = {
        directory: createFileSystem(dir),
        __meta: {
          id: dir.id,
          createdAt: dir.createdAt,
          updatedAt: dir.updatedAt,
          parentDirId: dir.parentDirId,
          ownerId: dir.ownerId,
        },
      };
    });
    // fs[dir.name] = {
    //   directory: {},
    // };
  }
  return fs;
};

function WebContainersPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [wc, setWc] = useState<WebContainer | null>(null);
  const initRef = useRef(false);
  const [fs, setFs] = useState<FileSystemTree | null>(null);
  const { id } = useParams() as { id: string };
  const {
    data: roomData,
    isLoading: roomIsLoading,
    error,
  } = useQuery(["room"], () => getRoom(+id));
  // const fileSystemTree = useGlobalStore((state) => state.fileSystemTree);
  // const initFS = useGlobalStore((state) => state.initFS);

  useEffect(() => {
    if (!roomData) return;
    const run = async () => {
      // setFiles(roomData.template);
      const _files = createFileSystem(roomData?.dirs[0]);
      // initFS(roomData?.useDisclosure);
      setFs(_files);
      if (!initRef.current) {
        handleInit(_files);
        initRef.current = true;
      }
    };
    run();
    return () => {
      if (wc) wc.teardown();
    };
  }, [roomData]);
  const handleInit = async (files) => {
    console.log(files);
    if (!files) return;
    console.log("booting...");
    const _wc = await WebContainer.boot();
    console.log("booting done");
    setWc(_wc);
    _wc.mount(files);

    // add watch listeners to every file and dir recursively
    addWatchers(_wc, "/");

    // attachTerminal(_wc);
    // because import it server side causes issues
    const { Terminal } = await import("xterm");
    const _terminal = new Terminal({
      convertEol: true,
    });
    const { FitAddon } = await import("xterm-addon-fit");
    const fitAddon = new FitAddon();
    _terminal.loadAddon(fitAddon);
    _terminal.open(terminalRef.current as HTMLDivElement);

    _wc.on("server-ready", (port, url) => {
      console.log(port, url);
      if (iframeRef.current) iframeRef.current.src = url;
    });
    const shellProcess = await startShell(_wc, _terminal);

    if (typeof window !== "undefined") {
      window.addEventListener("resize", () => {
        fitAddon.fit();
        shellProcess.resize({ cols: _terminal.cols, rows: _terminal.rows });
      });
    }

    // const exitCode = await installDependencies(_wc, _terminal);
    // if (exitCode !== 0) {
    //   throw new Error("Installation failed");
    // }
    // startDevServer(_wc, _terminal);
  };
  async function addWatchers(wc: WebContainer, path: string) {
    const entities = await wc.fs.readdir(path, { withFileTypes: true });
    entities.forEach((entity) => {
      console.log("👀...", entity.name);
      wc.fs.watch(path + "/" + entity.name, (...e) => {
        console.log(e);
      });
      // if (entity.isFile()) {
      //   console.log("👀...", entity.name);
      // }
      if (entity.isDirectory()) {
        addWatchers(wc, path + "/" + entity.name);
      }
    });
  }
  async function startShell(wc: WebContainer, terminal: any) {
    const shellProcess = await wc.spawn("jsh", {
      terminal: { cols: terminal.cols, rows: terminal.rows },
    });
    shellProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data);
        },
      })
    );
    const input = shellProcess.input.getWriter();
    terminal.onData((data) => input.write(data));
    return shellProcess;
  }
  // async function installDependencies(wc: WebContainer, terminal: any) {
  //   if (!wc) return;
  //   // Install dependencies
  //   const installProcess = await wc.spawn("npm", ["install"]);

  //   installProcess.output.pipeTo(
  //     new WritableStream({
  //       write(data) {
  //         terminal?.write(data);
  //       },
  //     })
  //   );
  //   // Wait for install command to exit
  //   return installProcess.exit;
  // }
  // async function startDevServer(wc: WebContainer, terminal: any) {
  //   if (!wc) return;
  //   // Run `npm run start` to start the Express app
  //   const process = await wc.spawn("npm", ["run", "start"]);
  //   process.output.pipeTo(
  //     new WritableStream({
  //       write(data) {
  //         terminal?.write(data);
  //       },
  //     })
  //   );
  // }

  const handleOnChange = async (newVal: string) => {
    if (!wc) return;
    await wc.fs.writeFile("/src/App.jsx", newVal);
  };
  const showFs = async (path: string) => {
    const fss: IDirectory[] = [];
    const entities = await wc?.fs.readdir(path, { withFileTypes: true });
    entities?.forEach(async (entity) => {
      if (entity.isDirectory()) {
        // fss.push([await showFs(`${path}/${entity.name}`)]);
      }
      if (entity.isFile()) {
        console.log(entity.name);
        console.log(
          await wc?.fs.readFile(Path.join(path, entity.name), "utf8")
        );
        // fss.push(aw);
      }
    });
    return fss;
  };
  if (roomIsLoading) return <p> loading room...</p>;
  // return (
  //   <pre>
  //     {JSON.stringify(createFileSystem({ childDirs: roomData?.dirs }), null, 2)}
  //   </pre>
  // );

  return (
    <Box w={"full"} h={"full"}>
      <Split
        className="split-h"
        direction="horizontal"
        minSize={0}
        sizes={[20, 80]}
        snapOffset={50}
        style={{ width: "100%", height: "100%" }}
      >
        <Box>
          <Button
            onClick={async () => {
              const res = await showFs("/");
              console.log(res);
            }}
          >
            show fs
          </Button>
          <FileExplorer fs={fs} />
        </Box>
        <Split
          className="split-v"
          direction="vertical"
          minSize={0}
          sizes={[10, 90]}
          snapOffset={50}
          style={{ width: "100%", height: "100%", overflow: "hidden" }}
        >
          <Split
            className="split-h"
            direction="horizontal"
            minSize={0}
            snapOffset={50}
            style={{ width: "100%", height: "100%" }}
          >
            <Box w={"full"} bg={"white"}>
              {/* {files["/src/App.jsx"] && (
                <ReactCodeMirror
                  value={files["package.json"].file.contents}
                  theme={dracula}
                  extensions={[javascript(), vim()]}
                  onChange={handleOnChange}
                />
              )} */}
            </Box>
            <Box w={"full"} bg={"white"}>
              <iframe width={"100%"} height={"100%"} ref={iframeRef}></iframe>
            </Box>
          </Split>
          <Box ref={terminalRef} w={"full"} h={"full"} overflow={"auto"}></Box>
        </Split>
      </Split>
    </Box>
  );
}

export default WebContainersPage;
