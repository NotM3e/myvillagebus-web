"use client";

import { useState, useEffect, useMemo } from "react";
import { getLinesByCarrier, searchStops } from "@/lib/supabase/queries";
import type { CreatorData } from "./ScheduleCreator";
import CopyFromScheduleModal from "./CopyFromScheduleModal";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import PlaceIcon from "@mui/icons-material/Place";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface StepLineProps {
	data: CreatorData;
	updateData: (updates: Partial<CreatorData>) => void;
}

interface LineOption {
	id: string;
	number: string;
	description: string | null;
}

interface StopOption {
	id: string;
	city: string;
	name: string;
	is_verified: boolean;
}

export default function StepLine({ data, updateData }: StepLineProps) {
	// Line selection
	const [lines, setLines] = useState<LineOption[]>([]);
	const [loadingLines, setLoadingLines] = useState(true);
	const [showNewLineForm, setShowNewLineForm] = useState(false);
	const [newLineNumber, setNewLineNumber] = useState("");
	const [newLineDescription, setNewLineDescription] = useState("");

	// Stop search
	const [stopQuery, setStopQuery] = useState("");
	const [stopResults, setStopResults] = useState<StopOption[]>([]);
	const [searchingStops, setSearchingStops] = useState(false);
	const [showNewStopForm, setShowNewStopForm] = useState(false);
	const [newStopCity, setNewStopCity] = useState("");
	const [newStopName, setNewStopName] = useState("");

	// Copy modal
	const [showCopyModal, setShowCopyModal] = useState(false);

	// Load lines for carrier
	useEffect(() => {
		if (data.carrier?.id) {
			setLoadingLines(true);
			getLinesByCarrier(data.carrier.id).then((result) => {
				setLines(result);
				setLoadingLines(false);
			});
		} else {
			setLines([]);
			setLoadingLines(false);
		}
	}, [data.carrier?.id]);

	// Search stops
	useEffect(() => {
		if (stopQuery.trim().length < 2) {
			setStopResults([]);
			return;
		}

		setSearchingStops(true);
		const timeout = setTimeout(() => {
			searchStops(stopQuery).then((results) => {
				const addedIds = data.stops.map((s) => s.id);
				setStopResults(results.filter((r) => !addedIds.includes(r.id)));
				setSearchingStops(false);
			});
		}, 300);

		return () => clearTimeout(timeout);
	}, [stopQuery, data.stops]);

	// Auto-generate direction from stops
	useEffect(() => {
		if (data.stops.length >= 2) {
			const first = data.stops[0];
			const last = data.stops[data.stops.length - 1];
			const direction = `${first.city} → ${last.city}`;
			if (data.direction !== direction) {
				updateData({ direction });
			}
		}
	}, [data.stops, data.direction, updateData]);

	const handleSelectLine = (line: LineOption) => {
		updateData({
			line: {
				id: line.id,
				number: line.number,
				description: line.description ?? "",
				isNew: false,
			},
		});
	};

	const handleNewLine = () => {
		if (!newLineNumber.trim()) return;

		updateData({
			line: {
				id: null,
				number: newLineNumber.trim(),
				description: newLineDescription.trim(),
				isNew: true,
			},
		});
		setShowNewLineForm(false);
		setNewLineNumber("");
		setNewLineDescription("");
	};

	const handleClearLine = () => {
		updateData({ line: null });
	};

	const handleAddStop = (stop: StopOption) => {
		updateData({
			stops: [
				...data.stops,
				{
					id: stop.id,
					city: stop.city,
					name: stop.name,
					isNew: false,
				},
			],
		});
		setStopQuery("");
		setStopResults([]);
	};

	const handleNewStop = () => {
		if (!newStopCity.trim()) return;

		updateData({
			stops: [
				...data.stops,
				{
					id: null,
					city: newStopCity.trim(),
					name: newStopName.trim(),
					isNew: true,
				},
			],
		});
		setShowNewStopForm(false);
		setNewStopCity("");
		setNewStopName("");
	};

	const handleRemoveStop = (index: number) => {
		const newStops = [...data.stops];
		newStops.splice(index, 1);
		updateData({ stops: newStops });
	};

	const handleMoveStop = (index: number, direction: "up" | "down") => {
		const newStops = [...data.stops];
		const newIndex = direction === "up" ? index - 1 : index + 1;

		if (newIndex < 0 || newIndex >= newStops.length) return;

		[newStops[index], newStops[newIndex]] = [newStops[newIndex], newStops[index]];
		updateData({ stops: newStops });
	};

	const handleReverseStops = () => {
		updateData({ stops: [...data.stops].reverse() });
	};

	// Handle copied stops from modal
	const handleCopyStops = (stops: CreatorData["stops"], direction: string) => {
		if (data.stops.length > 0) {
			if (!confirm(`Masz już ${data.stops.length} przystanków. Nadpisać?`)) return;
		}
		updateData({ stops, direction });
	};

	return (
		<div className="space-y-8">
			{/* Section 1: Line */}
			<div>
				<h2 className="md-title-large mb-4">Linia</h2>

				{/* Selected line */}
				{data.line ? (
					<div className="md-card md-elevation-1 p-4 flex items-center gap-4">
						<div className="w-12 h-12 rounded-full bg-(--md-sys-color-primary-container) flex items-center justify-center">
							<DirectionsBusIcon
								sx={{
									fontSize: 24,
									color: "var(--md-sys-color-on-primary-container)]",
								}}
							/>
						</div>

						<div className="flex-1">
							<div className="flex items-center gap-2">
								<p className="md-title-medium">Linia {data.line.number}</p>
								{data.line.isNew && (
									<span className="px-2 py-0.5 text-xs rounded-full bg-(--md-sys-color-tertiary-container) text-(--md-sys-color-on-tertiary-container)">
										Nowa
									</span>
								)}
							</div>
							{data.line.description && (
								<p className="md-body-small text-(--md-sys-color-on-surface-variant)">
									{data.line.description}
								</p>
							)}
						</div>

						<CheckCircleIcon
							sx={{ fontSize: 24, color: "var(--md-sys-color-primary)]" }}
						/>
					</div>
				) : showNewLineForm ? (
					<div className="md-card md-elevation-1 p-4 space-y-4">
						<div>
							<label className="block md-body-small text-(--md-sys-color-on-surface-variant) mb-2">
								Numer linii *
							</label>
							<input
								type="text"
								value={newLineNumber}
								onChange={(e) => setNewLineNumber(e.target.value)}
								placeholder="np. 101"
								className="w-full px-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
								autoFocus
							/>
						</div>

						<div>
							<label className="block md-body-small text-(--md-sys-color-on-surface-variant) mb-2">
								Opis trasy (opcjonalnie)
							</label>
							<input
								type="text"
								value={newLineDescription}
								onChange={(e) => setNewLineDescription(e.target.value)}
								placeholder="np. Nowe - Grudziądz"
								className="w-full px-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
							/>
						</div>

						<div className="flex gap-3">
							<button
								onClick={() => setShowNewLineForm(false)}
								className="md-outlined-button"
							>
								Anuluj
							</button>
							<button
								onClick={handleNewLine}
								disabled={!newLineNumber.trim()}
								className="md-filled-button disabled:opacity-50"
							>
								Dodaj linię
							</button>
						</div>
					</div>
				) : (
					<div className="space-y-3">
						{loadingLines ? (
							<div className="text-center py-4">
								<div className="w-6 h-6 border-2 border-(--md-sys-color-primary) border-t-transparent rounded-full animate-spin mx-auto" />
							</div>
						) : lines.length > 0 ? (
							<div className="space-y-2 max-h-48 overflow-y-auto">
								{lines.map((line) => (
									<button
										key={line.id}
										onClick={() => handleSelectLine(line)}
										className="w-full md-card md-elevation-1 p-3 flex items-center gap-3 hover:bg-(--md-sys-color-surface-variant) transition-colors text-left"
									>
										<DirectionsBusIcon
											sx={{
												fontSize: 20,
												color: "var(--md-sys-color-primary)]",
											}}
										/>
										<div>
											<p className="md-body-large">Linia {line.number}</p>
											{line.description && (
												<p className="md-body-small text-(--md-sys-color-on-surface-variant)">
													{line.description}
												</p>
											)}
										</div>
									</button>
								))}
							</div>
						) : (
							<p className="md-body-medium text-(--md-sys-color-on-surface-variant) text-center py-4">
								{data.carrier?.isNew
									? "Nowy przewoźnik - utwórz pierwszą linię"
									: "Brak linii dla tego przewoźnika"}
							</p>
						)}

						<button
							onClick={() => setShowNewLineForm(true)}
							className="w-full p-3 rounded-xl border-2 border-dashed border-(--md-sys-color-outline) flex items-center justify-center gap-2 text-(--md-sys-color-primary) hover:bg-(--md-sys-color-surface-variant) transition-colors"
						>
							<AddIcon sx={{ fontSize: 20 }} />
							<span className="md-label-large">Utwórz nową linię</span>
						</button>
					</div>
				)}

				{data.line && (
					<button
						onClick={handleClearLine}
						className="mt-3 md-text-button text-(--md-sys-color-error)"
					>
						Zmień linię
					</button>
				)}
			</div>

			{/* Section 2: Stops */}
			<div>
				{/* NEW: Header with copy and reverse buttons */}
				<div className="flex items-center justify-between mb-4">
					<h2 className="md-title-large">Przystanki na trasie</h2>
					<div className="flex items-center gap-2">
						{data.carrier?.id && (
							<button
								onClick={() => setShowCopyModal(true)}
								className="md-text-button flex items-center gap-1 text-sm"
							>
								<ContentCopyIcon sx={{ fontSize: 16 }} />
								<span className="hidden sm:inline">Kopiuj z kursu</span>
								<span className="sm:hidden">Kopiuj</span>
							</button>
						)}
						{data.stops.length >= 2 && (
							<button
								onClick={handleReverseStops}
								className="md-text-button flex items-center gap-1"
								title="Odwróć kolejność"
							>
								<SwapVertIcon sx={{ fontSize: 18 }} />
								<span className="hidden sm:inline">Odwróć</span>
							</button>
						)}
					</div>
				</div>

				{/* Added stops */}
				{data.stops.length > 0 && (
					<div className="space-y-2 mb-4">
						{data.stops.map((stop, index) => (
							<div
								key={`${stop.id ?? "new"}-${index}`}
								className="md-card md-elevation-1 p-3 flex items-center gap-3"
							>
								<div className="w-8 h-8 rounded-full bg-(--md-sys-color-secondary-container) flex items-center justify-center">
									<span className="md-label-medium text-(--md-sys-color-on-secondary-container)">
										{index + 1}
									</span>
								</div>

								<div className="flex-1 min-w-0">
									<p className="md-body-medium truncate">
										{stop.city}
										{stop.name && `, ${stop.name}`}
									</p>
									{stop.isNew && (
										<span className="text-xs text-(--md-sys-color-tertiary)">
											Nowy przystanek
										</span>
									)}
								</div>

								<div className="flex gap-1">
									<button
										onClick={() => handleMoveStop(index, "up")}
										disabled={index === 0}
										className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-(--md-sys-color-surface-variant) disabled:opacity-30"
									>
										<KeyboardArrowUpIcon sx={{ fontSize: 20 }} />
									</button>
									<button
										onClick={() => handleMoveStop(index, "down")}
										disabled={index === data.stops.length - 1}
										className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-(--md-sys-color-surface-variant) disabled:opacity-30"
									>
										<KeyboardArrowDownIcon sx={{ fontSize: 20 }} />
									</button>
								</div>

								<button
									onClick={() => handleRemoveStop(index)}
									className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-(--md-sys-color-error-container) text-(--md-sys-color-error)"
								>
									<DeleteIcon sx={{ fontSize: 18 }} />
								</button>
							</div>
						))}
					</div>
				)}

				{/* Search stops */}
				{!showNewStopForm && (
					<div className="relative">
						<SearchIcon
							sx={{
								position: "absolute",
								left: 12,
								top: 14,
								color: "var(--md-sys-color-on-surface-variant)]",
								fontSize: 20,
							}}
						/>
						<input
							type="text"
							placeholder="Szukaj przystanku..."
							value={stopQuery}
							onChange={(e) => setStopQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
						/>

						{stopResults.length > 0 && (
							<div className="absolute z-10 left-0 right-0 mt-2 rounded-xl bg-(--md-sys-color-surface) border border-(--md-sys-color-outline-variant) shadow-lg overflow-hidden">
								{stopResults.map((stop) => (
									<button
										key={stop.id}
										onClick={() => handleAddStop(stop)}
										className="w-full flex items-center gap-3 px-4 py-3 hover:bg-(--md-sys-color-surface-variant) transition-colors text-left"
									>
										<PlaceIcon
											sx={{
												fontSize: 20,
												color: "var(--md-sys-color-primary)]",
											}}
										/>
										<div>
											<p className="md-body-medium">{stop.city}</p>
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

						{searchingStops && (
							<div className="absolute right-3 top-3">
								<div className="w-5 h-5 border-2 border-(--md-sys-color-primary) border-t-transparent rounded-full animate-spin" />
							</div>
						)}
					</div>
				)}

				{/* Add new stop */}
				{showNewStopForm ? (
					<div className="mt-4 md-card md-elevation-1 p-4 space-y-4">
						<div>
							<label className="block md-body-small text-(--md-sys-color-on-surface-variant) mb-2">
								Miejscowość *
							</label>
							<input
								type="text"
								value={newStopCity}
								onChange={(e) => setNewStopCity(e.target.value)}
								placeholder="np. Grudziądz"
								className="w-full px-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
								autoFocus
							/>
						</div>

						<div>
							<label className="block md-body-small text-(--md-sys-color-on-surface-variant) mb-2">
								Nazwa przystanku (opcjonalnie)
							</label>
							<input
								type="text"
								value={newStopName}
								onChange={(e) => setNewStopName(e.target.value)}
								placeholder="np. Dworzec PKS"
								className="w-full px-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
							/>
						</div>

						<div className="flex gap-3">
							<button
								onClick={() => setShowNewStopForm(false)}
								className="md-outlined-button"
							>
								Anuluj
							</button>
							<button
								onClick={handleNewStop}
								disabled={!newStopCity.trim()}
								className="md-filled-button disabled:opacity-50"
							>
								Dodaj przystanek
							</button>
						</div>
					</div>
				) : (
					<button
						onClick={() => setShowNewStopForm(true)}
						className="w-full mt-3 p-3 rounded-xl border-2 border-dashed border-(--md-sys-color-outline) flex items-center justify-center gap-2 text-(--md-sys-color-primary) hover:bg-(--md-sys-color-surface-variant) transition-colors"
					>
						<AddIcon sx={{ fontSize: 20 }} />
						<span className="md-label-large">Dodaj nowy przystanek</span>
					</button>
				)}

				{/* Direction preview */}
				{data.stops.length >= 2 && (
					<div className="mt-4 p-3 rounded-xl bg-(--md-sys-color-primary-container)">
						<p className="md-body-small text-(--md-sys-color-on-primary-container)">
							Kierunek: <strong>{data.direction}</strong>
						</p>
					</div>
				)}

				{data.stops.length < 2 && (
					<p className="mt-4 md-body-small text-(--md-sys-color-on-surface-variant) text-center">
						Dodaj co najmniej 2 przystanki, aby kontynuować
					</p>
				)}
			</div>

			{/* Copy modal */}
			<CopyFromScheduleModal
				isOpen={showCopyModal}
				onClose={() => setShowCopyModal(false)}
				carrierId={data.carrier?.id || ""}
				lineId={data.line?.id || null}
				mode="stops"
				onCopyStops={handleCopyStops}
				onCopyTimes={() => {}}
			/>
		</div>
	);
}
