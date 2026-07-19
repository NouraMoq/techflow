import { describe, it, expect } from "vitest";
import {
  validateUpload, assetTypeFromMime, humanSize, safeName, MAX_UPLOAD_BYTES,
} from "../src/lib/storage/types";

describe("Storage upload guardrails", () => {
  it("accepts an allowed image within the size cap", () => {
    expect(validateUpload("photo.png", "image/png", 1024)).toBeNull();
  });

  it("rejects disallowed content types", () => {
    expect(validateUpload("evil.exe", "application/x-msdownload", 10)).toMatch(/غير مسموح/);
  });

  it("rejects oversized files", () => {
    expect(validateUpload("big.mp4", "video/mp4", MAX_UPLOAD_BYTES + 1)).toMatch(/يتجاوز الحد/);
  });

  it("rejects empty files", () => {
    expect(validateUpload("empty.txt", "text/plain", 0)).toMatch(/فارغ/);
  });

  it("maps MIME types to asset categories", () => {
    expect(assetTypeFromMime("video/mp4")).toBe("raw_video");
    expect(assetTypeFromMime("image/jpeg")).toBe("image");
    expect(assetTypeFromMime("audio/mpeg")).toBe("music");
    expect(assetTypeFromMime("application/pdf")).toBe("contract");
  });

  it("humanizes byte sizes", () => {
    expect(humanSize(500)).toBe("500 B");
    expect(humanSize(2048)).toBe("2 KB");
    expect(humanSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("sanitizes filenames but keeps Arabic/alnum", () => {
    expect(safeName("تجربة file (1).mp4")).toBe("تجربة_file_1_.mp4");
    expect(safeName("../../etc/passwd")).not.toContain("/");
  });
});
