"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import AppDrawer from "@/components/AppDrawer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	return (
		<div className="min-h-screen bg-[var(--md-sys-color-background)]">
			<AppHeader onMenuClick={() => setIsDrawerOpen(true)} />
			<AppDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
			<main className="pt-16">{children}</main>
		</div>
	);
}
