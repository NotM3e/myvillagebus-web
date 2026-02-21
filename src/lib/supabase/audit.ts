import { createClient } from "./client";
import type { AuditAction } from "@/types/database";

export interface AuditLogData {
	action: AuditAction;
	targetTable: string;
	targetId?: string;
	payload?: Record<string, unknown>;
}

export async function logAuditEvent(
	data: AuditLogData
): Promise<{ success: boolean; error?: string }> {
	const supabase = createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { success: false, error: "Nie zalogowano" };
	}

	try {
		const { error } = await supabase.from("audit_logs").insert({
			user_id: user.id,
			action: data.action,
			target_table: data.targetTable,
			target_id: data.targetId || null,
			payload: data.payload || null,
		});

		if (error) {
			console.error("Audit log error:", error.message);
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch (err) {
		console.error("Audit log error:", err);
		return { success: false, error: "Nieznany błąd" };
	}
}
