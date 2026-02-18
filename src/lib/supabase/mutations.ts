import { createClient } from "./client";
import type { CreatorData } from "@/components/creator/ScheduleCreator";

export interface SubmitScheduleResult {
	success: boolean;
	scheduleId?: string;
	error?: string;
}

export async function submitSchedule(
	data: CreatorData,
	userId: string
): Promise<SubmitScheduleResult> {
	const supabase = createClient();

	try {
		// 1. Utwórz lub znajdź przewoźnika
		let carrierId = data.carrier?.id;

		if (data.carrier?.isNew && data.carrier.name) {
			const { data: newCarrier, error: carrierError } = await supabase
				.from("carriers")
				.insert({ name: data.carrier.name })
				.select("id")
				.single();

			if (carrierError) {
				const { data: existing } = await supabase
					.from("carriers")
					.select("id")
					.eq("name", data.carrier.name)
					.single();

				if (existing) {
					carrierId = existing.id;
				} else {
					throw new Error(`Błąd tworzenia przewoźnika: ${carrierError.message}`);
				}
			} else {
				carrierId = newCarrier.id;
			}
		}

		if (!carrierId) {
			throw new Error("Brak przewoźnika");
		}

		// 2. Utwórz lub znajdź linię
		let lineId = data.line?.id;

		if (data.line?.isNew && data.line.number) {
			const { data: newLine, error: lineError } = await supabase
				.from("lines")
				.insert({
					carrier_id: carrierId,
					number: data.line.number,
					description: data.line.description || null,
				})
				.select("id")
				.single();

			if (lineError) {
				const { data: existing } = await supabase
					.from("lines")
					.select("id")
					.eq("carrier_id", carrierId)
					.eq("number", data.line.number)
					.single();

				if (existing) {
					lineId = existing.id;
				} else {
					throw new Error(`Błąd tworzenia linii: ${lineError.message}`);
				}
			} else {
				lineId = newLine.id;
			}
		}

		if (!lineId) {
			throw new Error("Brak linii");
		}

		// 3. Utwórz przystanki (jeśli nowe)
		const stopIds: string[] = [];

		for (const stop of data.stops) {
			if (stop.id) {
				stopIds.push(stop.id);
			} else {
				const { data: existing } = await supabase
					.from("stops")
					.select("id")
					.eq("city", stop.city)
					.eq("name", stop.name)
					.single();

				if (existing) {
					stopIds.push(existing.id);
				} else {
					const { data: newStop, error: stopError } = await supabase
						.from("stops")
						.insert({
							city: stop.city,
							name: stop.name,
							created_by: userId,
						})
						.select("id")
						.single();

					if (stopError) {
						throw new Error(`Błąd tworzenia przystanku: ${stopError.message}`);
					}
					stopIds.push(newStop.id);
				}
			}
		}

		// 4. Parsuj godziny odjazdu
		const timeRegex = /([0-1]?[0-9]|2[0-3]):([0-5][0-9])/;
		const departureTimes = data.departures
			.split("\n")
			.map((line) => {
				const match = line.match(timeRegex);
				if (match) {
					const [hours, minutes] = match[0].split(":");
					return `${hours.padStart(2, "0")}:${minutes}:00`;
				}
				return null;
			})
			.filter((time): time is string => time !== null);

		if (departureTimes.length === 0) {
			throw new Error("Brak poprawnych godzin odjazdu");
		}

		// 5. Utwórz OSOBNY SCHEDULE dla każdej godziny odjazdu
		let firstScheduleId: string | null = null;

		for (const departureTime of departureTimes) {
			// Utwórz schedule
			const { data: newSchedule, error: scheduleError } = await supabase
				.from("schedules")
				.insert({
					line_id: lineId,
					direction: data.direction,
					version: 1,
					status: "pending",
					is_incomplete: false,
					is_verified: false,
					days: data.days,
					excludes_holidays: data.excludesHolidays,
					created_by: userId,
				})
				.select("id")
				.single();

			if (scheduleError) {
				throw new Error(`Błąd tworzenia rozkładu: ${scheduleError.message}`);
			}

			const scheduleId = newSchedule.id;
			if (!firstScheduleId) {
				firstScheduleId = scheduleId;
			}

			// Utwórz route_stops dla tego schedule
			const routeStopsData = stopIds.map((stopId, index) => ({
				schedule_id: scheduleId,
				stop_id: stopId,
				order_index: index + 1,
				offset_minutes: 0,
			}));

			const { error: routeStopsError } = await supabase
				.from("route_stops")
				.insert(routeStopsData);

			if (routeStopsError) {
				throw new Error(`Błąd tworzenia trasy: ${routeStopsError.message}`);
			}

			// Utwórz JEDEN course dla tego schedule
			const { error: courseError } = await supabase.from("courses").insert({
				schedule_id: scheduleId,
				departure_time: departureTime,
				use_offsets: true,
			});

			if (courseError) {
				throw new Error(`Błąd tworzenia kursu: ${courseError.message}`);
			}
		}

		return { success: true, scheduleId: firstScheduleId ?? undefined };
	} catch (error) {
		console.error("Submit schedule error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Nieznany błąd",
		};
	}
}

// ============================================================
// REPORTS
// ============================================================

export interface SubmitReportData {
	scheduleId: string;
	reasonId: string;
	type: "data_error" | "trolling";
	comment: string;
}

export async function submitReport(
	data: SubmitReportData,
	userId: string
): Promise<{ success: boolean; error?: string }> {
	const supabase = createClient();

	try {
		const { error } = await supabase.from("reports").insert({
			type: data.type,
			schedule_id: data.scheduleId,
			reporter_id: userId,
			description: data.comment || `[${data.reasonId}]`,
			status: "pending",
		});

		if (error) {
			console.error("Error submitting report:", error.message);
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch (err) {
		console.error("Error submitting report:", err);
		return { success: false, error: "Nieznany błąd" };
	}
}
