import { useSyncExternalStore } from "react";

import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

export function useOnline(): boolean {
  return useSyncExternalStore(
    (callback) => onlineManager.subscribe(callback),
    () => onlineManager.isOnline(),
  );
}

export function connectOnlineManagerToNetInfo(): () => void {
  return NetInfo.addEventListener((state) => {
    onlineManager.setOnline(
      state.isConnected === true && state.isInternetReachable !== false,
    );
  });
}
