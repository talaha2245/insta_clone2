import { cn, formatNumber, formatRelativeDate, slugify } from "@/lib/utils";
import { describe, expect, it } from "vitest";

describe("Utils Library", () => {
  describe("cn()", () => {
    it("should merge standard classes correctly", () => {
      expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
    });

    it("should handle conditional classes", () => {
      expect(cn("bg-red-500", true && "text-white", false && "p-4")).toBe(
        "bg-red-500 text-white",
      );
    });

    it("should handle conflicting tailwind classes via twMerge", () => {
      expect(cn("p-4 p-8")).toBe("p-8");
      expect(cn("bg-red-500 bg-blue-500")).toBe("bg-blue-500");
    });
  });

  describe("formatRelativeDate()", () => {
    it("should handle a date just minutes ago", () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeDate(date)).toMatch(/5 minutes ago/i);
    });

    it("should handle yesterday (approx 24h ago)", () => {
      const date = new Date(Date.now() - 25 * 60 * 60 * 1000);
      expect(formatRelativeDate(date)).toMatch(/^[A-Z][a-z]{2}\ \d{1,2}$/);
    });

    it("should handle months ago in the same year", () => {
      const date = new Date();
      date.setMonth(date.getMonth() - 2);
      expect(formatRelativeDate(date)).toMatch(/^[A-Z][a-z]{2}\ \d{1,2}$/);
    });

    it("should handle previous year", () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 1);
      expect(formatRelativeDate(date)).toMatch(
        /^[A-Z][a-z]{2}\ \d{1,2}, \d{4}$/,
      );
    });
  });

  describe("formatNumber()", () => {
    it("should format numbers under 1000 properly", () => {
      expect(formatNumber(500)).toBe("500");
      expect(formatNumber(999)).toBe("999");
    });

    it("should format thousands with K", () => {
      expect(formatNumber(1500)).toBe("1.5K");
      expect(formatNumber(1000)).toBe("1K");
      expect(formatNumber(12500)).toBe("12.5K");
    });

    it("should format millions with M", () => {
      expect(formatNumber(2000000)).toBe("2M");
      expect(formatNumber(2500000)).toBe("2.5M");
    });
  });

  describe("slugify()", () => {
    it("should convert simple strings properly", () => {
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("should remove special characters", () => {
      expect(slugify("Hello World!!!")).toBe("hello-world");
      expect(slugify("This is @ test")).toBe("this-is--test"); // based on regex replace(/ /g, "-").replace(/[^a-z0-9-]/g, "")
    });

    it("should handle multiple spaces and dashes", () => {
      expect(slugify("Hello   World---Test")).toBe("hello---world---test");
    });
  });
});
