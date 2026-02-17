"use client";

import { useState, useEffect, useMemo } from "react";
import { db, initializeSettings } from "./index";
import { downloadLine, deleteLine, isLineDownloaded } from "./sync";
("@/types/offline");
import type {
	AppSettings,
	OfflineSchedule,
	OfflineLine,
	OfflineStop,
	OfflineRouteStop,
	SavedFilter,
	SyncMeta,
} from "@/types/offline";

// ============================================================
// HOOK: useSettings
// ============================================================

export function useSettings() {
	const [settings, setSettings] = useState<AppSettings | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		initializeSettings().then((s) => {
			setSettings(s);
			setLoading(false);
		});
	}, []);

	const updateSettings = async (updates: Partial<Omit<AppSettings, "id">>) => {
		if (!settings) return;

		const newSettings = { ...settings, ...updates };
		await db.settings.put(newSettings);
		setSettings(newSettings);
	};

	return { settings, loading, updateSettings };
}

// ============================================================
// HOOK: useDownloadedLines
// ============================================================

export function useDownloadedLines() {
	const [lines, setLines] = useState<OfflineLine[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		db.lines.toArray().then((data) => {
			setLines(data);
			setLoading(false);
		});
	}, []);

	const refresh = async () => {
		const data = await db.lines.toArray();
		setLines(data);
	};

	return { lines, loading, refresh };
}

// ============================================================
// HOOK: useSavedFilters
// ============================================================

export function useSavedFilters() {
	const [filters, setFilters] = useState<SavedFilter[]>([]);
	const [loading, setLoading] = useState(true);

	const refresh = async () => {
		const data = await db.savedFilters.toArray();
		setFilters(data);
		setLoading(false);
	};

	useEffect(() => {
		refresh();

		// Listen for filter changes
		const handleFilterChange = () => refresh();
		window.addEventListener("filters-updated", handleFilterChange);

		return () => {
			window.removeEventListener("filters-updated", handleFilterChange);
		};
	}, []);

	return { filters, loading, refresh };
}

// ============================================================
// HOOK: useLineDownload
// ============================================================

export function useLineDownload(lineId: string) {
	const [isDownloaded, setIsDownloaded] = useState(false);
	const [loading, setLoading] = useState(true);
	const [syncing, setSyncing] = useState(false);

	useEffect(() => {
		isLineDownloaded(lineId).then((result) => {
			setIsDownloaded(result);
			setLoading(false);
		});
	}, [lineId]);

	const download = async () => {
		setSyncing(true);
		const result = await downloadLine(lineId);
		if (result.success) {
			setIsDownloaded(true);
		}
		setSyncing(false);
		return result;
	};

	const remove = async () => {
		setSyncing(true);
		const result = await deleteLine(lineId);
		if (result.success) {
			setIsDownloaded(false);
		}
		setSyncing(false);
		return result;
	};

	return { isDownloaded, loading, syncing, download, remove };
}

// ============================================================
// TYPY DLA OFFLINE SCHEDULES
// ============================================================

export interface OfflineScheduleWithDetails extends OfflineSchedule {
	lineNumber: string;
	lineDescription: string | null;
	lineOperationNote: string | null;
	carrierName: string;
	carrierLogo: string | null;
	carrierVerified: boolean;
}

// ============================================================
// HOOK: useOfflineSchedules
// ============================================================

interface UseOfflineSchedulesOptions {
	searchQuery?: string;
	showPending?: boolean;
}

