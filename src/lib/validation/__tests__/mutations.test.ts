import { describe, it, expect } from "vitest";
import {
	validateCarrierData,
	validateLineData,
	validateStopsArray,
	validateDirection,
	validateDays,
	validateDepartureTimes,
	validateReportData,
	sanitizeString,
	isValidUUID,
} from "../mutations";

// ─── sanitizeString ────────────────────────────────────────────────────────────

describe("sanitizeString", () => {
	it("trims leading/trailing whitespace", () => {
		expect(sanitizeString("  hello  ", 100)).toBe("hello");
	});

	it("truncates to maxLength", () => {
		expect(sanitizeString("abcde", 3)).toBe("abc");
	});

	it("handles empty string", () => {
		expect(sanitizeString("", 100)).toBe("");
	});
});

// ─── isValidUUID ──────────────────────────────────────────────────────────────

describe("isValidUUID", () => {
	it("accepts a valid UUID v4", () => {
		expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
	});

	it("rejects an empty string", () => {
		expect(isValidUUID("")).toBe(false);
	});

	it("rejects a non-UUID string", () => {
		expect(isValidUUID("not-a-uuid")).toBe(false);
	});

	it("rejects a UUID with wrong segment lengths", () => {
		expect(isValidUUID("550e8400-e29b-41d4-a716-44665544000")).toBe(false);
	});
});

// ─── validateCarrierData ──────────────────────────────────────────────────────

describe("validateCarrierData", () => {
	it("returns valid when isNew is false (no validation needed)", () => {
		const result = validateCarrierData({ isNew: false, id: "some-id" });
		expect(result.valid).toBe(true);
	});

	it("returns valid with a proper carrier name", () => {
		const result = validateCarrierData({ isNew: true, name: "PKS Gdańsk" });
		expect(result.valid).toBe(true);
	});

	it("returns invalid when name is empty", () => {
		const result = validateCarrierData({ isNew: true, name: "" });
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("1-100");
	});

	it("returns invalid when name exceeds 100 chars", () => {
		const result = validateCarrierData({ isNew: true, name: "A".repeat(101) });
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("1-100");
	});

	it("accepts exactly 100 chars", () => {
		const result = validateCarrierData({ isNew: true, name: "A".repeat(100) });
		expect(result.valid).toBe(true);
	});

	it("returns invalid when name is missing and isNew is true", () => {
		const result = validateCarrierData({ isNew: true });
		expect(result.valid).toBe(false);
	});
});

// ─── validateLineData ─────────────────────────────────────────────────────────

describe("validateLineData", () => {
	it("returns valid when isNew is false", () => {
		const result = validateLineData({ isNew: false, id: "some-id" });
		expect(result.valid).toBe(true);
	});

	it("returns valid with proper number and no description", () => {
		const result = validateLineData({ isNew: true, number: "42" });
		expect(result.valid).toBe(true);
	});

	it("returns valid with number and description within limits", () => {
		const result = validateLineData({ isNew: true, number: "N5", description: "Night bus" });
		expect(result.valid).toBe(true);
	});

	it("returns invalid when number is empty", () => {
		const result = validateLineData({ isNew: true, number: "" });
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("1-50");
	});

	it("returns invalid when number exceeds 50 chars", () => {
		const result = validateLineData({ isNew: true, number: "A".repeat(51) });
		expect(result.valid).toBe(false);
	});

	it("returns invalid when description exceeds 500 chars", () => {
		const result = validateLineData({
			isNew: true,
			number: "42",
			description: "A".repeat(501),
		});
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("500");
	});

	it("accepts description of exactly 500 chars", () => {
		const result = validateLineData({
			isNew: true,
			number: "42",
			description: "A".repeat(500),
		});
		expect(result.valid).toBe(true);
	});
});

// ─── validateStopsArray ───────────────────────────────────────────────────────

describe("validateStopsArray", () => {
	const makeStop = (city: string, name: string) => ({ city, name });

	it("returns valid with 2 proper stops", () => {
		const result = validateStopsArray([
			makeStop("Gdańsk", "Dworzec Główny"),
			makeStop("Gdynia", "Port"),
		]);
		expect(result.valid).toBe(true);
	});

	it("returns invalid with fewer than 2 stops", () => {
		const result = validateStopsArray([makeStop("Gdańsk", "Dworzec")]);
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("2");
	});

	it("returns invalid with more than 50 stops", () => {
		const stops = Array.from({ length: 51 }, (_, i) => makeStop("City", `Stop ${i}`));
		const result = validateStopsArray(stops);
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("50");
	});

	it("accepts exactly 50 stops", () => {
		const stops = Array.from({ length: 50 }, (_, i) => makeStop("City", `Stop ${i}`));
		const result = validateStopsArray(stops);
		expect(result.valid).toBe(true);
	});

	it("returns invalid when stop city is empty", () => {
		const result = validateStopsArray([makeStop("", "Dworzec"), makeStop("Gdynia", "Port")]);
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("city");
	});

	it("returns invalid when stop name is empty", () => {
		const result = validateStopsArray([makeStop("Gdańsk", ""), makeStop("Gdynia", "Port")]);
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("name");
	});

	it("returns invalid when stop city exceeds 100 chars", () => {
		const result = validateStopsArray([
			makeStop("A".repeat(101), "Dworzec"),
			makeStop("Gdynia", "Port"),
		]);
		expect(result.valid).toBe(false);
	});

	it("returns invalid when stop name exceeds 150 chars", () => {
		const result = validateStopsArray([
			makeStop("Gdańsk", "A".repeat(151)),
			makeStop("Gdynia", "Port"),
		]);
		expect(result.valid).toBe(false);
	});
});

