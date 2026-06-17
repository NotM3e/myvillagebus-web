"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PageWrapper from "@/components/PageWrapper";

export default function AuthCallbackPage() {
	const router = useRouter();

	useEffect(() => {
		const supabase = createClient();

		// detectSessionInUrl: true automatycznie obsługuje callback
		supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_IN" && session) {
				router.replace("/app");
			}
		});
	}, [router]);

	return (
		<PageWrapper maxWidth="max-w-md" className="flex items-center justify-center">
			<div className="text-center">
				<div className="w-8 h-8 border-2 border-(--md-sys-color-primary) border-t-transparent rounded-full animate-spin mx-auto mb-4" />
				<p className="md-body-medium text-(--md-sys-color-on-surface-variant)">
					Logowanie...
				</p>
			</div>
		</PageWrapper>
	);
}
