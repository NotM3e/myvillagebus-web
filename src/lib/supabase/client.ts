import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
	// Server-side: always create new instance (SSR safety)
	if (typeof window === "undefined") {
		return createSupabaseClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				auth: {
					flowType: "pkce",
					autoRefreshToken: true,
					detectSessionInUrl: true,
					persistSession: true,
				},
			}
		);
	}

	// Client-side: reuse single instance
	if (!supabaseInstance) {
		supabaseInstance = createSupabaseClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				auth: {
					flowType: "pkce",
					autoRefreshToken: true,
					detectSessionInUrl: true,
					persistSession: true,
				},
			}
		);
	}

	return supabaseInstance;
}
