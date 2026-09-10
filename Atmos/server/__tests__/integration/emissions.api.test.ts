import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../server.js";
import { dbService } from "../../services/db.service.js";

describe("Emissions API Integration Tests", () => {
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

  describe("POST /api/activities", () => {
    it("should return 400 when category is not one of the enum values", async () => {
      const payload = {
        category: "InvalidCategory",
        type: "car_petrol",
        value: 15,
        note: "Commute",
      };

      const response = await request(app)
        .post("/api/activities")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when value is negative", async () => {
      const payload = {
        category: "Transport",
        type: "car_petrol",
        value: -10,
        note: "Negative value",
      };

      const response = await request(app)
        .post("/api/activities")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when required fields are missing", async () => {
      const payload = {
        // Missing category and value
        type: "car_petrol",
        note: "Missing fields",
      };

      const response = await request(app)
        .post("/api/activities")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
