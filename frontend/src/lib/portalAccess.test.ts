import { describe, expect, it } from "vitest";
import { canAccessPortalPath } from "./portalAccess";
import { resolveHomePath } from "./authPaths";

describe("canAccessPortalPath", () => {
  it("allows students on student portal", () => {
    expect(canAccessPortalPath("/portail/etudiant/notes", ["student"])).toBe(true);
  });

  it("blocks students from admin portal", () => {
    expect(canAccessPortalPath("/portail/admin", ["student"])).toBe(false);
  });

  it("allows teachers on teacher portal", () => {
    expect(canAccessPortalPath("/fr/portail/enseignant", ["teacher"])).toBe(true);
  });

  it("allows direction on direction portal", () => {
    expect(canAccessPortalPath("/portail/direction", ["direction"])).toBe(true);
  });
});

describe("resolveHomePath", () => {
  it("routes direction first", () => {
    expect(resolveHomePath(["student", "direction"])).toBe("/portail/direction");
  });

  it("routes teacher before student", () => {
    expect(resolveHomePath(["teacher"])).toBe("/portail/enseignant");
  });

  it("falls back to connexion", () => {
    expect(resolveHomePath([])).toBe("/connexion");
  });
});
