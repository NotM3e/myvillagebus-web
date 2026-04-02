"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import AppDrawer from "@/components/AppDrawer";
import BannedScreen from "@/components/BannedScreen";
import { useBanCheck } from "@/hooks/useBanCheck";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const { isBanned, loading } = useBanCheck();

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-(--md-sys-color-background)">
				<div className="w-8 h-8 border-2 border-(--md-sys-color-primary) border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (isBanned) {
		return <BannedScreen />;
	}

	return (
		<div className="min-h-screen bg-(--md-sys-color-background)">
			<AppHeader onMenuClick={() => setIsDrawerOpen(true)} />
			<AppDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
			<main className="pt-16">{children}</main>
		</div>
	);
}
