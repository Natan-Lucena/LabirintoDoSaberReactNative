import { describe, expect, it } from "vitest";

import { fireEvent, render, screen } from "@/test-utils/render";
import { StudentAvatar } from "@/features/students-list/components/StudentAvatar";

const options = { includeHiddenElements: true };

describe("StudentAvatar", () => {
  it("usa a ilustração padrão quando photoUrl é null", async () => {
    await render(<StudentAvatar photoUrl={null} backgroundColor="#E94B8F" />);
    expect(
      screen.getByTestId("student-avatar-fallback-image", options),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("student-avatar-photo-image", options),
    ).toBeNull();
  });

  it("cai para a ilustração padrão quando a imagem falha ao carregar", async () => {
    await render(
      <StudentAvatar
        photoUrl="https://example.test/broken.png"
        backgroundColor="#E94B8F"
      />,
    );

    const image = screen.getByTestId("student-avatar-photo-image", options);
    fireEvent(image, "error");

    expect(
      await screen.findByTestId("student-avatar-fallback-image", options),
    ).toBeTruthy();
  });
});
