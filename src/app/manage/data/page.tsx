"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/supabase/audit";

import SearchIcon from "@mui/icons-material/Search";
import PlaceIcon from "@mui/icons-material/Place";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import VerifiedIcon from "@mui/icons-material/Verified";
import MergeIcon from "@mui/icons-material/MergeType";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StopDetailsModal from "@/components/manage/StopDetailsModal";

type TabType = "stops" | "carriers";

interface Stop {
	id: string;
	city: string;
	name: string;
	is_verified: boolean;
	created_at: string;
}

interface Carrier {
	id: string;
	name: string;
	status: "unverified" | "verified" | "partner";
	created_at: string;
}

export default function ManageDataPage() {
	const [activeTab, setActiveTab] = useState<TabType>("stops");
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);

	// Stops state
	const [stops, setStops] = useState<Stop[]>([]);
	const [selectedStops, setSelectedStops] = useState<Set<string>>(new Set());
	const [showOnlyUnverified, setShowOnlyUnverified] = useState(false);

	// Carriers state
	const [carriers, setCarriers] = useState<Carrier[]>([]);

	// Action state
	const [actionLoading, setActionLoading] = useState(false);

	const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

	const fetchStops = async () => {
		setLoading(true);
		const supabase = createClient();

		let query = supabase.from("stops").select("*").order("city").order("name");

		if (showOnlyUnverified) {
			query = query.eq("is_verified", false);
		}

		const { data, error } = await query.limit(200);

		if (!error) {
			setStops(data || []);
		}
		setLoading(false);
	};

	const fetchCarriers = async () => {
		setLoading(true);
		const supabase = createClient();

		const { data, error } = await supabase.from("carriers").select("*").order("name");

		if (!error) {
			setCarriers(data || []);
		}
		setLoading(false);
	};

	useEffect(() => {
		if (activeTab === "stops") {
			fetchStops();
		} else {
			fetchCarriers();
		}
		setSearchQuery("");
		setSelectedStops(new Set());
	}, [activeTab, showOnlyUnverified]);

	const filteredStops = stops.filter((stop) => {
		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase();
		return stop.city.toLowerCase().includes(query) || stop.name.toLowerCase().includes(query);
	});

	const filteredCarriers = carriers.filter((carrier) => {
		if (!searchQuery.trim()) return true;
		return carrier.name.toLowerCase().includes(searchQuery.toLowerCase());
	});

	const toggleStopSelection = (stopId: string) => {
		const newSelected = new Set(selectedStops);
		if (newSelected.has(stopId)) {
			newSelected.delete(stopId);
		} else {
			if (newSelected.size < 2) {
				newSelected.add(stopId);
			}
		}
		setSelectedStops(newSelected);
	};

	const handleVerifyStops = async () => {
		if (selectedStops.size === 0) return;

		setActionLoading(true);
		const supabase = createClient();
		const stopIds = Array.from(selectedStops);

		const { error } = await supabase
			.from("stops")
			.update({ is_verified: true })
			.in("id", stopIds);

		if (!error) {
			await logAuditEvent({
				action: "STOP_VERIFY",
				targetTable: "stops",
				payload: { stopIds },
			});
			fetchStops();
			setSelectedStops(new Set());
		}

		setActionLoading(false);
	};

	const handleMergeStops = async () => {
		if (selectedStops.size !== 2) return;

		const [keepId, removeId] = Array.from(selectedStops);
		const keepStop = stops.find((s) => s.id === keepId);
		const removeStop = stops.find((s) => s.id === removeId);

		if (
			!confirm(
				`Czy na pewno chcesz połączyć:\n\n"${removeStop?.city}, ${removeStop?.name}"\n→ "${keepStop?.city}, ${keepStop?.name}"?\n\nPierwszy zaznaczony zostanie zachowany.`
			)
		) {
			return;
		}

		setActionLoading(true);
		const supabase = createClient();

		// Update all route_stops to use keepId
		const { error: routeError } = await supabase
			.from("route_stops")
			.update({ stop_id: keepId })
			.eq("stop_id", removeId);

		if (routeError) {
			alert("Błąd aktualizacji route_stops: " + routeError.message);
			setActionLoading(false);
			return;
		}

		// Update all course_times to use keepId
		const { error: courseError } = await supabase
			.from("course_times")
			.update({ stop_id: keepId })
			.eq("stop_id", removeId);

		if (courseError) {
			alert("Błąd aktualizacji course_times: " + courseError.message);
			setActionLoading(false);
			return;
		}

		// Delete the removed stop
		const { error: deleteError } = await supabase.from("stops").delete().eq("id", removeId);

		if (deleteError) {
			alert("Błąd usuwania przystanku: " + deleteError.message);
			setActionLoading(false);
			return;
		}

		await logAuditEvent({
			action: "STOP_MERGE",
			targetTable: "stops",
			targetId: keepId,
			payload: { mergedStopId: removeId, keepStop, removeStop },
		});

		fetchStops();
		setSelectedStops(new Set());
		setActionLoading(false);
	};

	const handleStopModalClose = () => {
		setSelectedStop(null);
	};

	const handleStopUpdate = () => {
		fetchStops();
		setSelectedStops(new Set());
	};

	return (
		<div>
			<h1 className="md-headline-medium mb-6">Słowniki danych</h1>

			{/* Tabs */}
			<div className="flex gap-2 mb-6">
				<button
					onClick={() => setActiveTab("stops")}
					className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
						activeTab === "stops"
							? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
							: "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
					}`}
				>
					<PlaceIcon sx={{ fontSize: 20 }} />
					Przystanki
				</button>
				<button
					onClick={() => setActiveTab("carriers")}
					className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
						activeTab === "carriers"
							? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
							: "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
					}`}
				>
					<DirectionsBusIcon sx={{ fontSize: 20 }} />
					Przewoźnicy
				</button>
			</div>

			{/* Search + Filters */}
			<div className="flex flex-wrap gap-4 mb-6">
				<div className="relative flex-1 min-w-[200px]">
					<SearchIcon
						sx={{
							position: "absolute",
							left: 12,
							top: "50%",
							transform: "translateY(-50%)",
							fontSize: 20,
							color: "var(--md-sys-color-on-surface-variant)",
						}}
					/>
					<input
						type="text"
						placeholder={
							activeTab === "stops" ? "Szukaj przystanku..." : "Szukaj przewoźnika..."
						}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
					/>
				</div>

				{activeTab === "stops" && (
					<>
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={showOnlyUnverified}
								onChange={(e) => setShowOnlyUnverified(e.target.checked)}
								className="w-5 h-5 rounded"
							/>
							<span className="md-body-medium">Tylko niezweryfikowane</span>
						</label>

						{selectedStops.size > 0 && (
							<div className="flex gap-2">
								<button
									onClick={handleVerifyStops}
									disabled={actionLoading}
									className="md-filled-button flex items-center gap-2 text-sm disabled:opacity-50"
								>
									<CheckCircleIcon sx={{ fontSize: 18 }} />
									Weryfikuj ({selectedStops.size})
								</button>
								{selectedStops.size === 2 && (
									<button
										onClick={handleMergeStops}
										disabled={actionLoading}
										className="md-outlined-button flex items-center gap-2 text-sm disabled:opacity-50"
									>
										<MergeIcon sx={{ fontSize: 18 }} />
										Scal
									</button>
								)}
							</div>
						)}
					</>
				)}
			</div>

			{/* Content */}
			{loading ? (
				<div className="flex items-center justify-center h-64">
					<div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
				</div>
			) : activeTab === "stops" ? (
				/* Stops list */
				<div className="space-y-2">
					{filteredStops.length === 0 ? (
						<div className="md-card md-elevation-1 p-8 text-center">
							<p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
								Brak przystanków
							</p>
						</div>
					) : (
						filteredStops.map((stop) => {
							const isSelected = selectedStops.has(stop.id);

							return (
								<div
									key={stop.id}
									onClick={() => setSelectedStop(stop)}
									className={`md-card md-elevation-1 p-3 flex items-center gap-3 cursor-pointer transition-colors ${
										isSelected
											? "ring-2 ring-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
											: "hover:bg-[var(--md-sys-color-surface-variant)]"
									}`}
								>
									{/* Checkbox */}
									<div
										onClick={(e) => {
											e.stopPropagation();
											toggleStopSelection(stop.id);
										}}
										className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer ${
											isSelected
												? "bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)]"
												: "border-[var(--md-sys-color-outline)]"
										}`}
									>
										{isSelected && (
											<CheckCircleIcon
												sx={{ fontSize: 16, color: "white" }}
											/>
										)}
									</div>

									{/* Info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<p className="md-body-medium truncate">
												{stop.city}
												{stop.name && `, ${stop.name}`}
											</p>
											{stop.is_verified && (
												<VerifiedIcon
													sx={{
														fontSize: 16,
														color: "var(--md-sys-color-primary)",
													}}
												/>
											)}
										</div>
									</div>

									{/* Selection order */}
									{isSelected && (
										<span className="w-6 h-6 rounded-full bg-[var(--md-sys-color-primary)] text-white text-xs flex items-center justify-center">
											{Array.from(selectedStops).indexOf(stop.id) + 1}
										</span>
									)}
								</div>
							);
						})
					)}
				</div>
			) : (
				/* Carriers list */
				<div className="space-y-2">
					{filteredCarriers.length === 0 ? (
						<div className="md-card md-elevation-1 p-8 text-center">
							<p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
								Brak przewoźników
							</p>
						</div>
					) : (
						filteredCarriers.map((carrier) => (
							<div
								key={carrier.id}
								className="md-card md-elevation-1 p-4 flex items-center gap-4"
							>
								<DirectionsBusIcon
									sx={{
										fontSize: 24,
										color: "var(--md-sys-color-on-surface-variant)",
									}}
								/>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<p className="md-title-medium truncate">{carrier.name}</p>
										{carrier.status !== "unverified" && (
											<VerifiedIcon
												sx={{
													fontSize: 16,
													color: "var(--md-sys-color-primary)",
												}}
											/>
										)}
									</div>
								</div>
							</div>
						))
					)}
				</div>
			)}
			{/* Stop Details Modal */}
			<StopDetailsModal
				isOpen={!!selectedStop}
				onClose={handleStopModalClose}
				stop={selectedStop}
				onUpdate={handleStopUpdate}
			/>
		</div>
	);
}
