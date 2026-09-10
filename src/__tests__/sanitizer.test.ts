/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { sanitizeString } from "../../server/middleware/validate";
import { renderSafeAIContent } from "../utils/sanitizer";

describe("Sanitizer Validation Tests", () => {
  describe("server: sanitizeString", () => {
    it("should remove simple HTML tags", () => {
      expect(sanitizeString("Hello <b>world</b>")).toBe("Hello world");
      expect(sanitizeString("<script>alert('xss')</script>")).toBe("alert('xss')");
    });

    it("should remove complex, nested, or adversarial tags", () => {
      expect(sanitizeString("<<script>script>alert(1)</script>")).toBe("script>alert(1)");
      expect(sanitizeString("<img src='x' onerror='alert(1)'>")).toBe("");
      expect(sanitizeString("<a href='javascript:alert(1)'>Click me</a>")).toBe("Click me");
    });

    it("should preserve harmless text and punctuation", () => {
      expect(sanitizeString("I drove 15km today!")).toBe("I drove 15km today!");
      expect(sanitizeString("It costs $10 & saves 5%")).toBe("It costs $10 & saves 5%");
    });
  });

  describe("client: renderSafeAIContent", () => {
    it("should render harmless strings safely", () => {
      const el: any = renderSafeAIContent("Normal text output");
      // renderSafeAIContent returns a <span> wrapping the lines
      expect(el.type).toBe("span");
      expect((el.props.children as any[])[0].props.children[1][0]).toBe("Normal text output");
    });

    it("should handle newlines by inserting React <br /> elements", () => {
      const el: any = renderSafeAIContent("Line 1\nLine 2");
      expect(el.type).toBe("span");
      const lines = el.props.children as any[];
      expect(lines.length).toBe(2);
      // second line should have a <br />
      expect(lines[1].props.children[0].type).toBe("br");
    });
  });
});
