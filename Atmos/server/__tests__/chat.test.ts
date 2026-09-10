import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { dbService } from "../services/db.service.js";
import { geminiService } from "../services/gemini.service.js";
import { cacheService } from "../services/cache.service.js";

describe("Backend Chat REST API", () => {
  const testProfile = {
    country: "US",
    householdSize: 2,
    primaryTransport: "car_petrol",
    weeklyTransportKm: 120,
    dietType: "average",
    electricityKwh: 250,
    heatingType: "natural_gas",
    heatingQty: 40,
    recycleCompost: true,
  };

  beforeEach(() => {
    dbService.reset(testProfile, []);
    cacheService.invalidateAll();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    dbService.reset(null, []);
    cacheService.invalidateAll();
  });

  describe("POST /api/chat", () => {
    it("should return a reply for a valid message", async () => {
      vi.spyOn(geminiService, "sendChatMessage").mockResolvedValue({
        reply: "Here are some tips to reduce your carbon footprint.",
        usingFallback: false,
      });

      const response = await request(app)
        .post("/api/chat")
        .send({ message: "How can I reduce my emissions?" });

      expect(response.status).toBe(200);
      expect(response.body.reply).toBeDefined();
      expect(typeof response.body.reply).toBe("string");
    });

    it("should return 400 for missing message field", async () => {
      const response = await request(app)
        .post("/api/chat")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should fall back to local chat when Gemini fails", async () => {
      vi.spyOn(geminiService, "sendChatMessage").mockResolvedValue({
        reply: "Local fallback advice.",
        usingFallback: true,
      });

      const response = await request(app)
        .post("/api/chat")
        .send({ message: "Give me tips" });

      expect(response.status).toBe(200);
      expect(response.body.reply).toBeDefined();
      expect(response.body.usingFallback).toBe(true);
    });
  });
});
