import { describe, expect, it } from "vitest";

import { permissionsFor } from "@/features/permissions/permissions";
import { professionAndRole } from "@/features/team/roles";

const clinic = { id: "c1", name: "Clínica Teste" };

describe("permissionsFor (AC-EQP-02-02)", () => {
  it("ADMIN pode tudo", () => {
    expect(permissionsFor({ ...clinic, role: "ADMIN" })).toEqual({
      role: "ADMIN",
      inClinic: true,
      canInvite: true,
      canManageTeam: true,
      canLeaveTeam: true,
    });
  });

  it("PROFESSIONAL só está na clínica e pode sair", () => {
    expect(permissionsFor({ ...clinic, role: "PROFESSIONAL" })).toEqual({
      role: "PROFESSIONAL",
      inClinic: true,
      canInvite: false,
      canManageTeam: false,
      canLeaveTeam: true,
    });
  });

  it("sem clínica, nada é permitido", () => {
    const none = {
      role: null,
      inClinic: false,
      canInvite: false,
      canManageTeam: false,
      canLeaveTeam: false,
    };
    expect(permissionsFor(undefined)).toEqual(none);
    expect(permissionsFor(null)).toEqual(none);
  });
});

describe("professionAndRole (AC-EQP-02-04)", () => {
  const base = { email: "educador.teste@example.com" };

  it("com clínica junta profissão e papel", () => {
    expect(
      professionAndRole({
        ...base,
        profession: "Psicopedagoga",
        clinic: { role: "ADMIN" },
      }),
    ).toBe("Psicopedagoga · Administrador(a)");
  });

  it("com clínica e sem profissão mostra só o papel", () => {
    expect(
      professionAndRole({ ...base, clinic: { role: "PROFESSIONAL" } }),
    ).toBe("Profissional");
  });

  it("sem clínica mantém profissão ou e-mail", () => {
    expect(professionAndRole({ ...base, profession: "Psicopedagoga" })).toBe(
      "Psicopedagoga",
    );
    expect(professionAndRole(base)).toBe("educador.teste@example.com");
  });
});
