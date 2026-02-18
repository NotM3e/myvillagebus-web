"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import PageWrapper from "@/components/PageWrapper";
import ScheduleCreator from "@/components/creator/ScheduleCreator";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LoginIcon from "@mui/icons-material/Login";

export default function CreateSchedulePage() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const supabase = createClient();

		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
			setLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

	const handleLogin = async () => {
		const supabase = createClient();
		const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
		await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${appUrl}/auth/callback?next=/app/create`,
			},
		});
	};

	if (loading) {
		return (
			<PageWrapper maxWidth="max-w-2xl">
				<div className="text-center py-12">
					<div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
				</div>
			</PageWrapper>
		);
	}

	// Not logged in
	if (!user) {
		return (
			<PageWrapper maxWidth="max-w-md">
				<div className="text-center py-12">
					<div className="w-20 h-20 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center mx-auto mb-6">
						<LoginIcon
							sx={{ fontSize: 40, color: "var(--md-sys-color-on-primary-container)" }}
						/>
					</div>

					<h1 className="md-headline-medium mb-4">Zaloguj się</h1>

					<p className="md-body-large text-[var(--md-sys-color-on-surface-variant)] mb-8">
						Aby dodawać rozkłady, musisz być zalogowany.
					</p>

					<button
						onClick={handleLogin}
						className="md-filled-button inline-flex items-center gap-2 mb-4"
					>
						<LoginIcon sx={{ fontSize: 20 }} />
						Zaloguj przez Google
					</button>

					<div className="mt-4">
						<Link href="/app" className="md-text-button inline-flex items-center gap-2">
							<ArrowBackIcon sx={{ fontSize: 18 }} />
							Wróć do rozkładów
						</Link>
					</div>
				</div>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper maxWidth="max-w-2xl">
			{/* Header */}
			<div className="flex items-center gap-4 mb-6">
				<Link
					href="/app"
					className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
				>
					<ArrowBackIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
				</Link>
				<h1 className="md-title-large">Dodaj rozkład</h1>
			</div>

			<ScheduleCreator user={user} />
		</PageWrapper>
	);
}
