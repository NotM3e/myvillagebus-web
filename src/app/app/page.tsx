"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import ActionStrip from "@/components/ActionStrip";
import StopSearch from "@/components/StopSearch";
import OfflineScheduleCard from "@/components/OfflineScheduleCard";
import SaveFilterDialog from "@/components/SaveFilterDialog";
import {
	useOfflineSchedules,
	saveFilter,
	getFilterById,
	getSchedulesByStops,
	type ScheduleStopMatch,
} from "@/lib/db/hooks";
import type { OfflineStop } from "@/types/offline";
import AddIcon from "@mui/icons-material/Add";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Link from "next/link";

const ALL_DAYS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

function AppContent() {
	const searchParams = useSearchParams();
	const filterId = searchParams.get("filterId");
	const submitted = searchParams.get("submitted");

	const [showSuccess, setShowSuccess] = useState(!!submitted);
	const [fromStop, setFromStop] = useState<OfflineStop | null>(null);
	const [toStop, setToStop] = useState<OfflineStop | null>(null);
	const [selectedDays, setSelectedDays] = useState<string[]>(ALL_DAYS);
	const [showPending, setShowPending] = useState(false);
	const [timeFilter, setTimeFilter] = useState<"all" | "now" | "custom">("all");
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [showSaveDialog, setShowSaveDialog] = useState(false);
	const [stopMatches, setStopMatches] = useState<ScheduleStopMatch[]>([]);
	const [filteringByStops, setFilteringByStops] = useState(false);

	// Load filter from URL
	useEffect(() => {
		if (!filterId) return;

		const loadFilter = async () => {
			// Reset all filters first
			setFromStop(null);
			setToStop(null);
			setSelectedDays(ALL_DAYS);
			setSelectedTime(null);
			setShowPending(false);
			setTimeFilter("all");

			// Then apply saved filter
			const filter = await getFilterById(Number(filterId));
			if (filter) {
				if (filter.fromStop) {
					setFromStop(filter.fromStop as OfflineStop);
				}
				if (filter.toStop) {
					setToStop(filter.toStop as OfflineStop);
				}
				if (filter.days && filter.days.length > 0) {
					setSelectedDays(filter.days);
				}
				if (filter.timeFrom) {
					setSelectedTime(filter.timeFrom);
					setTimeFilter("custom");
				}
				setShowPending(filter.showPending ?? false);
			}
		};

		loadFilter();
	}, [filterId]);

	// Hide success message after 5 seconds
	useEffect(() => {
		if (showSuccess) {
			const timeout = setTimeout(() => setShowSuccess(false), 5000);
			return () => clearTimeout(timeout);
		}
	}, [showSuccess]);

	const {
		schedules: allSchedules,
		loading,
		isEmpty,
	} = useOfflineSchedules({
		searchQuery: "",
		showPending,
	});

	// Filtrowanie po przystankach (async)
	useEffect(() => {
		if (!fromStop && !toStop) {
			setStopMatches([]);
			return;
		}

		setFilteringByStops(true);
		getSchedulesByStops(fromStop?.id ?? null, toStop?.id ?? null).then((matches) => {
			setStopMatches(matches);
			setFilteringByStops(false);
		});
	}, [fromStop, toStop]);

	// Filtrowanie
	const filteredSchedules = useMemo(() => {
		// Helper: pobierz czas na wybranym przystanku
		const calcDisplayTime = (scheduleId: string, firstDeparture: string | null): string | null => {
			if (!firstDeparture) return null;

			if (!fromStop) {
				return firstDeparture.slice(0, 5);
			}

			const match = stopMatches.find((m) => m.scheduleId === scheduleId);
			if (!match || !match.fromArrivalTime) {
				return firstDeparture.slice(0, 5);
			}

			return match.fromArrivalTime;
		};

		let result = allSchedules;

		// Filtr po przystankach
		if (fromStop || toStop) {
			const matchingIds = stopMatches.map((m) => m.scheduleId);
			result = result.filter((schedule) => matchingIds.includes(schedule.id));
		}

		// Filtr dni
		if (selectedDays.length < 7) {
			result = result.filter((schedule) => schedule.days.some((day) => selectedDays.includes(day)));
		}

		// Filtr czasu - używamy czasu na wybranym przystanku
		if (selectedTime) {
			result = result.filter((schedule) => {
				const time = calcDisplayTime(schedule.id, schedule.firstDeparture);
				if (!time) return false;
				return time >= selectedTime;
			});
		}

		// Sortuj po czasie na przystanku
		result.sort((a, b) => {
			const timeA = calcDisplayTime(a.id, a.firstDeparture);
			const timeB = calcDisplayTime(b.id, b.firstDeparture);
			if (!timeA) return 1;
			if (!timeB) return -1;
			return timeA.localeCompare(timeB);
		});

		return result;
	}, [allSchedules, selectedDays, selectedTime, stopMatches, fromStop, toStop]);

	// Helper dla komponentu karty
	const getDisplayTime = (scheduleId: string, firstDeparture: string | null): string | null => {
		if (!firstDeparture) return null;

		if (!fromStop) {
			return firstDeparture.slice(0, 5);
		}

		const match = stopMatches.find((m) => m.scheduleId === scheduleId);
		if (!match || !match.fromArrivalTime) {
			return firstDeparture.slice(0, 5);
		}

		return match.fromArrivalTime;
	};

	// Zapisywanie filtrów
	const canSaveFilter =
		fromStop || toStop || selectedDays.length < 7 || selectedTime || showPending;

	const handleSaveFilter = async (name: string) => {
		await saveFilter({
			name,
			fromStop: fromStop ? { id: fromStop.id, city: fromStop.city, name: fromStop.name } : null,
			toStop: toStop ? { id: toStop.id, city: toStop.city, name: toStop.name } : null,
			days: selectedDays.length < 7 ? selectedDays : null,
			timeFrom: selectedTime,
			showPending,
			carrierId: null,
		});
		setShowSaveDialog(false);
	};

	return (
		<PageWrapper maxWidth="max-w-2xl">
			{/* Stop Search */}
			<div className="mt-4">
				<StopSearch
					fromStop={fromStop}
					toStop={toStop}
					onFromChange={setFromStop}
					onToChange={setToStop}
				/>
			</div>

			{/* Success message */}
			{showSuccess && (
				<div className="mb-4 p-4 rounded-xl bg-(--md-sys-color-primary-container) flex items-center gap-3">
					<CheckCircleIcon sx={{ color: "var(--md-sys-color-on-primary-container)" }} />
					<div className="flex-1">
						<p className="md-body-medium text-(--md-sys-color-on-primary-container)">
							Rozkład został dodany! Oczekuje na weryfikację.
						</p>
					</div>
					<button onClick={() => setShowSuccess(false)} className="md-text-button text-sm">
						OK
					</button>
				</div>
			)}

			{/* Action Strip */}
			<ActionStrip
				selectedDays={selectedDays}
				onDaysChange={setSelectedDays}
				showPending={showPending}
				onShowPendingChange={setShowPending}
				timeFilter={timeFilter}
				onTimeFilterChange={setTimeFilter}
				selectedTime={selectedTime}
				onSelectedTimeChange={setSelectedTime}
			/>

			{/* Loading state */}
			{loading && (
				<div className="text-center py-12">
					<div className="w-8 h-8 border-2 border-(--md-sys-color-primary) border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="md-body-medium text-(--md-sys-color-on-surface-variant)">
						Ładowanie rozkładów...
					</p>
				</div>
			)}

			{/* Empty state - no downloaded lines */}
			{!loading && isEmpty && (
				<div className="text-center py-12">
					<div className="w-20 h-20 rounded-full bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center mx-auto mb-6">
						<CloudDownloadIcon
							sx={{ fontSize: 40, color: "var(--md-sys-color-on-surface-variant)" }}
						/>
					</div>
					<h2 className="md-title-large mb-2">Brak pobranych linii</h2>
					<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)] mb-6">
						Pobierz linie autobusowe, aby przeglądać rozkłady offline.
					</p>
					<Link href="/app/browse" className="md-filled-button inline-flex items-center gap-2">
						<CloudDownloadIcon sx={{ fontSize: 20 }} />
						Przeglądaj dostępne linie
					</Link>
				</div>
			)}

			{/* Results */}
			{!loading && !isEmpty && (
				<>
					{filteringByStops && (
						<div className="flex items-center gap-2 mb-4">
							<div className="w-4 h-4 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
							<span className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
								Filtrowanie...
							</span>
						</div>
					)}

					<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)] mb-4">
						Znaleziono: {filteredSchedules.length} rozkładów
					</p>

					<div className="mb-20">
						{filteredSchedules.map((schedule) => (
							<OfflineScheduleCard
								key={schedule.id}
								schedule={schedule}
								displayTime={getDisplayTime(schedule.id, schedule.firstDeparture)}
								fromStopId={fromStop?.id ?? null}
							/>
						))}

						{filteredSchedules.length === 0 && (
							<div className="text-center py-12">
								<p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
									Brak rozkładów dla wybranych filtrów
								</p>
							</div>
						)}
					</div>
				</>
			)}

			{/* FAB - Save filter */}
			<button
				onClick={() => setShowSaveDialog(true)}
				disabled={!canSaveFilter}
				className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
				title={canSaveFilter ? "Zapisz trasę" : "Ustaw filtry aby zapisać"}
			>
				<AddIcon sx={{ fontSize: 28 }} />
			</button>

			{/* Save Filter Dialog */}
			<SaveFilterDialog
				isOpen={showSaveDialog}
				onClose={() => setShowSaveDialog(false)}
				onSave={handleSaveFilter}
				defaultName={fromStop && toStop ? `${fromStop.city} → ${toStop.city}` : ""}
			/>
		</PageWrapper>
	);
}

// Loading fallback
function AppLoading() {
	return (
		<PageWrapper maxWidth="max-w-2xl">
			<div className="text-center py-12 mt-4">
				<div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
				<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">Ładowanie...</p>
			</div>
		</PageWrapper>
	);
}

export default function AppPage() {
	return (
		<Suspense fallback={<AppLoading />}>
			<AppContent />
		</Suspense>
	);
}
