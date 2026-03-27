"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import GoogleIcon from "@mui/icons-material/Google";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

export default function AuthButton() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const supabase = createClient();

		const getUser = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			setUser(session?.user ?? null);
			setLoading(false);
		};

		getUser();

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
				redirectTo: `${appUrl}/auth/callback`,
			},
		});
	};

	const handleLogout = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
	};

	if (loading) {
		return (
			<div className="w-10 h-10 rounded-full bg-(--md-sys-color-surface-variant) animate-pulse" />
		);
	}

	if (user) {
		return (
			<div className="flex items-center gap-2">
				<div className="w-10 h-10 rounded-full bg-(--md-sys-color-primary-container) flex items-center justify-center overflow-hidden">
					{user.user_metadata?.avatar_url ? (
						<img
							src={user.user_metadata.avatar_url}
							alt="Avatar"
							className="w-10 h-10 rounded-full"
						/>
					) : (
						<PersonOutlineIcon
							sx={{ color: "var(--md-sys-color-on-primary-container)]" }}
						/>
					)}
				</div>
				<button
					onClick={handleLogout}
					className="md-text-button flex items-center gap-1 px-2"
					title="Wyloguj"
				>
					<LogoutIcon sx={{ fontSize: 18 }} />
				</button>
			</div>
		);
	}

	return (
		<button onClick={handleLogin} className="md-filled-button flex items-center gap-2">
			<GoogleIcon sx={{ fontSize: 20 }} />
			Zaloguj przez Google
		</button>
	);
}
