import { ApiError } from "@/api/errors";
import { apiClient } from "@/api/client";

const MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024;

export interface TaskMediaFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

export class TaskMediaTooLargeError extends ApiError {
  constructor() {
    super({
      message: "O arquivo excede o limite de 10 MB.",
      status: 400,
      code: "FILE_TOO_LARGE",
    });
    this.name = "TaskMediaTooLargeError";
  }
}

export async function uploadTaskMedia(file: TaskMediaFile): Promise<string> {
  if (file.size !== undefined && file.size > MAX_MEDIA_SIZE_BYTES) {
    throw new TaskMediaTooLargeError();
  }

  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);

  const response = await apiClient.post<{ url: string }>(
    "/task/upload-media",
    formData,
  );
  return response.data.url;
}