export function useOfflineSchedules(options: UseOfflineSchedulesOptions = {}) {
	const { searchQuery = "", showPending = false } = options;

	const [schedules, setSchedules] = useState<OfflineScheduleWithDetails[]>([]);
	const [lines, setLines] = useState<OfflineLine[]>([]);
	const [loading, setLoading] = useState(true);
	const [isEmpty, setIsEmpty] = useState(false);

	// Pobierz dane z IndexedDB
	useEffect(() => {
		async function fetchData() {
			setLoading(true);

			const linesData = await db.lines.toArray();
			setLines(linesData);

			if (linesData.length === 0) {
				setSchedules([]);
				setIsEmpty(true);
				setLoading(false);
				return;
			}

			// Pobierz rozkłady
			let schedulesData = await db.schedules.toArray();

			// Filtruj po statusie
			if (!showPending) {
				schedulesData = schedulesData.filter((s) => s.status === "active");
			} else {
				schedulesData = schedulesData.filter(
					(s) => s.status === "active" || s.status === "pending"
				);
			}

			// Połącz z danymi linii
			const schedulesWithDetails: OfflineScheduleWithDetails[] = schedulesData.map((schedule) => {
				const line = linesData.find((l) => l.id === schedule.lineId);
				return {
					...schedule,
					lineNumber: line?.number ?? "",
					lineDescription: line?.description ?? null,
					lineOperationNote: line?.operationNote ?? null,
					carrierName: line?.carrierName ?? "",
					carrierLogo: line?.carrierLogo ?? null,
					carrierVerified: line?.carrierVerified ?? false,
				};
			});

			// Sortuj po nazwie przewoźnika, potem po pierwszym odjeździe
			schedulesWithDetails.sort((a, b) => {
				const carrierCompare = a.carrierName.localeCompare(b.carrierName);
				if (carrierCompare !== 0) return carrierCompare;

				if (!a.firstDeparture) return 1;
				if (!b.firstDeparture) return -1;
				return a.firstDeparture.localeCompare(b.firstDeparture);
			});

			setSchedules(schedulesWithDetails);
			setIsEmpty(false);
			setLoading(false);
		}

		fetchData();
	}, [showPending]);

	// Filtrowanie po searchQuery (memoized)
	const filteredSchedules = useMemo(() => {
		if (!searchQuery.trim()) {
			return schedules;
		}

		const query = searchQuery.toLowerCase();
		return schedules.filter(
			(schedule) =>
				schedule.carrierName.toLowerCase().includes(query) ||
				schedule.direction.toLowerCase().includes(query) ||
				schedule.lineNumber.toLowerCase().includes(query)
		);
	}, [schedules, searchQuery]);

	const refresh = async () => {
		setLoading(true);
		const linesData = await db.lines.toArray();
		setLines(linesData);

		if (linesData.length === 0) {
			setSchedules([]);
			setIsEmpty(true);
			setLoading(false);
			return;
		}

		let schedulesData = await db.schedules.toArray();

		if (!showPending) {
			schedulesData = schedulesData.filter((s) => s.status === "active");
		}

		const schedulesWithDetails: OfflineScheduleWithDetails[] = schedulesData.map((schedule) => {
			const line = linesData.find((l) => l.id === schedule.lineId);
			return {
				...schedule,
				lineNumber: line?.number ?? "",
				lineDescription: line?.description ?? null,
				lineOperationNote: line?.operationNote ?? null,
				carrierName: line?.carrierName ?? "",
				carrierLogo: line?.carrierLogo ?? null,
				carrierVerified: line?.carrierVerified ?? false,
			};
		});

		schedulesWithDetails.sort((a, b) => {
			const carrierCompare = a.carrierName.localeCompare(b.carrierName);
			if (carrierCompare !== 0) return carrierCompare;
			if (!a.firstDeparture) return 1;
			if (!b.firstDeparture) return -1;
			return a.firstDeparture.localeCompare(b.firstDeparture);
		});

		setSchedules(schedulesWithDetails);
		setIsEmpty(false);
		setLoading(false);
	};

	return {
		schedules: filteredSchedules,
		allSchedules: schedules,
		lines,
		loading,
		isEmpty, // true = brak pobranych linii
		refresh,
	};
}

// ============================================================
// HOOK: useScheduleStops (przystanki dla rozkładu)
// ============================================================

