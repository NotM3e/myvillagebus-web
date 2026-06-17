"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/supabase/audit";
import type { CarrierStatus } from "@/types/database";

import CloseIcon from "@mui/icons-material/Close";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import SaveIcon from "@mui/icons-material/Save";
import SyncIcon from "@mui/icons-material/Sync";
import RouteIcon from "@mui/icons-material/Route";

interface Carrier {
	id: string;
	name: string;
	address: string | null;
	contact: string | null;
	logo_url: string | null;
	cities_served: string[] | null;
	status: CarrierStatus;
}

interface LineWithStats {
	id: string;
	number: string;
	description: string | null;
	scheduleCount: number;
}

interface CarrierDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	carrier: Carrier | null;
	onUpdate: () => void;
}

const STATUS_OPTIONS: { value: CarrierStatus; label: string; color: string }[] = [
	{ value: "unverified", label: "Społeczność", color: "var(--md-sys-color-outline)]" },
	{ value: "verified", label: "Zweryfikowany", color: "var(--md-sys-color-primary)]" },
	{ value: "partner", label: "Partner", color: "var(--md-sys-color-tertiary)]" },
];

export default function CarrierDetailsModal({
	isOpen,
	onClose,
	carrier,
	onUpdate,
}: CarrierDetailsModalProps) {
	// Form state
	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [contact, setContact] = useState("");
	const [logoUrl, setLogoUrl] = useState("");
	const [status, setStatus] = useState<CarrierStatus>("unverified");

	// Lines data
	const [lines, setLines] = useState<LineWithStats[]>([]);
	const [loadingLines, setLoadingLines] = useState(false);

	// Action state
	const [saving, setSaving] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [syncSuccess, setSyncSuccess] = useState(false);

	// Load carrier data and lines
	useEffect(() => {
		if (!isOpen || !carrier) return;

		setName(carrier.name);
		setAddress(carrier.address || "");
		setContact(carrier.contact || "");
		setLogoUrl(carrier.logo_url || "");
		setStatus(carrier.status);
		setError(null);
		setSyncSuccess(false);

		// Fetch lines with schedule counts
		const fetchLines = async () => {
			setLoadingLines(true);
			const supabase = createClient();

			const { data, error } = await supabase
				.from("lines")
				.select(
					`
					id,
					number,
					description,
					schedules:schedules(count)
				`
				)
				.eq("carrier_id", carrier.id)
				.order("number");

			if (!error && data) {
				const mapped: LineWithStats[] = data.map((line: any) => ({
					id: line.id,
					number: line.number,
					description: line.description,
					scheduleCount: line.schedules?.[0]?.count || 0,
				}));
				setLines(mapped);
			}
			setLoadingLines(false);
		};

		fetchLines();
	}, [isOpen, carrier]);

	const handleSave = async () => {
		if (!carrier) return;

		const trimmedName = name.trim();
		if (!trimmedName) {
			setError("Nazwa jest wymagana");
			return;
		}

		setSaving(true);
		setError(null);

		const supabase = createClient();

		// Check for duplicate name (if changed)
		if (trimmedName !== carrier.name) {
			const { data: existing } = await supabase
				.from("carriers")
				.select("id")
				.eq("name", trimmedName)
				.neq("id", carrier.id)
				.single();

			if (existing) {
				setError("Przewoźnik o takiej nazwie już istnieje");
				setSaving(false);
				return;
			}
		}

		const { error: updateError } = await supabase
			.from("carriers")
			.update({
				name: trimmedName,
				address: address.trim() || null,
				contact: contact.trim() || null,
				logo_url: logoUrl.trim() || null,
				status,
			})
			.eq("id", carrier.id);

		if (updateError) {
			setError("Błąd zapisu: " + updateError.message);
			setSaving(false);
			return;
		}

		await logAuditEvent({
			action: "CARRIER_VERIFY",
			targetTable: "carriers",
			targetId: carrier.id,
			payload: {
				oldName: carrier.name,
				newName: trimmedName,
				oldStatus: carrier.status,
				newStatus: status,
			},
		});

		setSaving(false);
		onUpdate();
		onClose();
	};

	const handleSyncCities = async () => {
		if (!carrier) return;

		setSyncing(true);
		setError(null);
		setSyncSuccess(false);

		const supabase = createClient();

		// Get all unique cities from stops used in this carrier's schedules
		const { data, error: queryError } = await supabase.rpc("get_carrier_cities", {
			p_carrier_id: carrier.id,
		});

		if (queryError) {
			// Fallback: manual query if RPC doesn't exist
			const { data: stopsData, error: stopsError } = await supabase
				.from("route_stops")
				.select(
					`
					stop:stops(city),
					schedule:schedules!inner(
						line:lines!inner(carrier_id)
					)
				`
				)
				.eq("schedule.line.carrier_id", carrier.id);

			if (stopsError) {
				setError("Błąd pobierania miast: " + stopsError.message);
				setSyncing(false);
				return;
			}

			// Extract unique cities
			const cities = [
				...new Set(
					stopsData
						?.map((rs: any) => {
							const stop = Array.isArray(rs.stop) ? rs.stop[0] : rs.stop;
							return stop?.city;
						})
						.filter(Boolean) || []
				),
			].sort();

			const { error: updateError } = await supabase
				.from("carriers")
				.update({ cities_served: cities })
				.eq("id", carrier.id);

			if (updateError) {
				setError("Błąd aktualizacji: " + updateError.message);
				setSyncing(false);
				return;
			}

			await logAuditEvent({
				action: "CARRIER_VERIFY",
				targetTable: "carriers",
				targetId: carrier.id,
				payload: {
					action: "sync_cities",
					citiesCount: cities.length,
					cities,
				},
			});

			setSyncSuccess(true);
			setSyncing(false);
			return;
		}

		// If RPC exists, use its result
		const cities = data || [];

		const { error: updateError } = await supabase
			.from("carriers")
			.update({ cities_served: cities })
			.eq("id", carrier.id);

		if (updateError) {
			setError("Błąd aktualizacji: " + updateError.message);
			setSyncing(false);
			return;
		}

		await logAuditEvent({
			action: "CARRIER_VERIFY",
			targetTable: "carriers",
			targetId: carrier.id,
			payload: {
				action: "sync_cities",
				citiesCount: cities.length,
				cities,
			},
		});

		setSyncSuccess(true);
		setSyncing(false);
	};

	if (!isOpen || !carrier) return null;

	const totalSchedules = lines.reduce((sum, line) => sum + line.scheduleCount, 0);

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

			{/* Modal */}
			<div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg max-h-[90vh] overflow-hidden">
				<div className="bg-(--md-sys-color-surface) rounded-3xl shadow-xl flex flex-col max-h-[90vh]">
					{/* Header */}
					<div className="flex items-center justify-between p-4 border-b border-(--md-sys-color-outline-variant)">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-(--md-sys-color-primary-container) flex items-center justify-center">
								<DirectionsBusIcon
									sx={{
										fontSize: 20,
										color: "var(--md-sys-color-on-primary-container)]",
									}}
								/>
							</div>
							<h2 className="md-title-large">Szczegóły przewoźnika</h2>
						</div>
						<button
							onClick={onClose}
							className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-(--md-sys-color-surface-variant) transition-colors"
						>
							<CloseIcon sx={{ color: "var(--md-sys-color-on-surface)]" }} />
						</button>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{/* Form */}
						<div className="space-y-4">
							<div>
								<label className="block md-body-small text-(--md-sys-color-on-surface-variant) mb-2">
									Nazwa *
								</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full px-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
								/>
							</div>

							<div>
								<label className="block md-body-small text-(--md-sys-color-on-surface-variant) mb-2">
									Adres
								</label>
								<input
									type="text"
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									placeholder="np. ul. Dworcowa 1, 86-300 Grudziądz"
									className="w-full px-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
								/>
							</div>

							<div>
								<label className="block md-body-small text-(--md-sys-color-on-surface-variant) mb-2">
									Kontakt
								</label>
								<input
									type="text"
									value={contact}
									onChange={(e) => setContact(e.target.value)}
									placeholder="np. tel. 56 123-45-67"
									className="w-full px-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
								/>
							</div>

							<div>
								<label className="block md-body-small text-(--md-sys-color-on-surface-variant) mb-2">
									URL logo
								</label>
								<input
									type="text"
									value={logoUrl}
									onChange={(e) => setLogoUrl(e.target.value)}
									placeholder="https://..."
									className="w-full px-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
								/>
							</div>

							{/* Status selector */}
							<div>
								<label className="block md-body-small text-(--md-sys-color-on-surface-variant) mb-2">
									Status
								</label>
								<div className="flex gap-2">
									{STATUS_OPTIONS.map((option) => (
										<button
											key={option.value}
											onClick={() => setStatus(option.value)}
											className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium transition-colors ${
												status === option.value
													? "text-white"
													: "bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface-variant)"
											}`}
											style={{
												backgroundColor:
													status === option.value
														? option.color
														: undefined,
											}}
										>
											{option.label}
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Sync Cities */}
						<div className="p-3 rounded-xl bg-(--md-sys-color-surface-variant)">
							<div className="flex items-center justify-between">
								<div>
									<p className="md-body-medium">Obsługiwane miejscowości</p>
									<p className="md-body-small text-(--md-sys-color-on-surface-variant)">
										{carrier.cities_served?.length || 0} miast
									</p>
								</div>
								<button
									onClick={handleSyncCities}
									disabled={syncing}
									className="md-outlined-button flex items-center gap-2 text-sm disabled:opacity-50"
								>
									{syncing ? (
										<div className="w-4 h-4 border-2 border-(--md-sys-color-primary) border-t-transparent rounded-full animate-spin" />
									) : (
										<SyncIcon sx={{ fontSize: 18 }} />
									)}
									Sync Cities
								</button>
							</div>
							{syncSuccess && (
								<p className="mt-2 md-body-small text-(--md-sys-color-primary)">
									✓ Lista miast zaktualizowana
								</p>
							)}
						</div>

						{/* Lines */}
						<div>
							<h3 className="md-title-medium mb-3">
								Linie ({lines.length}) • {totalSchedules} rozkładów
							</h3>

							{loadingLines ? (
								<div className="flex items-center justify-center py-4">
									<div className="w-6 h-6 border-2 border-(--md-sys-color-primary) border-t-transparent rounded-full animate-spin" />
								</div>
							) : lines.length === 0 ? (
								<p className="md-body-medium text-(--md-sys-color-on-surface-variant) text-center py-4">
									Brak linii
								</p>
							) : (
								<div className="space-y-2 max-h-40 overflow-y-auto">
									{lines.map((line) => (
										<div
											key={line.id}
											className="p-3 rounded-xl bg-(--md-sys-color-surface-variant) flex items-center gap-3"
										>
											<RouteIcon
												sx={{
													fontSize: 20,
													color: "var(--md-sys-color-primary)]",
												}}
											/>
											<div className="flex-1 min-w-0">
												<p className="md-body-medium truncate">
													Linia {line.number}
												</p>
												{line.description && (
													<p className="md-body-small text-(--md-sys-color-on-surface-variant) truncate">
														{line.description}
													</p>
												)}
											</div>
											<span className="md-body-small text-(--md-sys-color-on-surface-variant)">
												{line.scheduleCount} rozk.
											</span>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Error */}
						{error && (
							<div className="p-3 rounded-xl bg-(--md-sys-color-error-container)">
								<p className="md-body-medium text-(--md-sys-color-on-error-container)">
									{error}
								</p>
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="flex items-center justify-end gap-2 p-4 border-t border-(--md-sys-color-outline-variant)">
						<button onClick={onClose} className="md-text-button">
							Anuluj
						</button>
						<button
							onClick={handleSave}
							disabled={saving}
							className="md-filled-button flex items-center gap-2 disabled:opacity-50"
						>
							{saving ? (
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							) : (
								<SaveIcon sx={{ fontSize: 18 }} />
							)}
							Zapisz
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
