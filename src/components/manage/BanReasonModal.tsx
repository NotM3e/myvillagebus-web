"use client";

import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import BlockIcon from "@mui/icons-material/Block";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

interface BanReasonModalProps {
	isOpen: boolean;
	onClose: () => void;
	action: "shadow_banned" | "banned";
	userName: string;
	onConfirm: (reason: string) => void;
	loading: boolean;
}

export default function BanReasonModal({
	isOpen,
	onClose,
	action,
	userName,
	onConfirm,
	loading,
}: BanReasonModalProps) {
	const [reason, setReason] = useState("");

	const isShadowBan = action === "shadow_banned";
	const title = isShadowBan ? "Shadow Ban" : "Ban użytkownika";
	const description = isShadowBan
		? "Użytkownik będzie widział swoje dane, ale nie będą widoczne dla innych."
		: "Użytkownik straci możliwość logowania i wszelkich interakcji.";

	const handleConfirm = () => {
		onConfirm(reason.trim());
		setReason("");
	};

	const handleClose = () => {
		setReason("");
		onClose();
	};

	if (!isOpen) return null;

	return (
		<>
			<div className="fixed inset-0 z-50 bg-black/50" onClick={handleClose} />

			<div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md">
				<div className="bg-(--md-sys-color-surface) rounded-3xl shadow-xl p-6">
					{/* Header */}
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							<div
								className="w-10 h-10 rounded-full flex items-center justify-center"
								style={{
									backgroundColor: isShadowBan
										? "var(--md-sys-color-tertiary-container)]"
										: "var(--md-sys-color-error-container)]",
								}}
							>
								{isShadowBan ? (
									<VisibilityOffIcon
										sx={{
											fontSize: 20,
											color: "var(--md-sys-color-on-tertiary-container)]",
										}}
									/>
								) : (
									<BlockIcon
										sx={{
											fontSize: 20,
											color: "var(--md-sys-color-on-error-container)]",
										}}
									/>
								)}
							</div>
							<h2 className="md-title-large">{title}</h2>
						</div>
						<button
							onClick={handleClose}
							className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-(--md-sys-color-surface-variant) transition-colors"
						>
							<CloseIcon sx={{ color: "var(--md-sys-color-on-surface)]" }} />
						</button>
					</div>

					<p className="md-body-medium text-(--md-sys-color-on-surface-variant) mb-2">
						Użytkownik: <strong>{userName}</strong>
					</p>

					<p className="md-body-small text-(--md-sys-color-on-surface-variant) mb-4">
						{description}
					</p>

					{/* Reason */}
					<div className="mb-4">
						<label className="block md-label-large text-(--md-sys-color-on-surface-variant) mb-2">
							Powód (wymagany)
						</label>
						<textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Opisz powód podjęcia tej akcji..."
							rows={3}
							className="w-full px-4 py-3 rounded-xl bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) placeholder:text-(--md-sys-color-on-surface-variant) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary) resize-none"
						/>
					</div>

					{/* Actions */}
					<div className="flex gap-3 justify-end">
						<button onClick={handleClose} className="md-text-button">
							Anuluj
						</button>
						<button
							onClick={handleConfirm}
							disabled={!reason.trim() || loading}
							className="md-filled-button flex items-center gap-2 disabled:opacity-50"
							style={{
								backgroundColor: !reason.trim()
									? undefined
									: isShadowBan
										? "var(--md-sys-color-tertiary)]"
										: "var(--md-sys-color-error)]",
							}}
						>
							{loading ? (
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							) : isShadowBan ? (
								<VisibilityOffIcon sx={{ fontSize: 18 }} />
							) : (
								<BlockIcon sx={{ fontSize: 18 }} />
							)}
							Potwierdź
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