export interface StopWithOrder {
	id: string;
	city: string;
	name: string;
	orderIndex: number;
	offsetMinutes: number;
}

export function useScheduleStops(scheduleId: string | null) {
	const [stops, setStops] = useState<StopWithOrder[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!scheduleId) {
			setStops([]);
			setLoading(false);
			return;
		}

		const id = scheduleId;

		async function fetchStops() {
			setLoading(true);

			// Pobierz route_stops dla tego schedule
			const routeStops = await db.routeStops.where("scheduleId").equals(id).toArray();

			if (routeStops.length === 0) {
				setStops([]);
				setLoading(false);
				return;
			}

			// Pobierz dane przystanków
			const stopIds = routeStops.map((rs) => rs.stopId);
			const stopsData = await db.stops.bulkGet(stopIds);

			// Połącz i posortuj
			const stopsWithOrder: StopWithOrder[] = routeStops
				.map((rs) => {
					const stop = stopsData.find((s) => s?.id === rs.stopId);
					return stop
						? {
								id: stop.id,
								city: stop.city,
								name: stop.name,
								orderIndex: rs.orderIndex,
								offsetMinutes: rs.offsetMinutes,
							}
						: null;
				})
				.filter((s): s is StopWithOrder => s !== null)
				.sort((a, b) => a.orderIndex - b.orderIndex);

			setStops(stopsWithOrder);
			setLoading(false);
		}

		fetchStops();
	}, [scheduleId]);

	return { stops, loading };
}

// ============================================================
// HOOK: useStopsAutocomplete
// ============================================================

export function useStopsAutocomplete() {
	const [allStops, setAllStops] = useState<OfflineStop[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		db.stops.toArray().then((stops) => {
			stops.sort((a, b) => {
				const cityCompare = a.city.localeCompare(b.city, "pl");
				if (cityCompare !== 0) return cityCompare;
				return a.name.localeCompare(b.name, "pl");
			});
			setAllStops(stops);
			setLoading(false);
		});
	}, []);

	return { allStops, loading };
}

// ============================================================
// FUNKCJE: Saved Filters CRUD
// ============================================================

export async function saveFilter(filter: Omit<SavedFilter, "id" | "createdAt">): Promise<number> {
	const newFilter: SavedFilter = {
		...filter,
		createdAt: new Date().toISOString(),
	};

	const id = await db.savedFilters.add(newFilter);

	// Notify listeners
	window.dispatchEvent(new Event("filters-updated"));

	return id as number;
}

export async function deleteFilter(filterId: number): Promise<void> {
	await db.savedFilters.delete(filterId);

	// Notify listeners
	window.dispatchEvent(new Event("filters-updated"));
}

export async function getFilterById(filterId: number): Promise<SavedFilter | undefined> {
	return db.savedFilters.get(filterId);
}

// ============================================================
// HOOK: useLineSyncMeta
// ============================================================

export function useLineSyncMeta(lineId: string) {
	const [syncMeta, setSyncMeta] = useState<SyncMeta | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		db.syncMeta.get(lineId).then((meta) => {
			setSyncMeta(meta ?? null);
			setLoading(false);
		});
	}, [lineId]);

	return { syncMeta, loading };
}

// ============================================================
// HOOK: useAllSyncMeta
// ============================================================

export function useAllSyncMeta() {
	const [syncMetas, setSyncMetas] = useState<SyncMeta[]>([]);
	const [loading, setLoading] = useState(true);

	const refresh = async () => {
		const metas = await db.syncMeta.toArray();
		setSyncMetas(metas);
		setLoading(false);
	};

	useEffect(() => {
		refresh();

		const handleUpdate = () => refresh();
		window.addEventListener("lines-updated", handleUpdate);

		return () => {
			window.removeEventListener("lines-updated", handleUpdate);
		};
	}, []);

	return { syncMetas, loading, refresh };
}

// ============================================================
// FUNKCJA: getSchedulesByStops
// ============================================================

