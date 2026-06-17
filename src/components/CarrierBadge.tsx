"use client";

import type { CarrierStatus } from "@/types/database";
import VerifiedIcon from "@mui/icons-material/Verified";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

interface CarrierBadgeProps {
	status: CarrierStatus;
	showLabel?: boolean;
	size?: "small" | "medium";
}

const STATUS_CONFIG: Record<
	CarrierStatus,
	{
		icon: typeof VerifiedIcon | null;
		color: string;
		label: string;
	}
> = {
	unverified: {
		icon: null,
		color: "var(--md-sys-color-outline)]",
		label: "Rozkład dodany przez społeczność",
	},
	verified: {
		icon: VerifiedIcon,
		color: "var(--md-sys-color-primary)]",
		label: "Dane zweryfikowane przez moderatora",
	},
	partner: {
		icon: WorkspacePremiumIcon,
		color: "var(--md-sys-color-tertiary)]",
		label: "Oficjalny Partner wsiobus.pl - gwarancja aktualności",
	},
};

export default function CarrierBadge({
	status,
	showLabel = false,
	size = "small",
}: CarrierBadgeProps) {
	// Guard against undefined/invalid status
	if (!status || !STATUS_CONFIG[status]) {
		return null;
	}

	const config = STATUS_CONFIG[status];

	// Don't render anything for unverified without label
	if (status === "unverified" && !showLabel) {
		return null;
	}

	const iconSize = size === "small" ? 16 : 20;

	return (
		<span className="inline-flex items-center gap-1.5">
			{config.icon && (
				<config.icon
					sx={{
						fontSize: iconSize,
						color: config.color,
					}}
				/>
			)}
			{showLabel && (
				<span
					className={`${size === "small" ? "md-body-small" : "md-body-medium"}`}
					style={{ color: config.color }}
				>
					{config.label}
				</span>
			)}
		</span>
	);
}
