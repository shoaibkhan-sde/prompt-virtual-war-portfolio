import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { dbService } from "../services/db.service.js";

describe("Backend Activities REST API - Extended", () => {
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

  describe("PUT /api/activities/:id", () => {
    it("should update an existing activity", async () => {
      // Seed an activity
      const createRes = await request(app)
        .post("/api/activities")
        .send({
          category: "Transport",
          type: "car_petrol",
          value: 10,
          note: "Original commute",
        });

      const actId = createRes.body.activity.id;

      // Update it
      const updateRes = await request(app)
        .put(`/api/activities/${actId}`)
        .send({
          category: "Transport",
          type: "car_petrol",
          value: 25,
          note: "Longer commute",
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.activity.value).toBe(25);
      expect(updateRes.body.activity.note).toBe("Longer commute");
      expect(updateRes.body.activity.emissions).toBeCloseTo(4.5, 1);
    });

    it("should return 404 for non-existent activity", async () => {
      const response = await request(app)
        .put("/api/activities/non_existent_id")
        .send({
          category: "Transport",
          type: "car_petrol",
          value: 10,
        });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/activities/:id", () => {
    it("should delete an existing activity", async () => {
      // Seed
      const createRes = await request(app)
        .post("/api/activities")
        .send({
          category: "Food",
          type: "vegan",
          value: 1,
          note: "Test vegan day",
        });

      const actId = createRes.body.activity.id;

      // Delete
      const deleteRes = await request(app).delete(`/api/activities/${actId}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toBeDefined();

      // Verify it's gone
      const getRes = await request(app).get("/api/activities");
      expect(getRes.body.length).toBe(0);
    });

    it("should return 404 for deleting non-existent activity", async () => {
      const response = await request(app).delete("/api/activities/non_existent_id");
      expect(response.status).toBe(404);
    });
  });
});
