"use client";

import { useState, useEffect, useMemo } from "react";
import { getCarriers } from "@/lib/supabase/queries";
import type { Carrier } from "@/types/database";
import type { CreatorData } from "./ScheduleCreator";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface StepCarrierProps {
	data: CreatorData;
	updateData: (updates: Partial<CreatorData>) => void;
}

export default function StepCarrier({ data, updateData }: StepCarrierProps) {
	const [carriers, setCarriers] = useState<Carrier[]>([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");
	const [showNewForm, setShowNewForm] = useState(false);
	const [newCarrierName, setNewCarrierName] = useState("");

	useEffect(() => {
		getCarriers().then((data) => {
			setCarriers(data);
			setLoading(false);
		});
	}, []);

	const filteredCarriers = useMemo(() => {
		if (!query.trim()) return carriers;
		const q = query.toLowerCase();
		return carriers.filter((c) => c.name.toLowerCase().includes(q));
	}, [carriers, query]);

	const handleSelectCarrier = (carrier: Carrier) => {
		updateData({
			carrier: {
				id: carrier.id,
				name: carrier.name,
				isNew: false,
			},
			// Reset line when carrier changes
			line: null,
		});
		setQuery("");
	};

	const handleNewCarrier = () => {
		if (!newCarrierName.trim()) return;

		updateData({
			carrier: {
				id: null,
				name: newCarrierName.trim(),
				isNew: true,
			},
			line: null,
		});
		setShowNewForm(false);
		setNewCarrierName("");
	};

	const handleClear = () => {
		updateData({ carrier: null, line: null });
	};

	// Selected carrier view
	if (data.carrier) {
		return (
			<div>
				<h2 className="md-title-large mb-4">Przewoźnik</h2>

				<div className="md-card md-elevation-1 p-4 flex items-center gap-4">
					<div className="w-12 h-12 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
						<BusinessIcon
							sx={{ fontSize: 24, color: "var(--md-sys-color-on-primary-container)" }}
						/>
					</div>

					<div className="flex-1">
						<div className="flex items-center gap-2">
							<p className="md-title-medium">{data.carrier.name}</p>
							{data.carrier.isNew && (
								<span className="px-2 py-0.5 text-xs rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]">
									Nowy
								</span>
							)}
						</div>
						<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
							{data.carrier.isNew ? "Zostanie utworzony przy zapisie" : "Wybrany przewoźnik"}
						</p>
					</div>

					<CheckCircleIcon sx={{ fontSize: 24, color: "var(--md-sys-color-primary)" }} />
				</div>

				<button
					onClick={handleClear}
					className="mt-4 md-text-button text-[var(--md-sys-color-error)]"
				>
					Zmień przewoźnika
				</button>
			</div>
		);
	}

	// New carrier form
	if (showNewForm) {
		return (
			<div>
				<h2 className="md-title-large mb-4">Nowy przewoźnik</h2>

				<div className="space-y-4">
					<div>
						<label className="block md-body-small text-[var(--md-sys-color-on-surface-variant)] mb-2">
							Nazwa przewoźnika
						</label>
						<input
							type="text"
							value={newCarrierName}
							onChange={(e) => setNewCarrierName(e.target.value)}
							placeholder="np. PKS Grudziądz"
							className="w-full px-4 py-3 rounded-xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
							autoFocus
						/>
					</div>

					<div className="flex gap-3">
						<button onClick={() => setShowNewForm(false)} className="md-outlined-button">
							Anuluj
						</button>
						<button
							onClick={handleNewCarrier}
							disabled={!newCarrierName.trim()}
							className="md-filled-button disabled:opacity-50"
						>
							Dodaj przewoźnika
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Search and select view
	return (
		<div>
			<h2 className="md-title-large mb-4">Wybierz przewoźnika</h2>

			{/* Search */}
			<div className="relative mb-4">
				<SearchIcon
					sx={{
						position: "absolute",
						left: 12,
						top: "50%",
						transform: "translateY(-50%)",
						color: "var(--md-sys-color-on-surface-variant)",
						fontSize: 20,
					}}
				/>
				<input
					type="text"
					placeholder="Szukaj przewoźnika..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="w-full pl-10 pr-4 py-3 rounded-full bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
				/>
			</div>

			{/* Loading */}
			{loading && (
				<div className="text-center py-8">
					<div className="w-6 h-6 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
				</div>
			)}

			{/* Carriers list */}
			{!loading && (
				<div className="space-y-2 max-h-64 overflow-y-auto">
					{filteredCarriers.map((carrier) => (
						<button
							key={carrier.id}
							onClick={() => handleSelectCarrier(carrier)}
							className="w-full md-card md-elevation-1 p-4 flex items-center gap-4 hover:bg-[var(--md-sys-color-surface-variant)] transition-colors text-left"
						>
							<div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-secondary-container)] flex items-center justify-center">
								<BusinessIcon
									sx={{ fontSize: 20, color: "var(--md-sys-color-on-secondary-container)" }}
								/>
							</div>

							<div className="flex-1">
								<div className="flex items-center gap-2">
									<p className="md-body-large">{carrier.name}</p>
									{carrier.is_verified && (
										<VerifiedIcon sx={{ fontSize: 16, color: "var(--md-sys-color-primary)" }} />
									)}
								</div>
							</div>
						</button>
					))}

					{filteredCarriers.length === 0 && query && (
						<div className="text-center py-8">
							<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)] mb-4">
								Brak wyników dla "{query}"
							</p>
						</div>
					)}
				</div>
			)}

			{/* Add new carrier button */}
			<button
				onClick={() => setShowNewForm(true)}
				className="w-full mt-4 p-4 rounded-xl border-2 border-dashed border-[var(--md-sys-color-outline)] flex items-center justify-center gap-2 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
			>
				<AddIcon sx={{ fontSize: 20 }} />
				<span className="md-label-large">Dodaj nowego przewoźnika</span>
			</button>
		</div>
	);
}
