import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { dbService } from "../services/db.service.js";

describe("Backend Goals REST API", () => {
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
  });

  afterAll(() => {
    dbService.reset(null, []);
  });

  describe("GET /api/goals", () => {
    it("should return default goals", async () => {
      const response = await request(app).get("/api/goals");
      expect(response.status).toBe(200);
      expect(response.body.targetPercent).toBe(15);
      expect(response.body.targetAnnualKg).toBeDefined();
    });
  });

  describe("POST /api/goals", () => {
    it("should save valid goals", async () => {
      const response = await request(app)
        .post("/api/goals")
        .send({ targetPercent: 20, targetAnnualKg: 5000 });

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
      expect(response.body.goals.targetPercent).toBe(20);
    });

    it("should return 400 for missing targetPercent", async () => {
      const response = await request(app)
        .post("/api/goals")
        .send({ targetAnnualKg: 5000 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for negative targetPercent", async () => {
      const response = await request(app)
        .post("/api/goals")
        .send({ targetPercent: -5 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