export interface ScheduleStopMatch {
	scheduleId: string;
	fromArrivalTime: string | null; // godzina przyjazdu na fromStop
	toArrivalTime: string | null; // godzina przyjazdu na toStop
}

export async function getSchedulesByStops(
	fromStopId: string | null,
	toStopId: string | null
): Promise<ScheduleStopMatch[]> {
	if (!fromStopId && !toStopId) {
		return [];
	}

	// Pobierz wszystkie potrzebne dane
	const allRouteStops = await db.routeStops.toArray();
	const allCourses = await db.courses.toArray();
	const allCourseTimes = await db.courseTimes.toArray();

	// Grupuj route_stops po schedule_id
	const routeStopsBySchedule = allRouteStops.reduce(
		(acc, rs) => {
			if (!acc[rs.scheduleId]) {
				acc[rs.scheduleId] = [];
			}
			acc[rs.scheduleId].push(rs);
			return acc;
		},
		{} as Record<string, typeof allRouteStops>
	);

	// Grupuj courses po schedule_id
	const coursesBySchedule = allCourses.reduce(
		(acc, c) => {
			if (!acc[c.scheduleId]) {
				acc[c.scheduleId] = [];
			}
			acc[c.scheduleId].push(c);
			return acc;
		},
		{} as Record<string, typeof allCourses>
	);

	// Grupuj course_times po course_id
	const courseTimesByCourse = allCourseTimes.reduce(
		(acc, ct) => {
			if (!acc[ct.courseId]) {
				acc[ct.courseId] = [];
			}
			acc[ct.courseId].push(ct);
			return acc;
		},
		{} as Record<string, typeof allCourseTimes>
	);

	const matches: ScheduleStopMatch[] = [];

	for (const [scheduleId, routeStops] of Object.entries(routeStopsBySchedule)) {
		// Sortuj po orderIndex
		routeStops.sort((a, b) => a.orderIndex - b.orderIndex);

		// Znajdź fromStop i toStop
		const fromRouteStop = fromStopId ? routeStops.find((rs) => rs.stopId === fromStopId) : null;

		const toRouteStop = toStopId ? routeStops.find((rs) => rs.stopId === toStopId) : null;

		const hasFrom = fromStopId ? !!fromRouteStop : true;
		const hasTo = toStopId ? !!toRouteStop : true;

		// Sprawdź kolejność
		let isValid = false;
		if (fromStopId && toStopId) {
			isValid = hasFrom && hasTo && fromRouteStop!.orderIndex < toRouteStop!.orderIndex;
		} else if (fromStopId) {
			isValid = hasFrom;
		} else if (toStopId) {
			isValid = hasTo;
		}

		if (!isValid) continue;

		// Pobierz pierwszy kurs (1 schedule = 1 course w naszym modelu)
		const courses = coursesBySchedule[scheduleId] || [];
		const firstCourse = courses[0];

		let fromArrivalTime: string | null = null;
		let toArrivalTime: string | null = null;

		if (firstCourse) {
			if (firstCourse.useOffsets) {
				// Oblicz z offsetów
				const [hours, minutes] = firstCourse.departureTime.split(":").map(Number);

				if (fromRouteStop) {
					const totalMinutes = hours * 60 + minutes + fromRouteStop.offsetMinutes;
					const newHours = Math.floor(totalMinutes / 60) % 24;
					const newMinutes = totalMinutes % 60;
					fromArrivalTime = `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
				}

				if (toRouteStop) {
					const totalMinutes = hours * 60 + minutes + toRouteStop.offsetMinutes;
					const newHours = Math.floor(totalMinutes / 60) % 24;
					const newMinutes = totalMinutes % 60;
					toArrivalTime = `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
				}
			} else {
				// Pobierz z course_times
				const courseTimes = courseTimesByCourse[firstCourse.id] || [];

				if (fromRouteStop) {
					const ct = courseTimes.find((ct) => ct.stopId === fromStopId);
					if (ct && ct.arrivalTime) {
						fromArrivalTime = ct.arrivalTime.slice(0, 5);
					}
				}

				if (toRouteStop) {
					const ct = courseTimes.find((ct) => ct.stopId === toStopId);
					if (ct && ct.arrivalTime) {
						toArrivalTime = ct.arrivalTime.slice(0, 5);
					}
				}
			}
		}

		matches.push({
			scheduleId,
			fromArrivalTime,
			toArrivalTime,
		});
	}

	return matches;
}

