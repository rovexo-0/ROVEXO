import { describe, expect, it } from "vitest";
import { validateClientImage } from "@/lib/storage/client-images";

describe("mobile image validation", () => {
  it("accepts iOS gallery files with empty MIME but known extension", () => {
    expect(() =>
      validateClientImage(new File([new Uint8Array([1, 2, 3])], "IMG_1234.HEIC", { type: "" })),
    ).not.toThrow();
  });

  it("rejects unknown non-image extensions", () => {
    expect(() =>
      validateClientImage(new File([new Uint8Array([1, 2, 3])], "notes.txt", { type: "" })),
    ).toThrow(/Only image files are supported/);
  });
});
