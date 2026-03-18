import { db } from "./index";
import { getLineFullData, checkLineVersions } from "@/lib/supabase/queries";
import type {
	OfflineLine,
	OfflineSchedule,
	OfflineStop,
	OfflineRouteStop,
	OfflineCourse,
	OfflineCourseTime,
	SyncMeta,
} from "@/types/offline";

// ============================================================
// DOWNLOAD LINE (Supabase → IndexedDB)
// ============================================================

export async function downloadLine(lineId: string): Promise<{ success: boolean; error?: string }> {
	try {
		// 1. Pobierz pełne dane z Supabase
		const data = await getLineFullData(lineId);

		if (!data) {
			return { success: false, error: "Nie znaleziono linii" };
		}

		const { line, schedules, routeStops, stops, courses, courseTimes } = data;

		// 2. Przygotuj dane do zapisu
		const offlineLine: OfflineLine = {
			id: line.id,
			number: line.number,
			description: line.description,
			operationNote: line.operation_note,
			carrierId: line.carrier.id,
			carrierName: line.carrier.name,
			carrierLogo: line.carrier.logo_url,
			carrierStatus: line.carrier.status,
		};

		const offlineSchedules: OfflineSchedule[] = schedules.map((s) => ({
			id: s.id,
			lineId: line.id,
			direction: s.direction,
			version: s.version,
			status: s.status as OfflineSchedule["status"],
			isIncomplete: s.is_incomplete,
			isVerified: s.is_verified,
			days: s.days,
			excludesHolidays: s.excludes_holidays,
			netScore: s.net_score,
			firstDeparture: s.first_departure,
			createdAt: s.created_at,
			lastModifiedAt: s.last_modified_at,
		}));

		const offlineStops: OfflineStop[] = stops.map((s) => ({
			id: s.id,
			city: s.city,
			name: s.name,
			isVerified: s.is_verified,
		}));

		const offlineRouteStops: OfflineRouteStop[] = routeStops.map((rs) => ({
			id: rs.id,
			scheduleId: rs.schedule_id,
			stopId: rs.stop_id,
			orderIndex: rs.order_index,
			offsetMinutes: rs.offset_minutes,
		}));

		const offlineCourses: OfflineCourse[] = courses.map((c) => ({
			id: c.id,
			scheduleId: c.schedule_id,
			departureTime: c.departure_time,
			useOffsets: c.use_offsets,
		}));

		const offlineCourseTimes: OfflineCourseTime[] = courseTimes.map((ct) => ({
			id: ct.id,
			courseId: ct.course_id,
			stopId: ct.stop_id,
			arrivalTime: ct.arrival_time,
			orderIndex: ct.order_index,
		}));

		const syncMeta: SyncMeta = {
			lineId: line.id,
			lastSyncAt: new Date().toISOString(),
			lastCheckAt: new Date().toISOString(),
			localVersion: Math.max(...schedules.map((s) => s.version), 0),
			serverVersion: null,
			hasUpdate: false,
		};

		// 3. Zapisz w transakcji (atomowo)
		await db.transaction(
			"rw",
			[
				db.lines,
				db.schedules,
				db.stops,
				db.routeStops,
				db.courses,
				db.courseTimes,
				db.syncMeta,
			],
			async () => {
				// Usuń stare dane tej linii (jeśli istnieją)
				await deleteLineData(lineId);

				// Zapisz nowe dane
				await db.lines.put(offlineLine);

				if (offlineSchedules.length > 0) {
					await db.schedules.bulkPut(offlineSchedules);
				}

				// Stops: używamy put aby nie duplikować (mogą być współdzielone)
				if (offlineStops.length > 0) {
					await db.stops.bulkPut(offlineStops);
				}

				if (offlineRouteStops.length > 0) {
					await db.routeStops.bulkPut(offlineRouteStops);
				}

				if (offlineCourses.length > 0) {
					await db.courses.bulkPut(offlineCourses);
				}

				if (offlineCourseTimes.length > 0) {
					await db.courseTimes.bulkPut(offlineCourseTimes);
				}

				await db.syncMeta.put(syncMeta);
			}
		);

		return { success: true };
	} catch (error) {
		console.error("Error downloading line:", error);
		return { success: false, error: "Błąd pobierania danych" };
	}
}

// ============================================================
// DELETE LINE (usuń z IndexedDB)
// ============================================================

