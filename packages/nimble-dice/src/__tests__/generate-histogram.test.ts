import { describe, expect, it } from "vitest";
import { generateHistogram } from "../index";

describe("generateHistogram", () => {
  describe("returns null for invalid input", () => {
    it("returns null for empty string", () => {
      expect(generateHistogram("")).toBeNull();
    });

    it("returns null for whitespace", () => {
      expect(generateHistogram("   ")).toBeNull();
    });

    it("returns null for nonsense", () => {
      expect(generateHistogram("abc")).toBeNull();
    });
  });

  describe("basic structure", () => {
    it("returns correct structure for 1d6", () => {
      const result = generateHistogram("1d6", {}, 1000);
      expect(result).not.toBeNull();
      expect(result!.samples).toBe(1000);
      expect(result!.min).toBeGreaterThanOrEqual(1);
      expect(result!.max).toBeLessThanOrEqual(6);
      expect(result!.mean).toBeGreaterThan(0);
      expect(result!.median).toBeGreaterThan(0);
      expect(result!.buckets.length).toBeGreaterThan(0);
      expect(result!.buckets.length).toBeLessThanOrEqual(6);
    });

    it("buckets have value, count, and percentage", () => {
      const result = generateHistogram("1d6", {}, 100);
      expect(result).not.toBeNull();
      for (const bucket of result!.buckets) {
        expect(typeof bucket.value).toBe("number");
        expect(typeof bucket.count).toBe("number");
        expect(typeof bucket.percentage).toBe("number");
        expect(bucket.count).toBeGreaterThan(0);
        expect(bucket.percentage).toBeGreaterThan(0);
        expect(bucket.percentage).toBeLessThanOrEqual(100);
      }
    });

    it("bucket counts sum to total samples", () => {
      const result = generateHistogram("2d6", {}, 5000);
      expect(result).not.toBeNull();
      const totalCount = result!.buckets.reduce((sum, b) => sum + b.count, 0);
      expect(totalCount).toBe(5000);
    });

    it("buckets are sorted by value", () => {
      const result = generateHistogram("2d8+5", {}, 1000);
      expect(result).not.toBeNull();
      for (let i = 1; i < result!.buckets.length; i++) {
        expect(result!.buckets[i].value).toBeGreaterThan(result!.buckets[i - 1].value);
      }
    });
  });

  describe("statistical properties", () => {
    it("1d6 mean is close to 3.5", () => {
      const result = generateHistogram("1d6", {}, 10000);
      expect(result!.mean).toBeGreaterThan(3);
      expect(result!.mean).toBeLessThan(4);
    });

    it("2d6 mean is close to 7", () => {
      const result = generateHistogram("2d6", {}, 10000);
      expect(result!.mean).toBeGreaterThan(6.5);
      expect(result!.mean).toBeLessThan(7.5);
    });

    it("1d6 produces values 1-6 only", () => {
      const result = generateHistogram("1d6", {}, 5000);
      expect(result!.min).toBe(1);
      expect(result!.max).toBe(6);
      expect(result!.buckets.length).toBe(6);
    });

    it("2d6+5 has range 7-17", () => {
      const result = generateHistogram("2d6+5", {}, 5000);
      expect(result!.min).toBe(7);
      expect(result!.max).toBe(17);
    });

    it("constant formula returns single bucket", () => {
      const result = generateHistogram("10", {}, 100);
      if (result) {
        expect(result.buckets.length).toBe(1);
        expect(result.buckets[0].value).toBe(10);
        expect(result.buckets[0].count).toBe(100);
        expect(result.min).toBe(10);
        expect(result.max).toBe(10);
      }
    });
  });

  describe("sample count parameter", () => {
    it("respects custom sample count", () => {
      const result = generateHistogram("1d6", {}, 500);
      expect(result!.samples).toBe(500);
      const totalCount = result!.buckets.reduce((sum, b) => sum + b.count, 0);
      expect(totalCount).toBe(500);
    });

    it("defaults to 10000 samples", () => {
      const result = generateHistogram("1d6");
      expect(result!.samples).toBe(10000);
    });
  });

  describe("complex formulas", () => {
    it("handles dice with modifiers: 1d8+10", () => {
      const result = generateHistogram("1d8+10", {}, 1000);
      expect(result).not.toBeNull();
      expect(result!.min).toBeGreaterThanOrEqual(11);
      expect(result!.max).toBeLessThanOrEqual(18);
    });

    it("handles multiplication: (1d6+2)*2", () => {
      const result = generateHistogram("(1d6+2)*2", {}, 1000);
      expect(result).not.toBeNull();
      expect(result!.min).toBeGreaterThanOrEqual(6);
      expect(result!.max).toBeLessThanOrEqual(16);
    });

    it("handles exploding dice: 1d6!", () => {
      const result = generateHistogram("1d6!", { allowCriticals: true }, 5000);
      expect(result).not.toBeNull();
      // Exploding dice can exceed normal max
      expect(result!.max).toBeGreaterThanOrEqual(6);
    });
  });

  describe("median calculation", () => {
    it("median is within min-max range", () => {
      const result = generateHistogram("2d6", {}, 1000);
      expect(result!.median).toBeGreaterThanOrEqual(result!.min);
      expect(result!.median).toBeLessThanOrEqual(result!.max);
    });

    it("median is close to mean for symmetric distributions", () => {
      // 2d6 is roughly symmetric around 7
      const result = generateHistogram("2d6", {}, 10000);
      expect(Math.abs(result!.median - result!.mean)).toBeLessThan(1);
    });
  });
});
