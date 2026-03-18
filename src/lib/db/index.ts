import Dexie, { type EntityTable } from "dexie";
import type {
	OfflineLine,
	OfflineSchedule,
	OfflineStop,
	OfflineRouteStop,
	OfflineCourse,
	OfflineCourseTime,
	SavedFilter,
	AppSettings,
	SyncMeta,
} from "@/types/offline";

// ============================================================
// DEFINICJA BAZY DANYCH
// ============================================================

class WsiobusDatabase extends Dexie {
	lines!: EntityTable<OfflineLine, "id">;
	schedules!: EntityTable<OfflineSchedule, "id">;
	stops!: EntityTable<OfflineStop, "id">;
	routeStops!: EntityTable<OfflineRouteStop, "id">;
	courses!: EntityTable<OfflineCourse, "id">;
	courseTimes!: EntityTable<OfflineCourseTime, "id">;
	savedFilters!: EntityTable<SavedFilter, "id">;
	settings!: EntityTable<AppSettings, "id">;
	syncMeta!: EntityTable<SyncMeta, "lineId">;

	constructor() {
		super("wsiobus");

		this.version(1).stores({
			// Pobrane linie (z denormalizowanym przewoźnikiem)
			lines: "id, carrierName",

			// Rozkłady pobranych linii
			schedules: "id, lineId, [lineId+status]",

			// Słownik przystanków (współdzielony)
			stops: "id, city, [city+name]",

			// Trasa rozkładu
			routeStops: "id, scheduleId",

			// Kursy (godziny startu)
			courses: "id, scheduleId",

			// Ręczne godziny przystanków
			courseTimes: "id, courseId",

			// Zapisane filtry (FAB)
			savedFilters: "++id, name",

			// Ustawienia (singleton id=1)
			settings: "id",

			// Metadane synchronizacji per linia
			syncMeta: "lineId",
		});

		// Migration v2: extend SyncMeta with update-checking fields
		this.version(2)
			.stores({
				lines: "id, carrierName",
				schedules: "id, lineId, [lineId+status]",
				stops: "id, city, [city+name]",
				routeStops: "id, scheduleId",
				courses: "id, scheduleId",
				courseTimes: "id, courseId",
				savedFilters: "++id, name",
				settings: "id",
				syncMeta: "lineId",
			})
			.upgrade(async (tx) => {
				// Backfill new SyncMeta fields for existing records
				await tx
					.table("syncMeta")
					.toCollection()
					.modify((meta: Record<string, unknown>) => {
						if (meta.lastCheckAt === undefined) meta.lastCheckAt = null;
						if (meta.localVersion === undefined) {
							// lastServerVersion was the old field name
							meta.localVersion = (meta.lastServerVersion as number) ?? 0;
						}
						if (meta.serverVersion === undefined) meta.serverVersion = null;
						if (meta.hasUpdate === undefined) meta.hasUpdate = false;
						delete meta.lastServerVersion;
					});
			});
	}
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const db = new WsiobusDatabase();

// ============================================================
// HELPER: Inicjalizacja domyślnych ustawień
// ============================================================

export async function initializeSettings(): Promise<AppSettings> {
	const existing = await db.settings.get(1);

	if (existing) {
		return existing;
	}

	const defaultSettings: AppSettings = {
		id: 1,
		showPending: false,
		defaultFilterId: null,
		syncOnlyWifi: true,
		syncCooldownMinutes: 60,
		autoCheckUpdates: true,
		checkCooldownMinutes: 60,
	};

	await db.settings.add(defaultSettings);
	return defaultSettings;
}

// ============================================================
// HELPER: Sprawdź czy baza jest pusta
// ============================================================

export async function isDatabaseEmpty(): Promise<boolean> {
	const lineCount = await db.lines.count();
	return lineCount === 0;
}
