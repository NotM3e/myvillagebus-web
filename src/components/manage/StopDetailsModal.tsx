"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/supabase/audit";

import CloseIcon from "@mui/icons-material/Close";
import PlaceIcon from "@mui/icons-material/Place";
import VerifiedIcon from "@mui/icons-material/Verified";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface Stop {
	id: string;
	city: string;
	name: string;
	is_verified: boolean;
}

interface StopUsage {
	scheduleId: string;
	direction: string;
	orderIndex: number;
	lineNumber: string;
	carrierName: string;
}

interface StopDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	stop: Stop | null;
	onUpdate: () => void;
}

export default function StopDetailsModal({
	isOpen,
	onClose,
	stop,
	onUpdate,
}: StopDetailsModalProps) {
	// Form state
	const [city, setCity] = useState("");
	const [name, setName] = useState("");
	const [isVerified, setIsVerified] = useState(false);

	// Usage data
	const [usages, setUsages] = useState<StopUsage[]>([]);
	const [loadingUsages, setLoadingUsages] = useState(false);

	// Action state
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	// Load stop data and usages
	useEffect(() => {
		if (!isOpen || !stop) return;

		setCity(stop.city);
		setName(stop.name);
		setIsVerified(stop.is_verified);
		setError(null);
		setShowDeleteConfirm(false);

		// Fetch usages
		const fetchUsages = async () => {
			setLoadingUsages(true);
			const supabase = createClient();

			const { data, error } = await supabase
				.from("route_stops")
				.select(
					`
					schedule_id,
					order_index,
					schedule:schedules (
						direction,
						line:lines (
							number,
							carrier:carriers (
								name
							)
						)
					)
				`
				)
				.eq("stop_id", stop.id);

			if (!error && data) {
				const mapped: StopUsage[] = data.map((rs: any) => {
					const schedule = Array.isArray(rs.schedule) ? rs.schedule[0] : rs.schedule;
					const line = Array.isArray(schedule?.line) ? schedule.line[0] : schedule?.line;
					const carrier = Array.isArray(line?.carrier) ? line.carrier[0] : line?.carrier;

					return {
						scheduleId: rs.schedule_id,
						direction: schedule?.direction || "?",
						orderIndex: rs.order_index,
						lineNumber: line?.number || "?",
						carrierName: carrier?.name || "?",
					};
				});
				setUsages(mapped);
			}
			setLoadingUsages(false);
		};

		fetchUsages();
	}, [isOpen, stop]);

	const handleSave = async () => {
		if (!stop) return;

		const trimmedCity = city.trim();
		const trimmedName = name.trim();

		if (!trimmedCity) {
			setError("Miejscowość jest wymagana");
			return;
		}

		setSaving(true);
		setError(null);

		const supabase = createClient();

		// Check for duplicates (if city or name changed)
		if (trimmedCity !== stop.city || trimmedName !== stop.name) {
			const { data: existing } = await supabase
				.from("stops")
				.select("id")
				.eq("city", trimmedCity)
				.eq("name", trimmedName)
				.neq("id", stop.id)
				.single();

			if (existing) {
				setError("Przystanek o takiej nazwie już istnieje");
				setSaving(false);
				return;
			}
		}

		const { error: updateError } = await supabase
			.from("stops")
			.update({
				city: trimmedCity,
				name: trimmedName,
				is_verified: isVerified,
			})
			.eq("id", stop.id);

		if (updateError) {
			setError("Błąd zapisu: " + updateError.message);
			setSaving(false);
			return;
		}

		await logAuditEvent({
			action: "STOP_VERIFY",
			targetTable: "stops",
			targetId: stop.id,
			payload: {
				oldCity: stop.city,
				oldName: stop.name,
				newCity: trimmedCity,
				newName: trimmedName,
				isVerified,
			},
		});

		setSaving(false);
		onUpdate();
		onClose();
	};

	const handleDelete = async () => {
		if (!stop) return;

		setDeleting(true);
		setError(null);

		const supabase = createClient();

		// Delete from course_times first
		await supabase.from("course_times").delete().eq("stop_id", stop.id);

		// Delete from route_stops
		await supabase.from("route_stops").delete().eq("stop_id", stop.id);

		// Delete the stop
		const { error: deleteError } = await supabase.from("stops").delete().eq("id", stop.id);

		if (deleteError) {
			setError("Błąd usuwania: " + deleteError.message);
			setDeleting(false);
			return;
		}

		await logAuditEvent({
			action: "STOP_VERIFY",
			targetTable: "stops",
			targetId: stop.id,
			payload: {
				action: "delete",
				city: stop.city,
				name: stop.name,
				affectedSchedules: usages.length,
			},
		});

		setDeleting(false);
		onUpdate();
		onClose();
	};

	if (!isOpen || !stop) return null;

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
								<PlaceIcon
									sx={{
										fontSize: 20,
										color: "var(--md-sys-color-on-primary-container)]",
									}}
								/>
							</div>
							<h2 className="md-title-large">Szczegóły przystanku</h2>
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
									Miejscowość *
								</label>
								<input
									type="text"
									value={city}
									onChange={(e) => setCity(e.target.value)}
									className="w-full px-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
								/>
							</div>

							<div>
								<label className="block md-body-small text-(--md-sys-color-on-surface-variant) mb-2">
									Nazwa przystanku
								</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full px-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
								/>
							</div>

							{/* Verified toggle */}
							<button
								onClick={() => setIsVerified(!isVerified)}
								className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
									isVerified
										? "bg-(--md-sys-color-primary-container)"
										: "bg-(--md-sys-color-surface-variant)"
								}`}
							>
								<VerifiedIcon
									sx={{
										fontSize: 24,
										color: isVerified
											? "var(--md-sys-color-on-primary-container)]"
											: "var(--md-sys-color-on-surface-variant)]",
									}}
								/>
								<span
									className={`md-body-large ${
										isVerified
											? "text-(--md-sys-color-on-primary-container)"
											: "text-(--md-sys-color-on-surface)"
									}`}
								>
									Zweryfikowany
								</span>
							</button>
						</div>

						{/* Usages */}
						<div>
							<h3 className="md-title-medium mb-3">
								Użycie w rozkładach ({usages.length})
							</h3>

							{loadingUsages ? (
								<div className="flex items-center justify-center py-4">
									<div className="w-6 h-6 border-2 border-(--md-sys-color-primary) border-t-transparent rounded-full animate-spin" />
								</div>
							) : usages.length === 0 ? (
								<p className="md-body-medium text-(--md-sys-color-on-surface-variant) text-center py-4">
									Przystanek nie jest używany w żadnym rozkładzie
								</p>
							) : (
								<div className="space-y-2 max-h-48 overflow-y-auto">
									{usages.map((usage, index) => (
										<div
											key={`${usage.scheduleId}-${index}`}
											className="p-3 rounded-xl bg-(--md-sys-color-surface-variant) flex items-center gap-3"
										>
											<DirectionsBusIcon
												sx={{
													fontSize: 20,
													color: "var(--md-sys-color-primary)]",
												}}
											/>
											<div className="flex-1 min-w-0">
												<p className="md-body-medium truncate">
													{usage.carrierName} - Linia {usage.lineNumber}
												</p>
												<p className="md-body-small text-(--md-sys-color-on-surface-variant) truncate">
													{usage.direction} (pozycja {usage.orderIndex})
												</p>
											</div>
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

						{/* Delete confirmation */}
						{showDeleteConfirm && (
							<div className="p-4 rounded-xl bg-(--md-sys-color-error-container)">
								<div className="flex items-start gap-3 mb-3">
									<WarningAmberIcon
										sx={{
											fontSize: 24,
											color: "var(--md-sys-color-on-error-container)]",
										}}
									/>
									<div>
										<p className="md-body-large text-(--md-sys-color-on-error-container)">
											Czy na pewno usunąć ten przystanek?
										</p>
										{usages.length > 0 && (
											<p className="md-body-medium text-(--md-sys-color-on-error-container)">
												Zostanie usunięty z {usages.length} rozkładów!
											</p>
										)}
									</div>
								</div>
								<div className="flex gap-2 justify-end">
									<button
										onClick={() => setShowDeleteConfirm(false)}
										className="md-text-button"
									>
										Anuluj
									</button>
									<button
										onClick={handleDelete}
										disabled={deleting}
										className="md-filled-button bg-(--md-sys-color-error) flex items-center gap-2"
									>
										{deleting ? (
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
										) : (
											<DeleteOutlineIcon sx={{ fontSize: 18 }} />
										)}
										Usuń
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between p-4 border-t border-(--md-sys-color-outline-variant)">
						{!showDeleteConfirm && (
							<button
								onClick={() => setShowDeleteConfirm(true)}
								className="md-text-button text-(--md-sys-color-error) flex items-center gap-2"
							>
								<DeleteOutlineIcon sx={{ fontSize: 18 }} />
								Usuń
							</button>
						)}
						{showDeleteConfirm && <div />}

						<div className="flex gap-2">
							<button onClick={onClose} className="md-text-button">
								Anuluj
							</button>
							<button
								onClick={handleSave}
								disabled={saving || showDeleteConfirm}
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
			</div>
		</>
	);
}
