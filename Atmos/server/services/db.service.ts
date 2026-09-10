/**
 * @module DbService
 * @description JSON-file database service with in-memory state and atomic disk persistence.
 *
 * This is the **single source of truth** for all Atmos data: the user's carbon profile
 * (`UserProfile`), the complete carbon ledger (`ActivityLog[]`), reduction offset targets
 * (`goals`), and achievement records.
 *
 * Design principles:
 * - All reads are served from an in-memory `state` object (zero-latency, O(1)).
 * - Writes are **debounced** ({@link DB_WRITE_DEBOUNCE_MS} ms) and persisted atomically
 *   via temp-file rename, preventing partial-write corruption.
 * - A Promise-based write mutex serialises concurrent disk writes.
 * - In `test` mode, a separate `db.test.json` file is used to isolate test state.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DBState, UserProfile, ActivityLog } from "../types/index.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { DB_WRITE_DEBOUNCE_MS } from "../constants/carbon.constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Absolute path to the data directory containing the JSON database file. */
const DB_DIR = path.resolve(__dirname, "../data");

/** Path to the active database file (test-isolated when `NODE_ENV === 'test'`). */
const DB_FILE =
  env.NODE_ENV === "test"
    ? path.join(DB_DIR, "db.test.json")
    : path.join(DB_DIR, "db.json");

/** Path to the atomic temp file used during write operations. */
const TEMP_DB_FILE =
  env.NODE_ENV === "test"
    ? path.join(DB_DIR, "db.test.tmp.json")
    : path.join(DB_DIR, "db.tmp.json");

/** Synthetic user ID injected into all returned data shapes. Single-user architecture. */
const DEFAULT_USER_ID = "default-user";

/**
 * Default empty carbon ledger state used when no database file exists or on reset.
 * Sets a conservative 15% reduction offsetTarget as the initial goal.
 */
const defaultState: DBState = {
  profile: null,
  activities: [],
  goals: {
    targetPercent: 15,
    targetAnnualKg: 0,
  },
  achievements: [],
};

/**
 * JSON-file database service with in-memory state and atomic disk persistence.
 *
 * All public methods are O(1) for reads and O(n) for write mutations that
 * require re-sorting the carbon ledger. The write path is O(n) only for
 * `saveActivity` (due to sort); all other writes are O(1).
 */
class DbService {
  /** In-memory mirror of the full carbon ledger state. */
  private state: DBState = { ...defaultState };

  /** Handle for the debounce timer that batches rapid writes. */
  private writeTimeout: NodeJS.Timeout | null = null;

  /**
   * Write mutex: chains concurrent disk writes as Promises to prevent
   * interleaved writes from corrupting the JSON database file.
   */
  private writeLock: Promise<void> = Promise.resolve();

  constructor() {
    this.initDB();
    this.loadDB();
  }

