import type { Educator } from "@/api/types";
import { MOCK_EDUCATOR, MOCK_TOKEN } from "@/mocks/fixtures";
import { getMockSession } from "@/mocks/mock-auth-state";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

let educator: Educator = { ...MOCK_EDUCATOR };
export function getUpdatedMockEducator(): Educator {
  return educator;
}

registerMockHandler({ method: "get", path: "/educator/me" }, () => {
  if (getMockSession() !== MOCK_TOKEN)
    throw new MockApiError(401, "UNAUTHORIZED");
  return { status: 200, data: educator };
});

registerMockHandler(
  { method: "put", path: "/educator/update-educator" },
  ({ body }) => {
    if (getMockSession() !== MOCK_TOKEN)
      throw new MockApiError(401, "UNAUTHORIZED");
    const values = (body ?? {}) as Record<string, unknown>;
    for (const key of ["newName", "newContact", "newProfession"]) {
      const value = values[key];
      if (
        value !== undefined &&
        (typeof value !== "string" || value.length < 3 || value.length > 100)
      ) {
        throw new MockApiError(400, "VALIDATION_ERROR");
      }
    }
    educator = {
      ...educator,
      name: (values.newName as string | undefined) ?? educator.name,
      contact: (values.newContact as string | undefined) ?? educator.contact,
      profession:
        (values.newProfession as string | undefined) ?? educator.profession,
    };
    return {
      status: 200,
      data: {
        _name: educator.name,
        _contact: educator.contact,
        _profession: educator.profession,
        _photoUrl: educator.photoUrl,
        _password: "mock-secret-never-use",
      },
    };
  },
);

registerMockHandler(
  { method: "put", path: "/educator/update-profile-picture" },
  ({ body }) => {
    if (getMockSession() !== MOCK_TOKEN)
      throw new MockApiError(400, "UNAUTHORIZED");
    const photo =
      body instanceof FormData
        ? body.get("photo")
        : (body as Record<string, unknown> | null)?.photo;
    if (!photo) throw new MockApiError(400, "PROFILE_PICTURE_REQUIRED");
    educator = {
      ...educator,
      photoUrl: "https://mock.local/profile/photo.jpg",
    };
    return { status: 200, data: educator };
  },
);
