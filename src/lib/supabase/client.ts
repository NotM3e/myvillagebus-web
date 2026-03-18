import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

const globalForSupabase = globalThis as unknown as {
	supabaseInstance: SupabaseClient | undefined;
};

let supabaseInstance = globalForSupabase.supabaseInstance;

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

	if (process.env.NODE_ENV !== "production") {
		globalForSupabase.supabaseInstance = supabaseInstance;
	}
	return supabaseInstance;
}
