import {
  createCommentSchema,
  createPostSchema,
  loginSchema,
  signUpSchema,
  updateUserProfileSchema,
} from "@/lib/validation";
import { describe, expect, it } from "vitest";

describe("Validation Schemas", () => {
  describe("signUpSchema", () => {
    it("should pass with valid data", () => {
      const result = signUpSchema.safeParse({
        username: "johndoe",
        email: "john@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should fail with invalid email", () => {
      const result = signUpSchema.safeParse({
        username: "johndoe",
        email: "johnexample.com",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email address");
      }
    });

    it("should fail with short password", () => {
      const result = signUpSchema.safeParse({
        username: "johndoe",
        email: "john@example.com",
        password: "pass",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Must be at least 8 characters",
        );
      }
    });

    it("should fail with invalid username format", () => {
      const result = signUpSchema.safeParse({
        username: "john doe space",
        email: "john@example.com",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Only letters, numbers, - and _ allowed",
        );
      }
    });
  });

  describe("loginSchema", () => {
    it("should pass with valid credentials", () => {
      const result = loginSchema.safeParse({
        username: "johndoe",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("createPostSchema", () => {
    it("should enforce max 5 attachments", () => {
      const result = createPostSchema.safeParse({
        content: "Hello",
        mediaIds: ["1", "2", "3", "4", "5", "6"],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Cannot have more than 5 attachments",
        );
      }
    });
  });

  describe("updateUserProfileSchema", () => {
    it("should enforce 1000 character bio limit", () => {
      const longBio = "a".repeat(1001);
      const result = updateUserProfileSchema.safeParse({
        displayName: "John Doe",
        bio: longBio,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Must be at most 1000 characters",
        );
      }
    });
  });
});
