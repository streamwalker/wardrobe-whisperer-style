// @vitest-environment node
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync("supabase/functions/delete-account/index.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const owner = "11111111-1111-4111-8111-111111111111";

function fixture(options: { invalidUser?: boolean; storageFailure?: boolean; tableFailure?: boolean; photoCount?: number } = {}) {
  const pending = Array.from({ length: options.photoCount ?? 0 }, (_, i) => ({ id: `photo-${i}`, name: `${i}.jpg` }));
  const removed: string[] = [];
  const filters: Array<{ table: string; filter: unknown[] }> = [];
  const deleteUser = vi.fn(async () => ({ error: null }));
  const getUser = vi.fn(async () => ({ data: { user: options.invalidUser ? null : { id: owner } }, error: null }));
  const list = vi.fn(async () => ({ data: pending.slice(0, 100), error: null }));
  const remove = vi.fn(async (paths: string[]) => {
    if (options.storageFailure) return { error: new Error("storage unavailable") };
    removed.push(...paths);
    pending.splice(0, paths.length);
    return { error: null };
  });
  const client = {
    auth: { getUser, admin: { deleteUser } },
    storage: { from: vi.fn(() => ({ list, remove })) },
    from: (table: string) => ({ delete: () => ({
      eq: async (...filter: unknown[]) => { filters.push({ table, filter }); return { error: options.tableFailure ? new Error("database unavailable") : null }; },
      or: async (...filter: unknown[]) => { filters.push({ table, filter }); return { error: null }; },
    }) }),
  };
  let handler: (req: Request) => Promise<Response>;
  runInNewContext(compiled, {
    require: () => ({ createClient: () => client }), exports: {}, Response,
    Deno: { env: { get: () => "test" }, serve: (fn: typeof handler) => { handler = fn; } },
  });
  const call = (body: object = { confirmation: "DELETE" }, auth = true) => handler(new Request("https://example.test/delete-account", {
    method: "POST", headers: auth ? { Authorization: "Bearer verified-token" } : {}, body: JSON.stringify(body),
  }));
  return { call, removed, filters, deleteUser, getUser, list, remove };
}

describe("account deletion authorization and cleanup", () => {
  it("rejects missing or invalid credentials without deleting data", async () => {
    const missing = fixture();
    expect((await missing.call({}, false)).status).toBe(401);
    expect(missing.getUser).not.toHaveBeenCalled();
    expect(missing.deleteUser).not.toHaveBeenCalled();
    const invalid = fixture({ invalidUser: true });
    expect((await invalid.call()).status).toBe(401);
    expect(invalid.list).not.toHaveBeenCalled();
    expect(invalid.deleteUser).not.toHaveBeenCalled();
  });
  it("requires confirmation before cleanup", async () => {
    const f = fixture();
    expect((await f.call({})).status).toBe(400);
    expect(f.list).not.toHaveBeenCalled();
  });
  it("cleans more than one page of photos and non-cascading records for only the verified caller", async () => {
    const f = fixture({ photoCount: 101 });
    const response = await f.call({ confirmation: "DELETE", user_id: "someone-else", prefix: "someone-else" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: true });
    expect(f.removed).toHaveLength(101);
    expect(f.removed.every(path => path.startsWith(`${owner}/`))).toBe(true);
    expect(f.filters).toEqual([
      { table: "wardrobe_shares", filter: ["user_id", owner] },
      { table: "style_signals", filter: ["user_id", owner] },
      { table: "dismissed_outfits", filter: ["user_id", owner] },
      { table: "wardrobe_transfers", filter: [`sender_id.eq.${owner},redeemed_by.eq.${owner}`] },
    ]);
    expect(f.deleteUser).toHaveBeenCalledWith(owner);
  });
  it.each([{ storageFailure: true }, { tableFailure: true }])("keeps the identity available to retry after cleanup failure: %j", async options => {
    const f = fixture({ ...options, photoCount: 1 });
    expect((await f.call()).status).toBe(500);
    expect(f.deleteUser).not.toHaveBeenCalled();
  });
});
