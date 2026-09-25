import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onlineManager } from "@tanstack/react-query";
import { render, screen, waitFor } from "@/test-utils/render";
import { Text } from "react-native";

import { connectOnlineManagerToNetInfo, useOnline } from "@/hooks/useOnline";

type NetInfoListener = (state: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}) => void;

let netInfoListener: NetInfoListener | null = null;

vi.mock("@react-native-community/netinfo", () => ({
  default: {
    addEventListener: (listener: NetInfoListener) => {
      netInfoListener = listener;
      return () => {
        netInfoListener = null;
      };
    },
  },
}));

function Probe() {
  const isOnline = useOnline();
  return <Text>{isOnline ? "online" : "offline"}</Text>;
}

describe("useOnline", () => {
  beforeEach(() => {
    onlineManager.setOnline(true);
  });

  afterEach(() => {
    netInfoListener = null;
    onlineManager.setOnline(true);
  });

  it("reflects the current onlineManager state", async () => {
    await render(<Probe />);
    expect(screen.getByText("online")).toBeTruthy();
  });

  it("updates when onlineManager changes", async () => {
    await render(<Probe />);
    onlineManager.setOnline(false);
    await waitFor(() => {
      expect(screen.getByText("offline")).toBeTruthy();
    });
  });

  it("connectOnlineManagerToNetInfo updates onlineManager from NetInfo events", () => {
    const unsubscribe = connectOnlineManagerToNetInfo();
    expect(netInfoListener).not.toBeNull();

    netInfoListener?.({ isConnected: false, isInternetReachable: null });
    expect(onlineManager.isOnline()).toBe(false);

    netInfoListener?.({ isConnected: true, isInternetReachable: true });
    expect(onlineManager.isOnline()).toBe(true);

    unsubscribe();
  });
});
