import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@/test-utils/render";
import { SearchField } from "../SearchField";

describe("SearchField", () => {
  it("chama onChangeText ao digitar", async () => {
    const onChangeText = vi.fn();
    await render(
      <SearchField
        value=""
        onChangeText={onChangeText}
        placeholder="Buscar paciente"
      />,
    );
    fireEvent.changeText(screen.getByLabelText("Buscar paciente"), "Ana");
    expect(onChangeText).toHaveBeenCalledWith("Ana");
  });

  it("não mostra o botão de limpar quando o valor está vazio", async () => {
    await render(<SearchField value="" onChangeText={vi.fn()} />);
    expect(screen.queryByLabelText("Limpar busca")).toBeNull();
  });

  it("mostra o botão de limpar e chama onClear ao pressionar", async () => {
    const onClear = vi.fn();
    await render(
      <SearchField value="Ana" onChangeText={vi.fn()} onClear={onClear} />,
    );
    await fireEvent.press(screen.getByLabelText("Limpar busca"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("limpa o texto chamando onChangeText('') quando onClear não é informado", async () => {
    const onChangeText = vi.fn();
    await render(<SearchField value="Ana" onChangeText={onChangeText} />);
    await fireEvent.press(screen.getByLabelText("Limpar busca"));
    expect(onChangeText).toHaveBeenCalledWith("");
  });
});
