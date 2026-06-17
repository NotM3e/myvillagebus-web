import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Szczegóły kursu - Wsiobus",
	description: "Szczegóły rozkładu jazdy",
};

export default function ScheduleDetailsLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
