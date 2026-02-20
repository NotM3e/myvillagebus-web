"use client";

import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import FlagIcon from "@mui/icons-material/Flag";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export type ReportReasonType =
	| "OUTDATED"
	| "WRONG_TIME"
	| "WRONG_ROUTE"
	| "NOT_EXIST"
	| "VANDALISM"
	| "DUPLICATE"
	| "OTHER";

export interface ReportReasonOption {
	value: ReportReasonType;
	label: string;
	priority: "critical" | "high" | "standard";
}

const REPORT_REASONS: ReportReasonOption[] = [
	{ value: "OUTDATED", label: "Nieaktualny rozkład", priority: "standard" },
	{ value: "WRONG_TIME", label: "Błędna godzina", priority: "high" },
	{ value: "WRONG_ROUTE", label: "Błędna trasa", priority: "high" },
	{ value: "NOT_EXIST", label: "Przejazd nie istnieje", priority: "critical" },
	{ value: "VANDALISM", label: "Trolling / Wandalizm", priority: "critical" },
	{ value: "DUPLICATE", label: "Duplikat", priority: "standard" },
	{ value: "OTHER", label: "Inny problem", priority: "standard" },
];

interface ReportModalProps {
	isOpen: boolean;
	onClose: () => void;
	scheduleId: string;
	scheduleName?: string;
	onSubmit: (data: { reason: ReportReasonType; comment: string }) => Promise<void>;
}

export default function ReportModal({
	isOpen,
	onClose,
	scheduleId,
	scheduleName,
	onSubmit,
}: ReportModalProps) {
	const [selectedReason, setSelectedReason] = useState<ReportReasonOption | null>(null);
	const [comment, setComment] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const maxCommentLength = 150;

	const handleSubmit = async () => {
		if (!selectedReason) return;

		setSubmitting(true);
		setError(null);

		try {
			await onSubmit({
				reason: selectedReason.value,
				comment: comment.trim(),
			});
			setSubmitted(true);
		} catch (err) {
			setError("Nie udało się wysłać zgłoszenia. Spróbuj ponownie.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleClose = () => {
		// Reset state on close
		setSelectedReason(null);
		setComment("");
		setSubmitting(false);
		setSubmitted(false);
		setError(null);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-50 bg-black/50" onClick={handleClose} />

			{/* Modal */}
			<div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md max-h-[85vh] overflow-y-auto">
				<div className="bg-[var(--md-sys-color-surface)] rounded-3xl shadow-xl">
					{/* Header */}
					<div className="flex items-center justify-between p-4 border-b border-[var(--md-sys-color-outline-variant)]">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-error-container)] flex items-center justify-center">
								<FlagIcon
									sx={{
										fontSize: 20,
										color: "var(--md-sys-color-on-error-container)",
									}}
								/>
							</div>
							<h2 className="md-title-large">Zgłoś problem</h2>
						</div>
						<button
							onClick={handleClose}
							className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
						>
							<CloseIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
						</button>
					</div>

					{/* Content */}
					<div className="p-4">
						{submitted ? (
							/* Success state */
							<div className="text-center py-8">
								<div className="w-16 h-16 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center mx-auto mb-4">
									<CheckCircleIcon
										sx={{
											fontSize: 32,
											color: "var(--md-sys-color-on-primary-container)",
										}}
									/>
								</div>
								<h3 className="md-title-medium mb-2">Dziękujemy za zgłoszenie</h3>
								<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)] mb-6">
									Twoje zgłoszenie zostało wysłane i zostanie rozpatrzone przez
									moderatora.
								</p>
								<button onClick={handleClose} className="md-filled-button">
									Zamknij
								</button>
							</div>
						) : (
							<>
								{/* Schedule info */}
								{scheduleName && (
									<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)] mb-4">
										Zgłaszasz: <strong>{scheduleName}</strong>
									</p>
								)}

								{/* Reason selection */}
								<p className="md-label-large text-[var(--md-sys-color-on-surface-variant)] mb-3">
									Wybierz powód zgłoszenia
								</p>

								<div className="grid grid-cols-2 gap-2 mb-4">
									{REPORT_REASONS.map((reason) => {
										const isSelected = selectedReason?.value === reason.value;
										const isCritical = reason.priority === "critical";

										return (
											<button
												key={reason.value}
												onClick={() => setSelectedReason(reason)}
												className={`p-3 rounded-xl text-left transition-colors border-2 ${
													isSelected
														? isCritical
															? "border-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)]"
															: "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
														: "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)]"
												}`}
											>
												<span
													className={`md-body-medium ${
														isSelected
															? isCritical
																? "text-[var(--md-sys-color-on-error-container)]"
																: "text-[var(--md-sys-color-on-primary-container)]"
															: "text-[var(--md-sys-color-on-surface)]"
													}`}
												>
													{reason.label}
												</span>
											</button>
										);
									})}
								</div>

								{/* Comment field */}
								<div className="mb-4">
									<div className="flex items-center justify-between mb-2">
										<label
											htmlFor="report-comment"
											className="md-label-large text-[var(--md-sys-color-on-surface-variant)]"
										>
											Dodatkowy opis
										</label>
										<span
											className={`md-body-small ${
												comment.length > maxCommentLength
													? "text-[var(--md-sys-color-error)]"
													: "text-[var(--md-sys-color-on-surface-variant)]"
											}`}
										>
											{comment.length}/{maxCommentLength}
										</span>
									</div>
									<textarea
										id="report-comment"
										value={comment}
										onChange={(e) => setComment(e.target.value)}
										placeholder="Opisz problem szczegółowo..."
										maxLength={maxCommentLength + 10}
										rows={3}
										className="w-full px-4 py-3 rounded-xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] resize-none"
									/>
								</div>

								{/* Error message */}
								{error && (
									<div className="mb-4 p-3 rounded-xl bg-[var(--md-sys-color-error-container)]">
										<p className="md-body-medium text-[var(--md-sys-color-on-error-container)]">
											{error}
										</p>
									</div>
								)}

								{/* Actions */}
								<div className="flex gap-3 justify-end">
									<button onClick={handleClose} className="md-text-button">
										Anuluj
									</button>
									<button
										onClick={handleSubmit}
										disabled={
											!selectedReason ||
											comment.length > maxCommentLength ||
											submitting
										}
										className="md-filled-button flex items-center gap-2 disabled:opacity-50"
									>
										{submitting ? (
											<div className="w-5 h-5 border-2 border-[var(--md-sys-color-on-primary)] border-t-transparent rounded-full animate-spin" />
										) : (
											<SendIcon sx={{ fontSize: 18 }} />
										)}
										Wyślij zgłoszenie
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
