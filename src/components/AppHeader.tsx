"use client";

import MenuIcon from "@mui/icons-material/Menu";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import CloudOffOutlinedIcon from "@mui/icons-material/CloudOffOutlined";
import { useEffect, useState } from "react";
import Link from "next/link";

interface AppHeaderProps {
	onMenuClick: () => void;
}

export default function AppHeader({ onMenuClick }: AppHeaderProps) {
	const [isOnline, setIsOnline] = useState(true);

	useEffect(() => {
		setIsOnline(navigator.onLine);

		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return (
		<header className="fixed top-0 left-0 right-0 z-40 bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline-variant)]">
			<div className="flex items-center justify-between h-16 px-4">
				{/* Left: Hamburger */}
				<button
					onClick={onMenuClick}
					className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
					aria-label="Otwórz menu"
				>
					<MenuIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
				</button>

				{/* Center: Logo */}
				<h1 className="md-title-large text-[var(--md-sys-color-primary)]">WSIOBUS</h1>

				{/* Right: Status + Settings */}
				<div className="flex items-center gap-1">
					{/* Online/Offline indicator */}
					<div
						className="w-10 h-10 rounded-full flex items-center justify-center"
						title={isOnline ? "Online" : "Offline"}
					>
						{isOnline ? (
							<CloudDoneOutlinedIcon sx={{ fontSize: 20, color: "var(--md-sys-color-primary)" }} />
						) : (
							<CloudOffOutlinedIcon sx={{ fontSize: 20, color: "var(--md-sys-color-error)" }} />
						)}
					</div>

					{/* Settings */}
					<Link
						href="/app/settings"
						className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
						aria-label="Ustawienia"
					>
						<SettingsOutlinedIcon sx={{ color: "var(--md-sys-color-on-surface-variant)" }} />
					</Link>
				</div>
			</div>
		</header>
	);
}
