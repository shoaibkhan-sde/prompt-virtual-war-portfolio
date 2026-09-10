import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { dbService } from "../services/db.service.js";
import { cacheService } from "../services/cache.service.js";

describe("Backend Rate Limiting", () => {
  beforeEach(() => {
    // Reset services so it doesn't fail due to actual logic missing, just tests the rate limit.
    dbService.reset({
      country: "US",
      householdSize: 1,
      primaryTransport: "car_petrol",
      weeklyTransportKm: 10,
      dietType: "average",
      electricityKwh: 100,
      heatingType: "none",
      heatingQty: 0,
      recycleCompost: false
    }, []);
    cacheService.invalidateAll();
  });

  afterEach(() => {
    dbService.reset(null, []);
    cacheService.invalidateAll();
    vi.restoreAllMocks();
  });

  it("should enforce rate limiting after 30 requests on /api/insights", async () => {
    // Fire 30 requests - should all succeed (200)
    for (let i = 0; i < 30; i++) {
      const res = await request(app).get("/api/insights");
      // Could be 200 or something else if logic fails, but shouldn't be 429
      expect(res.status).not.toBe(429);
    }

    // Fire 31st request - should fail with 429 Too Many Requests
    const res31 = await request(app).get("/api/insights");
    expect(res31.status).toBe(429);
    expect(res31.body.error).toBeDefined();
    expect(res31.body.error.message).toContain("Too many requests");
  }, 10000); // giving this test extra time
});
