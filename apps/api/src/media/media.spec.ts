import { describe, expect, it } from "vitest";
import { sanitize } from "./media.service";

/**
 * A Hebrew filename in the storage key is rejected by Supabase with
 * `InvalidKey`, and it took a deployed upload to find that out. These are the
 * cases that must never regress.
 */
describe("sanitize", () => {
  it("strips a wholly Hebrew name down to a placeholder, keeping the extension", () => {
    expect(sanitize("דוח שנתי.pdf")).toBe("file.pdf");
  });

  it("keeps an ASCII name readable", () => {
    expect(sanitize("Annual Report 2026.pdf")).toBe("Annual-Report-2026.pdf");
  });

  it("keeps the ASCII part of a mixed name", () => {
    expect(sanitize("q1 דוח.xlsx")).toBe("q1.xlsx");
  });

  it("produces keys that are ASCII and free of characters storage rejects", () => {
    for (const name of ["דוח שנתי.pdf", "a b/c?.png", "עברית", "..."]) {
      expect(sanitize(name)).toMatch(/^[A-Za-z0-9._-]+$/);
    }
  });

  it("survives a name with no extension", () => {
    expect(sanitize("מסמך")).toBe("file");
  });
});
