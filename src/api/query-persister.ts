import type { QueryClient } from "@tanstack/react-query";
import {
  persistQueryClient as persistQueryClientCore,
  persistQueryClientSave,
} from "@tanstack/react-query-persist-client";
import type { Persister } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

import { getStorage } from "@/storage/mmkv";

const QUERY_CACHE_KEY_PREFIX = "query:cache:";

export async function createQueryPersister(
  educatorId: string,
): Promise<Persister> {
  const storage = await getStorage(educatorId);

  return createSyncStoragePersister({
    key: `${QUERY_CACHE_KEY_PREFIX}${educatorId}`,
    throttleTime: 0,
    storage: {
      getItem: (key) => storage.getString(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.remove(key),
    },
  });
}

export async function persistQueryClient(
  client: QueryClient,
  educatorId: string,
): Promise<() => void> {
  const persister = await createQueryPersister(educatorId);
  const dehydrateOptions = {
    shouldDehydrateMutation: () => false,
  };

  const [unsubscribe, restored] = persistQueryClientCore({
    queryClient: client,
    persister,
    dehydrateOptions,
  });

  await restored;
  await persistQueryClientSave({
    queryClient: client,
    persister,
    dehydrateOptions,
  });

  return unsubscribe;
}
