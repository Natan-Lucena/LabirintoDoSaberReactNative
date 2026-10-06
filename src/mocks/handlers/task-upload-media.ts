import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

let nextMediaId = 1;

function readFile(body: unknown): unknown {
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return body.get("file");
  }
  if (body && typeof body === "object") {
    return (body as Record<string, unknown>).file;
  }
  return undefined;
}

function getExtension(file: unknown): string {
  if (!file || typeof file !== "object") {
    return "bin";
  }

  const name = (file as { name?: unknown }).name;
  if (typeof name !== "string") {
    return "bin";
  }

  const extension = name.split(".").pop();
  return extension && extension !== name ? extension : "bin";
}

registerMockHandler(
  { method: "post", path: "/task/upload-media" },
  ({ body }) => {
    const file = readFile(body);
    if (!file) {
      throw new MockApiError(400, "FILE_REQUIRED");
    }

    return {
      status: 200,
      data: {
        url: `https://mock.local/media/mock-media-${nextMediaId++}.${getExtension(file)}`,
      },
    };
  },
);

export const taskUploadMediaMockHandlerRegistered = true;
