import type { PropsWithChildren } from "react";

import * as SecureStore from "expo-secure-store";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Text, View } from "react-native";
import { createMMKV } from "react-native-mmkv";
import { describe, expect, test, vi } from "vitest";

import { render, fireEvent, screen } from "@/test-utils/render";
import { setLocalSearchParams } from "@/test-utils/mocks";

function SmokeComponent({ onContinue }: { onContinue: () => void }) {
  return (
    <View>
      <Text accessibilityRole="header">Pronto para testar</Text>
      <Button title="Continuar" onPress={onContinue} />
    </View>
  );
}

function MarkerWrapper({ children }: PropsWithChildren) {
  return (
    <View>
      <Text>Wrapper ativo</Text>
      {children}
    </View>
  );
}

function ParamsProbe() {
  const params = useLocalSearchParams<{ origem?: string }>();
  return <Text>{params.origem ?? "sem parametros"}</Text>;
}

describe("infraestrutura de testes", () => {
  test("renderiza e interage com um componente React Native usando wrapper assíncrono", async () => {
    const onContinue = () => router.push("/");

    await render(<SmokeComponent onContinue={onContinue} />, { wrapper: MarkerWrapper });

    expect(screen.getByText("Pronto para testar")).toBeTruthy();
    expect(screen.getByText("Wrapper ativo")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));
    expect(router.push).toHaveBeenCalledWith("/");
  });

  test("usa os mocks de SecureStore, Expo Router e MMKV", async () => {
    await SecureStore.setItemAsync("sessao", "ficticia");
    setLocalSearchParams({ origem: "teste" });
    const mmkv = createMMKV({ id: "smoke-mmkv" });
    mmkv.set("chave", "valor ficticio");
    await render(<ParamsProbe />);

    expect(await SecureStore.getItemAsync("sessao")).toBe("ficticia");
    expect(screen.getByText("teste")).toBeTruthy();
    expect(mmkv.getString("chave")).toBe("valor ficticio");
  });

  test("configura uma rejeição não consumida para verificar o reset", () => {
    vi.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error("erro simulado"));

    expect(SecureStore.getItemAsync).toBeTypeOf("function");
  });

  test("restaura mocks e limpeza RNTL entre testes", async () => {
    expect(await SecureStore.getItemAsync("sessao")).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
    expect(() => screen.queryByText("teste")).toThrow(/function has not been called/);
    await render(<ParamsProbe />);
    expect(screen.getByText("sem parametros")).toBeTruthy();
  });
});