// ─── validateDirection ────────────────────────────────────────────────────────

describe("validateDirection", () => {
	it("returns valid for a normal direction string", () => {
		const result = validateDirection("Gdańsk → Gdynia");
		expect(result.valid).toBe(true);
	});

	it("returns invalid for empty string", () => {
		const result = validateDirection("");
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("1-200");
	});

	it("returns invalid for string exceeding 200 chars", () => {
		const result = validateDirection("A".repeat(201));
		expect(result.valid).toBe(false);
	});

	it("accepts exactly 200 chars", () => {
		const result = validateDirection("A".repeat(200));
		expect(result.valid).toBe(true);
	});

	it("trims and validates (trimmed result must still be ≥1 char)", () => {
		const result = validateDirection("   ");
		expect(result.valid).toBe(false);
	});
});

// ─── validateDays ─────────────────────────────────────────────────────────────

describe("validateDays", () => {
	it("returns valid for a single valid day", () => {
		const result = validateDays(["Pon"]);
		expect(result.valid).toBe(true);
	});

	it("returns valid for all 7 days", () => {
		const result = validateDays(["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"]);
		expect(result.valid).toBe(true);
	});

	it("returns invalid for empty array", () => {
		const result = validateDays([]);
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("1");
	});

	it("returns invalid for an unknown day abbreviation", () => {
		const result = validateDays(["Pon", "Xyz"]);
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("Xyz");
	});

	it("returns invalid for more than 7 days (duplicates)", () => {
		const result = validateDays(["Pon", "Pon", "Wt", "Wt", "Śr", "Śr", "Czw", "Czw"]);
		expect(result.valid).toBe(false);
	});
});

// ─── validateDepartureTimes ───────────────────────────────────────────────────

describe("validateDepartureTimes", () => {
	it("returns valid for a single valid time", () => {
		const result = validateDepartureTimes("08:30");
		expect(result.valid).toBe(true);
	});

	it("returns valid for multiple times separated by newlines", () => {
		const result = validateDepartureTimes("08:00\n12:30\n18:45");
		expect(result.valid).toBe(true);
	});

	it("ignores empty lines", () => {
		const result = validateDepartureTimes("08:00\n\n12:30\n");
		expect(result.valid).toBe(true);
	});

	it("returns invalid when no valid times found", () => {
		const result = validateDepartureTimes("not-a-time\nfoo");
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("1");
	});

	it("returns invalid when empty string provided", () => {
		const result = validateDepartureTimes("");
		expect(result.valid).toBe(false);
	});

	it("returns invalid when more than 50 valid times provided", () => {
		// Generate 51 valid HH:MM times using minutes (00:00, 00:01, ... 00:50)
		const times = Array.from({ length: 51 }, (_, i) => {
			const m = String(i).padStart(2, "0");
			return `00:${m}`;
		}).join("\n");
		const result = validateDepartureTimes(times);
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("50");
	});

	it("accepts exactly 50 valid times", () => {
		const times = Array.from({ length: 50 }, (_, i) => {
			const m = String(i).padStart(2, "0");
			return `00:${m}`;
		}).join("\n");
		const result = validateDepartureTimes(times);
		expect(result.valid).toBe(true);
	});
});

// ─── validateReportData ───────────────────────────────────────────────────────

describe("validateReportData", () => {
	const validId = "550e8400-e29b-41d4-a716-446655440000";

	it("returns valid for a minimal report with no comment", () => {
		const result = validateReportData({ scheduleId: validId, reason: "OUTDATED", comment: "" });
		expect(result.valid).toBe(true);
	});

	it("returns valid with a short comment", () => {
		const result = validateReportData({
			scheduleId: validId,
			reason: "OTHER",
			comment: "Short comment",
		});
		expect(result.valid).toBe(true);
	});

	it("returns invalid when scheduleId is not a UUID", () => {
		const result = validateReportData({
			scheduleId: "not-a-uuid",
			reason: "OUTDATED",
			comment: "",
		});
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("UUID");
	});

	it("returns invalid when comment exceeds 1000 chars", () => {
		const result = validateReportData({
			scheduleId: validId,
			reason: "OTHER",
			comment: "A".repeat(1001),
		});
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("1000");
	});

	it("accepts comment of exactly 1000 chars", () => {
		const result = validateReportData({
			scheduleId: validId,
			reason: "OTHER",
			comment: "A".repeat(1000),
		});
		expect(result.valid).toBe(true);
	});

	it("returns invalid for unknown reason", () => {
		const result = validateReportData({
			scheduleId: validId,
			reason: "INVALID_REASON" as never,
			comment: "",
		});
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("reason");
	});
});
