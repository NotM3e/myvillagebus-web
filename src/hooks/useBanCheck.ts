import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface BanCheckResult {
	isBanned: boolean;
	isShadowBanned: boolean;
	loading: boolean;
}

export function useBanCheck(): BanCheckResult {
	const [isBanned, setIsBanned] = useState(false);
	const [isShadowBanned, setIsShadowBanned] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const supabase = createClient();

		async function checkStatus(userId: string | undefined) {
			if (!userId) {
				setIsBanned(false);
				setIsShadowBanned(false);
				setLoading(false);
				return;
			}

			const { data } = await supabase
				.from("profiles")
				.select("status")
				.eq("id", userId)
				.single();

			// Fail-open: if query fails, allow access (RLS still blocks on backend)
			setIsBanned(data?.status === "banned");
			setIsShadowBanned(data?.status === "shadow_banned");
			setLoading(false);
		}

		supabase.auth.getSession().then(({ data: { session } }) => {
			checkStatus(session?.user?.id);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setLoading(true);
			checkStatus(session?.user?.id);
		});

		return () => subscription.unsubscribe();
	}, []);

	return { isBanned, isShadowBanned, loading };
}
