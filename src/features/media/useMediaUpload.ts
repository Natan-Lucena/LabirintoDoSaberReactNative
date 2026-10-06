import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import {
  uploadTaskMedia,
  type TaskMediaFile,
} from "@/api/endpoints/task-upload-media";
import { withOfflineGuard } from "@/api/query-client";

export function useMediaUpload(): UseMutationResult<
  string,
  Error,
  TaskMediaFile
> {
  return useMutation({
    mutationFn: withOfflineGuard(uploadTaskMedia),
    retry: false,
  });
}
