import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { dbService } from "../services/db.service.js";

describe("Backend Activities REST API Integration", () => {
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
    // Reset test database to empty state
    dbService.reset(testProfile, []);
  });

  afterAll(() => {
    // Clean up test DB state
    dbService.reset(null, []);
  });

  describe("GET /api/health", () => {
    it("should return ok health check", async () => {
      const response = await request(app).get("/api/health");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "ok" });
    });
  });

  describe("POST /api/activities", () => {
    it("should successfully log a valid transport commute and calculate emissions", async () => {
      const payload = {
        category: "Transport",
        type: "car_petrol",
        value: 15,
        note: "Daily Commute",
      };

      const response = await request(app)
        .post("/api/activities")
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Activity added successfully");
      expect(response.body.activity).toBeDefined();
      
      const act = response.body.activity;
      expect(act.category).toBe("Transport");
      expect(act.type).toBe("car_petrol");
      expect(act.value).toBe(15);
      // Emissions for 15km car_petrol in US: 15 * 0.18 = 2.7 kg
      expect(act.emissions).toBeCloseTo(2.7, 1);
      expect(act.note).toBe("Daily Commute");
    });

    it("should return 400 VALIDATION_ERROR on missing category", async () => {
      const payload = {
        type: "car_petrol",
        value: 15,
      };

      const response = await request(app)
        .post("/api/activities")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("validation failed");
    });

    it("should return 400 VALIDATION_ERROR on negative values", async () => {
      const payload = {
        category: "Transport",
        type: "car_petrol",
        value: -5,
      };

      const response = await request(app)
        .post("/api/activities")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/activities", () => {
    it("should retrieve logged activities", async () => {
      // Seed an activity
      dbService.saveActivity({
        id: "act_test_1",
        date: "2026-06-12",
        category: "Food",
        type: "vegan",
        value: 1,
        emissions: 4.1,
        note: "Vegan Day",
      });

      const response = await request(app).get("/api/activities");
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe("act_test_1");
    });
  });
});
