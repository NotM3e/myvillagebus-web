"use client";

import { use } from "react";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default function ManageUserDetailPage({ params }: PageProps) {
	const { id: userId } = use(params);

	return (
		<div>
			<div className="flex items-center gap-4 mb-6">
				<Link
					href="/manage/users"
					className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
				>
					<ArrowBackIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
				</Link>
				<h1 className="md-title-large">Szczegóły użytkownika</h1>
			</div>

			<div className="md-card md-elevation-1 p-6 text-center">
				<p className="md-body-large text-[var(--md-sys-color-on-surface-variant)] mb-2">
					Kartoteka użytkownika - w budowie
				</p>
				<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
					ID: {userId}
				</p>
			</div>
		</div>
	);
}
