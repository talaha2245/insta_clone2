import { describe, expect, it } from "vitest";

// ============================================================
// UPLOAD SYSTEM UNIT TESTS
// These tests cover the logic bugs identified in the deep-dive
// analysis of the UploadThing integration.
// ============================================================

const APP_ID = "x083086k6k";

// ============================================================
// BUG #1: URL Transformation in core.ts
// The onUploadComplete callback transforms file.url using:
//   file.url.replace("/f/", `/a/${APP_ID}/`)
// This works for utfs.io but BREAKS for the new ufs.sh CDN.
// ============================================================

describe("Bug #1: URL Transformation (core.ts onUploadComplete)", () => {
  function transformUrl(fileUrl: string, appId: string): string {
    return fileUrl.replace("/f/", `/a/${appId}/`);
  }

  it("correctly transforms standard utfs.io URL", () => {
    const input = "https://utfs.io/f/abc123filekey";
    const result = transformUrl(input, APP_ID);
    expect(result).toBe(`https://utfs.io/a/${APP_ID}/abc123filekey`);
  });

  it("FAILS to correctly transform new ufs.sh CDN URL", () => {
    // BUG: When UploadThing returns a ufs.sh URL, the /f/ segment
    // is still replaced but the resulting URL path is wrong for
    // ufs.sh's CDN format. It should remain as /f/ for ufs.sh.
    const input = `https://${APP_ID}.ufs.sh/f/abc123filekey`;
    const result = transformUrl(input, APP_ID);
    // This incorrectly produces: https://x083086k6k.ufs.sh/a/x083086k6k/abc123filekey
    // The correct URL should be: https://x083086k6k.ufs.sh/f/abc123filekey
    expect(result).toBe(`https://${APP_ID}.ufs.sh/a/${APP_ID}/abc123filekey`);
    // The resulting URL is WRONG for ufs.sh — this image will 404
  });

  it("correctly transforms if URL already contains appId path (no double-transform)", () => {
    // If somehow called twice, it should be idempotent
    const input = `https://utfs.io/a/${APP_ID}/abc123filekey`;
    const result = transformUrl(input, APP_ID);
    // No /f/ to replace, so it returns unchanged — correct
    expect(result).toBe(`https://utfs.io/a/${APP_ID}/abc123filekey`);
  });
});

// ============================================================
// BUG #2: Avatar deletion key extraction
// The avatar deletion code extracts the file key using:
//   oldAvatarUrl.split(`/a/${APP_ID}/`)[1]
// If the stored URL uses the ufs.sh format, this returns undefined
// causing deleteFiles(undefined) → HTTP 400 error.
// ============================================================

describe("Bug #2: Avatar Deletion Key Extraction (core.ts avatar.onUploadComplete)", () => {
  function extractKey(url: string, appId: string): string | undefined {
    const key = url.split(`/a/${appId}/`)[1];
    if (key) return key;
    // fallback
    return url.split("/f/")[1];
  }

  it("correctly extracts key from utfs.io /a/ URL", () => {
    const url = `https://utfs.io/a/${APP_ID}/mykey123`;
    expect(extractKey(url, APP_ID)).toBe("mykey123");
  });

  it("correctly falls back to /f/ key extraction for ufs.sh URL", () => {
    const url = `https://${APP_ID}.ufs.sh/f/mykey123`;
    // Primary extraction fails (no /a/APP_ID/ segment)
    // Fallback /f/ extraction succeeds
    expect(extractKey(url, APP_ID)).toBe("mykey123");
  });

  it("returns undefined for completely unknown URL format", () => {
    const url = "https://example.com/image.png";
    expect(extractKey(url, APP_ID)).toBeUndefined();
  });
});

// ============================================================
// BUG #3: clear-uploads route does NOT await UTApi.deleteFiles
// This means files are silently NOT deleted — orphaned files
// accumulate in your UploadThing storage indefinitely.
// ============================================================

