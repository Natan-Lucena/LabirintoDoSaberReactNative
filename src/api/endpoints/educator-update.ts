import { apiClient } from "@/api/client";
import { ApiError } from "@/api/errors";
import type { TaskMediaFile } from "@/api/endpoints/task-upload-media";

export interface UpdateEducatorInput {
  newName?: string;
  newContact?: string;
  newProfession?: string;
}

/** The response contains _password; never return or retain it. */
export async function updateEducator(
  input: UpdateEducatorInput,
): Promise<void> {
  await apiClient.put("/educator/update-educator", input);
}

export async function updateProfilePicture(file: TaskMediaFile): Promise<void> {
  if (file.size !== undefined && file.size > 5 * 1024 * 1024) {
    throw new ApiError({
      message: "A foto deve ter até 5 MB.",
      status: 400,
      code: "FILE_TOO_LARGE",
    });
  }
  const form = new FormData();
  form.append("photo", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
  await apiClient.put("/educator/update-profile-picture", form);
}