// ============================================================
// HOOK: useScheduleDetails (dla strony szczegółów)
// ============================================================

export interface StopWithArrival {
	id: string;
	city: string;
	name: string;
	orderIndex: number;
	arrivalTime: string | null;
}

export interface ScheduleDetailsData {
	schedule: OfflineSchedule | null;
	line: OfflineLine | null;
	stops: StopWithArrival[];
	loading: boolean;
	error: string | null;
}

export function useScheduleDetails(scheduleId: string): ScheduleDetailsData {
	const [schedule, setSchedule] = useState<OfflineSchedule | null>(null);
	const [line, setLine] = useState<OfflineLine | null>(null);
	const [stops, setStops] = useState<StopWithArrival[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchDetails() {
			setLoading(true);
			setError(null);

			try {
				// 1. Pobierz schedule
				const scheduleData = await db.schedules.get(scheduleId);
				if (!scheduleData) {
					setError("Nie znaleziono rozkładu");
					setLoading(false);
					return;
				}
				setSchedule(scheduleData);

				// 2. Pobierz linię
				const lineData = await db.lines.get(scheduleData.lineId);
				setLine(lineData ?? null);

				// 3. Pobierz route_stops
				const routeStops = await db.routeStops.where("scheduleId").equals(scheduleId).toArray();

				routeStops.sort((a, b) => a.orderIndex - b.orderIndex);

				// 4. Pobierz course (1 schedule = 1 course)
				const courses = await db.courses.where("scheduleId").equals(scheduleId).toArray();

				const course = courses[0] ?? null;

				// 5. Pobierz dane przystanków
				const stopIds = routeStops.map((rs) => rs.stopId);
				const stopsData = await db.stops.bulkGet(stopIds);

				// 6. Jeśli use_offsets=false, pobierz course_times
				let courseTimesMap: Record<string, string | null> = {};
				if (course && !course.useOffsets) {
					const courseTimes = await db.courseTimes.where("courseId").equals(course.id).toArray();

					for (const ct of courseTimes) {
						courseTimesMap[ct.stopId] = ct.arrivalTime?.slice(0, 5) ?? null;
					}
				}

				// 7. Oblicz godziny przyjazdu
				const stopsWithArrival: StopWithArrival[] = routeStops.map((rs) => {
					const stop = stopsData.find((s) => s?.id === rs.stopId);

					let arrivalTime: string | null = null;

					if (course) {
						if (course.useOffsets) {
							// Oblicz z offsetów
							const [hours, minutes] = course.departureTime.split(":").map(Number);
							const totalMinutes = hours * 60 + minutes + rs.offsetMinutes;
							const newHours = Math.floor(totalMinutes / 60) % 24;
							const newMinutes = totalMinutes % 60;
							arrivalTime = `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
						} else {
							// Pobierz z course_times
							arrivalTime = courseTimesMap[rs.stopId] ?? null;
						}
					}

					return {
						id: stop?.id ?? rs.stopId,
						city: stop?.city ?? "Nieznany",
						name: stop?.name ?? "",
						orderIndex: rs.orderIndex,
						arrivalTime,
					};
				});

				setStops(stopsWithArrival);
				setLoading(false);
			} catch (err) {
				console.error("Error fetching schedule details:", err);
				setError("Błąd ładowania danych");
				setLoading(false);
			}
		}

		fetchDetails();
	}, [scheduleId]);

	return { schedule, line, stops, loading, error };
}
