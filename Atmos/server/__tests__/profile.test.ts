import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { dbService } from "../services/db.service.js";

describe("Backend Profile REST API", () => {
  beforeEach(() => {
    dbService.reset(null, []);
  });

  afterAll(() => {
    dbService.reset(null, []);
  });

  describe("GET /api/profile", () => {
    it("should return null when no profile is set", async () => {
      const response = await request(app).get("/api/profile");
      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });

    it("should return saved profile", async () => {
      const profile = {
        country: "US",
        householdSize: 2,
        primaryTransport: "car_petrol",
        weeklyTransportKm: 100,
        dietType: "average",
        electricityKwh: 250,
        heatingType: "natural_gas",
        heatingQty: 40,
        recycleCompost: true,
      };
      dbService.saveProfile(profile);

      const response = await request(app).get("/api/profile");
      expect(response.status).toBe(200);
      expect(response.body.country).toBe("US");
      expect(response.body.householdSize).toBe(2);
    });
  });

  describe("POST /api/profile", () => {
    it("should save a valid profile", async () => {
      const profile = {
        country: "DE",
        householdSize: 3,
        primaryTransport: "public",
        weeklyTransportKm: 50,
        dietType: "vegetarian",
        electricityKwh: 200,
        heatingType: "electric",
        heatingQty: 0,
        recycleCompost: false,
      };

      const response = await request(app)
        .post("/api/profile")
        .send(profile);

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
      expect(response.body.profile.country).toBe("DE");
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/profile")
        .send({ country: "US" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