  /**
   * Ensures the data directory and database file exist on disk.
   * Creates them with default state if absent. Called once at startup.
   *
   * @returns {void}
   */
  private initDB(): void {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultState, null, 2), "utf-8");
    }
  }

  /**
   * Reads the database file from disk into the in-memory `state` object.
   * Applies defensive defaults for missing optional fields introduced in
   * later schema versions. Falls back to `defaultState` on parse error.
   *
   * @returns {void}
   */
  private loadDB(): void {
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      this.state = JSON.parse(data) as DBState;

      // Seed default fields if missing from older schema versions
      if (!this.state.goals) {
        this.state.goals = { targetPercent: 15, targetAnnualKg: 0 };
      }
      if (!this.state.activities) {
        this.state.activities = [];
      }
      if (!this.state.achievements) {
        this.state.achievements = [];
      }
    } catch (error) {
      logger.error({
        event: "db_load_failed",
        message: "Error reading database file. Using fallback default state.",
        error: error instanceof Error ? error.message : String(error),
      });
      this.state = { ...defaultState };
    }
  }

  /**
   * Schedules a debounced atomic disk write.
   *
   * Resets the timer on every call, coalescing rapid successive writes
   * (e.g., bulk imports) into a single disk operation after
   * {@link DB_WRITE_DEBOUNCE_MS} milliseconds of inactivity.
   *
   * @returns {void}
   */
  private saveDBDebounced(): void {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }
    this.writeTimeout = setTimeout(() => {
      this.saveDBAtomic();
    }, DB_WRITE_DEBOUNCE_MS);
  }

  /**
   * Atomically persists the current in-memory carbon ledger state to disk.
   *
   * Strategy: write serialised JSON to a temp file first, then `rename` over
   * the actual database file. This prevents partial writes from corrupting
   * `db.json` if the process is killed mid-write. Uses a Promise-based mutex
   * (`writeLock`) to serialise concurrent write attempts.
   *
   * @returns {void}
   */
  private saveDBAtomic(): void {
    this.writeLock = this.writeLock.then(() => {
      try {
        fs.writeFileSync(TEMP_DB_FILE, JSON.stringify(this.state, null, 2), "utf-8");
        fs.renameSync(TEMP_DB_FILE, DB_FILE);
      } catch (error) {
        logger.warn({
          event: "db_atomic_rename_failed",
          message: "Atomic rename failed. Attempting direct write fallback.",
          error: error instanceof Error ? error.message : String(error),
        });
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), "utf-8");
        } catch (directError) {
          logger.error({
            event: "db_write_failed",
            message: "Direct database write also failed. Data may be lost.",
            error: directError instanceof Error ? directError.message : String(directError),
          });
        }
      }
    });
  }

  /**
   * Returns the current user's carbon profile augmented with a synthetic `userId`.
   *
   * @returns {(UserProfile & { userId: string }) | null} The profile or `null` if
   *   onboarding has not been completed.
   */
  public getProfile(): (UserProfile & { userId: string }) | null {
    if (!this.state.profile) return null;
    return { ...this.state.profile, userId: DEFAULT_USER_ID };
  }

  /**
   * Persists the user's carbon profile to in-memory state and schedules a disk write.
   *
   * @param {UserProfile} profile - The validated profile data from onboarding.
   * @returns {UserProfile} The saved profile object.
   */
  public saveProfile(profile: UserProfile): UserProfile {
    this.state.profile = { ...profile };
    this.saveDBDebounced();
    return this.state.profile;
  }

  /**
   * Returns all logged carbon emission entries (the carbon ledger) sorted newest-first,
   * each augmented with a synthetic `userId`.
   *
   * @returns {(ActivityLog & { userId: string })[]} The full carbon ledger array.
   */
  public getActivities(): (ActivityLog & { userId: string })[] {
    return this.state.activities.map((act) => ({
      ...act,
      userId: DEFAULT_USER_ID,
    }));
  }

  /**
   * Upserts a carbon emission entry into the ledger (insert or update by `id`).
   * Maintains the ledger in descending date order after every mutation.
   * Schedules a debounced disk write.
   *
   * @param {ActivityLog} activity - The emission entry to persist. Must have a unique `id`.
   * @returns {void}
   */
  public saveActivity(activity: ActivityLog): void {
    const idx = this.state.activities.findIndex((a) => a.id === activity.id);
    if (idx !== -1) {
      this.state.activities[idx] = activity;
    } else {
      this.state.activities.push(activity);
    }
    // Keep carbon ledger sorted newest-first (O(n log n))
    this.state.activities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    this.saveDBDebounced();
  }

  /**
   * Removes a carbon emission entry from the ledger by `id`.
   *
   * @param {string} id - The unique identifier of the emission entry to delete.
   * @returns {boolean} `true` if the entry was found and removed; `false` if not found.
   */
  public deleteActivity(id: string): boolean {
    const idx = this.state.activities.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.state.activities.splice(idx, 1);
    this.saveDBDebounced();
    return true;
  }

  /**
   * Returns the current carbon reduction offset targets augmented with a synthetic `userId`.
   *
   * @returns {{ targetPercent: number; targetAnnualKg: number; userId: string }}
   *   The current reduction goals object.
   */
  public getGoals(): { targetPercent: number; targetAnnualKg: number; userId: string } {
    return { ...this.state.goals, userId: DEFAULT_USER_ID };
  }

  /**
   * Persists updated carbon reduction offset targets and schedules a disk write.
   *
   * @param {number} targetPercent - Target reduction as a percentage of baseline (0–100).
   * @param {number} targetAnnualKg - Absolute annual offsetTarget in kg CO₂e.
   * @returns {void}
   */
  public saveGoals(targetPercent: number, targetAnnualKg: number): void {
    this.state.goals = { targetPercent, targetAnnualKg };
    this.saveDBDebounced();
  }

  /**
   * Forces an immediate synchronous atomic disk write, bypassing the debounce timer.
   * Used during graceful shutdown or test teardown to guarantee state is persisted.
   *
   * @returns {void}
   */
  public flush(): void {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
      this.writeTimeout = null;
    }
    this.saveDBAtomic();
  }

  /**
   * Resets the entire carbon ledger to a clean state (or provided seed data).
   * Cancels any pending debounced write and immediately persists the reset state.
   * Used primarily in test teardown and account reset flows.
   *
   * @param {UserProfile | null} [profile=null] - Optional initial profile to seed.
   * @param {ActivityLog[]} [activities=[]] - Optional initial emission entries to seed.
   * @param {{ targetPercent: number; targetAnnualKg: number }} [goals] - Optional initial
   *   offsetTarget values (defaults to 15% / 0 kg).
   * @returns {void}
   */
  public reset(
    profile: UserProfile | null = null,
    activities: ActivityLog[] = [],
    goals = { targetPercent: 15, targetAnnualKg: 0 }
  ): void {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
      this.writeTimeout = null;
    }
    this.state = { profile, activities, goals, achievements: [] };
    this.saveDBAtomic();
  }
}

export const dbService = new DbService();
