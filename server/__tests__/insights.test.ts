import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { dbService } from "../services/db.service.js";
import { geminiService } from "../services/gemini.service.js";
import { cacheService } from "../services/cache.service.js";

describe("Backend Insights & Caching REST API", () => {
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

  it("should cache insights response on duplicate requests and invalidate when database state changes", async () => {
    // 1. Mock the geminiService generateInsights response
    const spy = vi.spyOn(geminiService, "generateInsights").mockResolvedValue({
      insight: "Mocked AI carbon driver advice.",
      actionPlan: [
        {
          id: "act_1",
          title: "Test Task",
          description: "Details",
          co2SavedKg: 5,
          category: "Transport",
          difficulty: "Easy",
        },
      ],
      goalCoaching: "Keep it up.",
      usingFallback: false,
    });

    // 2. First call: Hits the service (not cached yet)
    const res1 = await request(app).get("/api/insights");
    expect(res1.status).toBe(200);
    expect(res1.body.insight).toBe("Mocked AI carbon driver advice.");
    expect(spy).toHaveBeenCalledTimes(1);

    // 3. Second call: Should serve from cache directly without calling the service
    const res2 = await request(app).get("/api/insights");
    expect(res2.status).toBe(200);
    expect(res2.body.insight).toBe("Mocked AI carbon driver advice.");
    expect(spy).toHaveBeenCalledTimes(1); // Call count remains 1!

    // 4. State Change: Post a new transaction activity (which calls cacheService.invalidateAll())
    const payload = {
      category: "Food",
      type: "vegan",
      value: 1,
      note: "Vegan Diet Day",
    };
    await request(app).post("/api/activities").send(payload);

    // 5. Third call: Cache is invalidated, should invoke Gemini service again
    const res3 = await request(app).get("/api/insights");
    expect(res3.status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(2); // Call count incremented to 2!
  });

  it("should fall back gracefully to local insights when gemini service throws an error", async () => {
    // Mock generateInsights to reject/throw
    vi.spyOn(geminiService, "generateInsights").mockRejectedValue(new Error("Gemini quota exceeded"));

    const response = await request(app).get("/api/insights");
    
    // Asserts that the response is successful (200) and contains local fallback properties
    expect(response.status).toBe(200);
    expect(response.body.insight).toBeDefined();
    expect(response.body.actionPlan).toBeDefined();
    expect(response.body.usingFallback).toBe(true);
  });

  it("should generate consistent state hashes for identical inputs", () => {
    const activities = [
      { id: "1", date: "2023-01-01", category: "Transport", type: "car_petrol", value: 10, emissions: 1.8 }
    ];
    
    const hash1 = cacheService.generateStateHash(testProfile, activities, 15);
    const hash2 = cacheService.generateStateHash(testProfile, activities, 15);
    expect(hash1).toBe(hash2);

    // Should change if profile changes
    const hash3 = cacheService.generateStateHash({ ...testProfile, country: "UK" }, activities, 15);
    expect(hash1).not.toBe(hash3);

    // Should change if activities change
    const activitiesNew = [
      { id: "1", date: "2023-01-01", category: "Transport", type: "car_petrol", value: 10, emissions: 1.8 },
      { id: "2", date: "2023-01-02", category: "Food", type: "vegan", value: 1, emissions: 4.1 }
    ];
    const hash4 = cacheService.generateStateHash(testProfile, activitiesNew, 15);
    expect(hash1).not.toBe(hash4);

    // Should change if goal changes
    const hash5 = cacheService.generateStateHash(testProfile, activities, 20);
    expect(hash1).not.toBe(hash5);
  });
});
