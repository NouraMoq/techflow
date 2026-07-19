import { describe, it, expect } from "vitest";
import { can, isAdminRole, permissionsFor } from "../src/lib/rbac";

describe("RBAC", () => {
  it("creator can approve but writer cannot", () => {
    expect(can("creator", "content.approve")).toBe(true);
    expect(can("writer", "content.approve")).toBe(false);
  });

  it("viewer has no write permissions", () => {
    expect(can("viewer", "idea.create")).toBe(false);
    expect(can("viewer", "content.publish")).toBe(false);
    expect(can("viewer", "analytics.view")).toBe(true);
  });

  it("only nova_* roles are admin", () => {
    expect(isAdminRole("nova_admin")).toBe(true);
    expect(isAdminRole("nova_am")).toBe(true);
    expect(isAdminRole("creator")).toBe(false);
  });

  it("nova_admin has every permission", () => {
    expect(can("nova_admin", "finance.view")).toBe(true);
    expect(can("nova_admin", "admin.access")).toBe(true);
    expect(can("nova_admin", "content.publish")).toBe(true);
  });

  it("unknown role has no permissions", () => {
    expect(permissionsFor("does-not-exist")).toEqual([]);
    expect(can("does-not-exist", "idea.create")).toBe(false);
  });

  it("editor can upload files but not write scripts", () => {
    expect(can("editor", "files.upload")).toBe(true);
    expect(can("editor", "script.write")).toBe(false);
  });

  it("compliance & crisis permissions are correctly scoped", () => {
    expect(can("reviewer", "compliance.review")).toBe(true);
    expect(can("biz", "crisis.manage")).toBe(true);
    expect(can("editor", "compliance.review")).toBe(false);
    expect(can("writer", "crisis.manage")).toBe(false);
    expect(can("nova_compliance", "crisis.manage")).toBe(true);
  });

  it("shoot & trend permissions are correctly scoped", () => {
    expect(can("editor", "shoot.manage")).toBe(true);   // editor helps on shoot days
    expect(can("writer", "shoot.manage")).toBe(false);
    expect(can("analyst", "trend.manage")).toBe(true);  // analyst tracks trends
    expect(can("designer", "trend.manage")).toBe(false);
    expect(can("content", "shoot.manage")).toBe(true);
  });

  it("audience & recommendation permissions are correctly scoped", () => {
    expect(can("writer", "audience.manage")).toBe(true);
    expect(can("editor", "audience.manage")).toBe(false);
    expect(can("analyst", "recommendation.manage")).toBe(true);
    expect(can("designer", "recommendation.manage")).toBe(false);
    expect(can("biz", "audience.manage")).toBe(true);
  });
});