async function deleteLineData(lineId: string): Promise<void> {
	// Znajdź schedules tej linii
	const schedules = await db.schedules.where("lineId").equals(lineId).toArray();
	const scheduleIds = schedules.map((s) => s.id);

	if (scheduleIds.length > 0) {
		// Znajdź courses tych schedules
		const courses = await db.courses.where("scheduleId").anyOf(scheduleIds).toArray();
		const courseIds = courses.map((c) => c.id);

		// Usuń course_times
		if (courseIds.length > 0) {
			await db.courseTimes.where("courseId").anyOf(courseIds).delete();
		}

		// Usuń courses
		await db.courses.where("scheduleId").anyOf(scheduleIds).delete();

		// Usuń route_stops
		await db.routeStops.where("scheduleId").anyOf(scheduleIds).delete();

		// Usuń schedules
		await db.schedules.where("lineId").equals(lineId).delete();
	}

	// Usuń linię
	await db.lines.delete(lineId);

	// Usuń syncMeta
	await db.syncMeta.delete(lineId);

	// UWAGA: Nie usuwamy stops - mogą być używane przez inne linie
}

export async function deleteLine(lineId: string): Promise<{ success: boolean }> {
	try {
		await db.transaction(
			"rw",
			[db.lines, db.schedules, db.routeStops, db.courses, db.courseTimes, db.syncMeta],
			async () => {
				await deleteLineData(lineId);
			}
		);
		return { success: true };
	} catch (error) {
		console.error("Error deleting line:", error);
		return { success: false };
	}
}

// ============================================================
// HELPERS
// ============================================================

export async function isLineDownloaded(lineId: string): Promise<boolean> {
	const line = await db.lines.get(lineId);
	return !!line;
}

export async function getLineSyncMeta(lineId: string): Promise<SyncMeta | undefined> {
	return db.syncMeta.get(lineId);
}

export async function getDownloadedLinesCount(): Promise<number> {
	return db.lines.count();
}

// ============================================================
// UPDATE CHECKING
// ============================================================

/**
 * Checks if newer schedule versions are available for all downloaded lines.
 * Respects a cooldown to avoid excessive network requests.
 */
export async function checkForUpdates(
	cooldownMinutes: number = 60
): Promise<{ checked: boolean; updatesAvailable: number }> {
	const allMeta = await db.syncMeta.toArray();

	if (allMeta.length === 0) {
		return { checked: false, updatesAvailable: 0 };
	}

	// Respect cooldown - find the most recent check timestamp
	const lastCheck = allMeta
		.map((m) => m.lastCheckAt)
		.filter(Boolean)
		.sort()
		.pop();

	if (lastCheck && cooldownMinutes > 0) {
		const diffMinutes = (Date.now() - new Date(lastCheck).getTime()) / 60000;
		if (diffMinutes < cooldownMinutes) {
			const updatesAvailable = allMeta.filter((m) => m.hasUpdate).length;
			return { checked: false, updatesAvailable };
		}
	}

	// Fetch latest versions from server
	const lineIds = allMeta.map((m) => m.lineId);
	const serverVersions = await checkLineVersions(lineIds);

	// Compare and update syncMeta records
	const now = new Date().toISOString();
	let updatesAvailable = 0;

	await db.transaction("rw", db.syncMeta, async () => {
		for (const meta of allMeta) {
			const serverVersion = serverVersions[meta.lineId] ?? 0;
			const hasUpdate = serverVersion > meta.localVersion;

			if (hasUpdate) updatesAvailable++;

			await db.syncMeta.update(meta.lineId, {
				lastCheckAt: now,
				serverVersion,
				hasUpdate,
			});
		}
	});

	return { checked: true, updatesAvailable };
}

/**
 * Forces an immediate update check regardless of cooldown.
 */
export async function forceCheckForUpdates(): Promise<{ updatesAvailable: number }> {
	const result = await checkForUpdates(0);
	return { updatesAvailable: result.updatesAvailable };
}

/**
 * Returns the timestamp of the last update check and the number of pending updates.
 */
export async function getLastCheckInfo(): Promise<{
	lastCheckAt: string | null;
	updatesAvailable: number;
}> {
	const allMeta = await db.syncMeta.toArray();

	const lastCheckAt =
		allMeta
			.map((m) => m.lastCheckAt)
			.filter(Boolean)
			.sort()
			.pop() ?? null;

	const updatesAvailable = allMeta.filter((m) => m.hasUpdate).length;

	return { lastCheckAt, updatesAvailable };
}
