import { useState, useEffect } from "react";
import { baseURL } from "./axios";
import { auth } from "../firebase/firebase";

interface ErrorResponse {
  message: string;
}

interface streamingFetchProps {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: any;
  body?: any;
}
// interface useStreamingFetchProps<T> {
//   isLoading: boolean;
//   status: string;
//   data?: T;
//   error?: ErrorResponse;
// }
interface HookReturnType<T> {
  data: T & { status: string };
  error: ErrorResponse | null;
  isLoading: boolean;
  streamingFetch: (props: streamingFetchProps) => Promise<void>;
}

export const useStreamingFetch = <T>(): HookReturnType<T> => {
  // ...
  const [data, setData] = useState<T & { status: string }>({
    status: "idle",
  } as T & { status: string });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const streamingFetch = async ({
    method,
    url,
    body,
    headers,
  }: streamingFetchProps) => {
    try {
      setIsLoading(true);
      setData({ status: "loading" } as T & { status: string });
      const _url = baseURL + url;
      const _headers = {
        "Content-Type": "application/json",
        ...headers,
      };
      const token = await auth?.currentUser?.getIdToken();
      if (token) _headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(_url, {
        method,
        headers: _headers,
        body: JSON.stringify(body),
      });
      if (!response.body) {
        throw new Error("No body in response");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let done: boolean = false,
        value: Uint8Array | undefined;

      while (!done) {
        ({ done, value } = await reader.read());

        if (done) {
          console.log("isdone", done);
          setIsLoading(false);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split("↩");
        buffer = lines.pop() || ""; // Retain the last partial line

        for (let line of lines) {
          if (line.trim() === "") continue;
          try {
            const parsedData = JSON.parse(line);
            console.log(parsedData);
            setData((prevData) => ({ ...prevData, ...parsedData }));
          } catch (error) {
            console.error("Error parsing JSON:", error);
            setError({ message: "Error parsing JSON" });
          }
        }
        console.log(data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError({ message: "Fetch error" });
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, streamingFetch };
};