describe("Bug #3: clear-uploads does not await UTApi.deleteFiles", () => {
  it("demonstrates the bug: deleteFiles is called without await", () => {
    // The actual code in route.ts is:
    //   new UTApi().deleteFiles(...)   ← no await!
    // This is a fire-and-forget call that never waits for deletion.
    // The function continues and responds before deletion completes.
    const mockDeleteFiles = async (keys: string[]) => {
      return { success: true, deletedCount: keys.length };
    };

    // Simulate the buggy behavior
    let deletionCompleted = false;
    const buggyCleanup = () => {
      mockDeleteFiles(["key1", "key2"]).then(() => {
        deletionCompleted = true; // this runs AFTER the function returns
      });
      // Returns without waiting — deletion hasn't happened yet!
      return "done";
    };

    buggyCleanup();
    // Immediately after calling, deletion is NOT yet complete
    expect(deletionCompleted).toBe(false); // BUG confirmed
  });

  it("shows the fix: deleteFiles must be awaited", async () => {
    const mockDeleteFiles = async (keys: string[]) => {
      return { success: true, deletedCount: keys.length };
    };

    let deletionCompleted = false;
    const fixedCleanup = async () => {
      await mockDeleteFiles(["key1", "key2"]);
      deletionCompleted = true;
      return "done";
    };

    await fixedCleanup();
    expect(deletionCompleted).toBe(true); // FIXED
  });
});

// ============================================================
// BUG #4: next.config.mjs uses process.env at config eval time
// process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID is undefined when
// next.config.mjs is first evaluated, causing the remotePatterns
// to contain "undefined" as the hostname/pathname.
// ============================================================

describe("Bug #4: next.config.mjs env var at evaluation time", () => {
  it("demonstrates the bug: APP_ID is undefined without .env loaded", () => {
    // In next.config.mjs the pattern is:
    //   hostname: `${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}.ufs.sh`
    // Without the env var loaded, this evaluates to "undefined.ufs.sh"
    const appId = undefined as unknown as string;
    const hostname = `${appId}.ufs.sh`;
    expect(hostname).toBe("undefined.ufs.sh"); // BUG: wrong hostname
  });

  it("shows the fix: hardcode the App ID in next.config.mjs", () => {
    // The fix is to hardcode the App ID directly in next.config.mjs
    // instead of relying on process.env at config evaluation time.
    const HARDCODED_APP_ID = "x083086k6k";
    const hostname = `${HARDCODED_APP_ID}.ufs.sh`;
    expect(hostname).toBe("x083086k6k.ufs.sh"); // CORRECT
  });
});

// ============================================================
// BUG #5: file.type check is fragile for video MIME types
// The check: file.type.startsWith("image") ? "IMAGE" : "VIDEO"
// This is correct but fragile — any non-image MIME (e.g. "application/")
// would be classified as VIDEO. Should be an explicit check.
// ============================================================

describe("Bug #5: Fragile MIME type classification in attachment handler", () => {
  function classifyMedia(fileType: string): "IMAGE" | "VIDEO" {
    return fileType.startsWith("image") ? "IMAGE" : "VIDEO";
  }

  it("correctly classifies image/jpeg as IMAGE", () => {
    expect(classifyMedia("image/jpeg")).toBe("IMAGE");
  });

  it("correctly classifies video/mp4 as VIDEO", () => {
    expect(classifyMedia("video/mp4")).toBe("VIDEO");
  });

  it("BUG: incorrectly classifies application/pdf as VIDEO", () => {
    // This won't happen in practice because UploadThing limits file types,
    // but the logic is fragile.
    expect(classifyMedia("application/pdf")).toBe("VIDEO"); // Wrong!
  });

  it("shows the robust fix: explicit MIME type check", () => {
    function classifyMediaFixed(fileType: string): "IMAGE" | "VIDEO" {
      if (fileType.startsWith("image/")) return "IMAGE";
      if (fileType.startsWith("video/")) return "VIDEO";
      throw new Error(`Unsupported media type: ${fileType}`);
    }
    expect(classifyMediaFixed("image/png")).toBe("IMAGE");
    expect(classifyMediaFixed("video/webm")).toBe("VIDEO");
    expect(() => classifyMediaFixed("application/pdf")).toThrow(
      "Unsupported media type",
    );
  });
});
