"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useStopsAutocomplete } from "@/lib/db/hooks";
import type { OfflineStop } from "@/types/offline";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import PlaceIcon from "@mui/icons-material/Place";

interface StopSearchProps {
	fromStop: OfflineStop | null;
	toStop: OfflineStop | null;
	onFromChange: (stop: OfflineStop | null) => void;
	onToChange: (stop: OfflineStop | null) => void;
}

export default function StopSearch({
	fromStop,
	toStop,
	onFromChange,
	onToChange,
}: StopSearchProps) {
	const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const { allStops, loading } = useStopsAutocomplete();

	// Focus input when field becomes active
	useEffect(() => {
		if (activeField && inputRef.current) {
			inputRef.current.focus();
		}
	}, [activeField]);

	// Search results (memoized)
	const results = useMemo(() => {
		if (!query.trim()) return [];

		const q = query.toLowerCase();
		return allStops
			.filter(
				(stop) =>
					stop.city.toLowerCase().includes(q) ||
					stop.name.toLowerCase().includes(q) ||
					`${stop.city} ${stop.name}`.toLowerCase().includes(q)
			)
			.slice(0, 10);
	}, [query, allStops]);

	const handleFieldClick = (field: "from" | "to") => {
		setActiveField(field);
		setQuery("");
	};

	const handleStopSelect = (stop: OfflineStop) => {
		if (activeField === "from") {
			onFromChange(stop);
		} else {
			onToChange(stop);
		}
		setActiveField(null);
		setQuery("");
	};

	const handleClear = (field: "from" | "to", e: React.MouseEvent) => {
		e.stopPropagation();
		if (field === "from") {
			onFromChange(null);
		} else {
			onToChange(null);
		}
	};

	const handleSwap = () => {
		const temp = fromStop;
		onFromChange(toStop);
		onToChange(temp);
	};

	const handleClose = () => {
		setActiveField(null);
		setQuery("");
	};

	const formatStopName = (stop: OfflineStop) => {
		return stop.name ? `${stop.city}, ${stop.name}` : stop.city;
	};

	// Expanded search view
	if (activeField) {
		return (
			<div className="mb-4">
				{/* Search input */}
				<div className="relative">
					<SearchIcon
						sx={{
							position: "absolute",
							left: 12,
							top: "50%",
							transform: "translateY(-50%)",
							color: "var(--md-sys-color-on-surface-variant)]",
							fontSize: 20,
						}}
					/>
					<input
						ref={inputRef}
						type="text"
						placeholder={activeField === "from" ? "Skąd jedziesz?" : "Dokąd jedziesz?"}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="w-full pl-10 pr-12 py-3 rounded-full bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) placeholder:text-(--md-sys-color-on-surface-variant) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
					/>
					<button
						onClick={handleClose}
						className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center hover:bg-(--md-sys-color-surface) transition-colors"
					>
						<CloseIcon
							sx={{ fontSize: 20, color: "var(--md-sys-color-on-surface-variant)]" }}
						/>
					</button>
				</div>

				{/* Results */}
				{results.length > 0 && (
					<div className="mt-2 rounded-xl bg-(--md-sys-color-surface) border border-(--md-sys-color-outline-variant) overflow-hidden">
						{results.map((stop) => (
							<button
								key={stop.id}
								onClick={() => handleStopSelect(stop)}
								className="w-full flex items-center gap-3 px-4 py-3 hover:bg-(--md-sys-color-surface-variant) transition-colors text-left"
							>
								<PlaceIcon
									sx={{ fontSize: 20, color: "var(--md-sys-color-primary)]" }}
								/>
								<div>
									<p className="md-body-large">{stop.city}</p>
									{stop.name && (
										<p className="md-body-small text-(--md-sys-color-on-surface-variant)">
											{stop.name}
										</p>
									)}
								</div>
							</button>
						))}
					</div>
				)}

				{/* No results */}
				{query.trim() && results.length === 0 && !loading && (
					<div className="mt-2 p-4 rounded-xl bg-(--md-sys-color-surface-variant) text-center">
						<p className="md-body-medium text-(--md-sys-color-on-surface-variant)">
							Brak wyników dla "{query}"
						</p>
						<p className="md-body-small text-(--md-sys-color-on-surface-variant) mt-1">
							Przystanki pojawiają się po pobraniu linii
						</p>
					</div>
				)}
			</div>
		);
	}

	// Compact view with From/To fields
	return (
		<div className="mb-4 flex gap-2 items-stretch">
			{/* From/To fields */}
			<div className="flex-1 flex flex-col gap-2">
				{/* From */}
				<div
					onClick={() => handleFieldClick("from")}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => e.key === "Enter" && handleFieldClick("from")}
					className="flex items-center gap-3 px-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) cursor-pointer"
				>
					<div className="w-6 h-6 rounded-full bg-(--md-sys-color-primary) flex items-center justify-center">
						<span className="text-xs font-medium text-(--md-sys-color-on-primary)">
							A
						</span>
					</div>
					<div className="flex-1 min-w-0">
						{fromStop ? (
							<p className="md-body-large truncate">{formatStopName(fromStop)}</p>
						) : (
							<p className="md-body-large text-(--md-sys-color-on-surface-variant)">
								Skąd?
							</p>
						)}
					</div>
					{fromStop && (
						<button
							onClick={(e) => handleClear("from", e)}
							className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-(--md-sys-color-surface) transition-colors"
						>
							<CloseIcon
								sx={{
									fontSize: 18,
									color: "var(--md-sys-color-on-surface-variant)]",
								}}
							/>
						</button>
					)}
				</div>

				{/* To */}
				<div
					onClick={() => handleFieldClick("to")}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => e.key === "Enter" && handleFieldClick("to")}
					className="flex items-center gap-3 px-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) cursor-pointer"
				>
					<div className="w-6 h-6 rounded-full bg-(--md-sys-color-secondary) flex items-center justify-center">
						<span className="text-xs font-medium text-(--md-sys-color-on-secondary)">
							B
						</span>
					</div>
					<div className="flex-1 min-w-0">
						{toStop ? (
							<p className="md-body-large truncate">{formatStopName(toStop)}</p>
						) : (
							<p className="md-body-large text-(--md-sys-color-on-surface-variant)">
								Dokąd?
							</p>
						)}
					</div>
					{toStop && (
						<button
							onClick={(e) => handleClear("to", e)}
							className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-(--md-sys-color-surface) transition-colors"
						>
							<CloseIcon
								sx={{
									fontSize: 18,
									color: "var(--md-sys-color-on-surface-variant)]",
								}}
							/>
						</button>
					)}
				</div>
			</div>

			{/* Swap button */}
			<button
				onClick={handleSwap}
				disabled={!fromStop && !toStop}
				className="w-12 rounded-xl bg-(--md-sys-color-surface-variant) flex items-center justify-center hover:bg-(--md-sys-color-surface) transition-colors disabled:opacity-50"
			>
				<SwapVertIcon sx={{ color: "var(--md-sys-color-on-surface-variant)]" }} />
			</button>
		</div>
	);
}
