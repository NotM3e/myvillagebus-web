"use client";

import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";

interface SaveFilterDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (name: string) => void;
	defaultName?: string;
}

export default function SaveFilterDialog({
	isOpen,
	onClose,
	onSave,
	defaultName = "",
}: SaveFilterDialogProps) {
	const [name, setName] = useState(defaultName);
	const [error, setError] = useState("");

	if (!isOpen) return null;

	const handleSave = () => {
		const trimmed = name.trim();
		if (!trimmed) {
			setError("Podaj nazwę trasy");
			return;
		}
		if (trimmed.length > 30) {
			setError("Nazwa może mieć max 30 znaków");
			return;
		}
		onSave(trimmed);
		setName("");
		setError("");
	};

	const handleClose = () => {
		setName("");
		setError("");
		onClose();
	};

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-50 bg-black/50" onClick={handleClose} />

			{/* Dialog */}
			<div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md">
				<div className="bg-[var(--md-sys-color-surface)] rounded-3xl p-6 shadow-xl">
					{/* Header */}
					<div className="flex items-center justify-between mb-4">
						<h2 className="md-title-large">Zapisz trasę</h2>
						<button
							onClick={handleClose}
							className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
						>
							<CloseIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
						</button>
					</div>

					{/* Description */}
					<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)] mb-4">
						Zapisz aktualne filtry jako skrót do szybkiego użycia.
					</p>

					{/* Input */}
					<div className="mb-4">
						<label
							htmlFor="filter-name"
							className="block md-body-small text-[var(--md-sys-color-on-surface-variant)] mb-2"
						>
							Nazwa trasy
						</label>
						<input
							id="filter-name"
							type="text"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								setError("");
							}}
							placeholder="np. Do pracy, Na uczelnię..."
							maxLength={30}
							className="w-full px-4 py-3 rounded-xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
							autoFocus
						/>
						{error && (
							<p className="mt-2 md-body-small text-[var(--md-sys-color-error)]">
								{error}
							</p>
						)}
					</div>

					{/* Actions */}
					<div className="flex gap-3 justify-end">
						<button onClick={handleClose} className="md-text-button">
							Anuluj
						</button>
						<button
							onClick={handleSave}
							className="md-filled-button flex items-center gap-2"
						>
							<SaveIcon sx={{ fontSize: 18 }} />
							Zapisz
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
