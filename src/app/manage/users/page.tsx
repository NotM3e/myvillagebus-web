"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/supabase/audit";
import Link from "next/link";

import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BlockIcon from "@mui/icons-material/Block";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

type UserRole = "viewer" | "contributor" | "trusted_editor" | "super_editor" | "admin";
const ROLE_HIERARCHY: Record<UserRole, number> = {
	viewer: 0,
	contributor: 1,
	trusted_editor: 2,
	super_editor: 3,
	admin: 4,
};

type UserStatus = "active" | "shadow_banned" | "banned";

interface UserProfile {
	id: string;
	display_name: string | null;
	reputation: number;
	role: UserRole;
	status: UserStatus;
	created_at: string;
	last_active_at: string | null;
}

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: typeof PersonIcon }> = {
	viewer: { label: "Viewer", color: "var(--md-sys-color-outline)", icon: PersonIcon },
	contributor: { label: "Contributor", color: "var(--md-sys-color-secondary)", icon: PersonIcon },
	trusted_editor: {
		label: "Trusted Editor",
		color: "var(--md-sys-color-primary)",
		icon: VerifiedUserIcon,
	},
	super_editor: {
		label: "Super Editor",
		color: "var(--md-sys-color-tertiary)",
		icon: VerifiedUserIcon,
	},
	admin: { label: "Admin", color: "var(--md-sys-color-error)", icon: AdminPanelSettingsIcon },
};

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string }> = {
	active: { label: "Aktywny", color: "var(--md-sys-color-primary)" },
	shadow_banned: { label: "Shadow Ban", color: "var(--md-sys-color-tertiary)" },
	banned: { label: "Zbanowany", color: "var(--md-sys-color-error)" },
};

const ROLE_OPTIONS: UserRole[] = [
	"viewer",
	"contributor",
	"trusted_editor",
	"super_editor",
	"admin",
];

export default function ManageUsersPage() {
	const [users, setUsers] = useState<UserProfile[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
	const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

	const fetchUsers = async () => {
		setLoading(true);
		const supabase = createClient();

		// Get current user
		const {
			data: { user },
		} = await supabase.auth.getUser();
		setCurrentUserId(user?.id || null);

		if (user) {
			const { data: profile } = await supabase
				.from("profiles")
				.select("role")
				.eq("id", user.id)
				.single();
			setCurrentUserRole((profile?.role as UserRole) || null);
		}

		let query = supabase.from("profiles").select("*").order("reputation", { ascending: false });

		if (roleFilter !== "all") {
			query = query.eq("role", roleFilter);
		}

		if (statusFilter !== "all") {
			query = query.eq("status", statusFilter);
		}

		const { data, error } = await query.limit(100);

		if (error) {
			console.error("Error fetching users:", error);
			setUsers([]);
		} else {
			setUsers(data || []);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchUsers();
	}, [roleFilter, statusFilter]);

	const filteredUsers = users.filter((user) => {
		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase();
		return (
			user.display_name?.toLowerCase().includes(query) ||
			user.id.toLowerCase().includes(query)
		);
	});

	const handleRoleChange = async (userId: string, newRole: UserRole) => {
		if (userId === currentUserId) {
			alert("Nie możesz zmienić własnej roli");
			return;
		}

		// Tylko admin może zmieniać role
		if (currentUserRole !== "admin") {
			alert("Tylko administrator może zmieniać role użytkowników");
			return;
		}

		const targetUser = users.find((u) => u.id === userId);
		if (!targetUser) return;

		// Nie można zmieniać roli użytkownikowi z wyższą lub równą rangą
		if (ROLE_HIERARCHY[targetUser.role] >= ROLE_HIERARCHY[currentUserRole]) {
			alert("Nie możesz zmienić roli użytkownikowi z wyższą lub równą rangą");
			return;
		}

		setActionLoading(userId);
		const supabase = createClient();

		const { error } = await supabase
			.from("profiles")
			.update({ role: newRole })
			.eq("id", userId);

		if (!error) {
			await logAuditEvent({
				action: "USER_ROLE_CHANGE",
				targetTable: "profiles",
				targetId: userId,
				payload: { oldRole: targetUser.role, newRole },
			});
			fetchUsers();
		}

		setActionLoading(null);
	};

	const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
		if (userId === currentUserId) {
			alert("Nie możesz zmienić własnego statusu");
			return;
		}

		const targetUser = users.find((u) => u.id === userId);
		if (!targetUser || !currentUserRole) return;

		// Nie można banować użytkownika z wyższą lub równą rangą
		if (ROLE_HIERARCHY[targetUser.role] >= ROLE_HIERARCHY[currentUserRole]) {
			alert("Nie możesz zmienić statusu użytkownikowi z wyższą lub równą rangą");
			return;
		}

		setActionLoading(userId);
		const supabase = createClient();

		const oldUser = users.find((u) => u.id === userId);

		let action: "USER_SHADOW_BAN" | "USER_BAN" | "USER_UNBAN";
		if (newStatus === "shadow_banned") action = "USER_SHADOW_BAN";
		else if (newStatus === "banned") action = "USER_BAN";
		else action = "USER_UNBAN";

		const { error } = await supabase
			.from("profiles")
			.update({ status: newStatus })
			.eq("id", userId);

		if (!error) {
			await logAuditEvent({
				action,
				targetTable: "profiles",
				targetId: userId,
				payload: { oldStatus: oldUser?.status, newStatus },
			});
			fetchUsers();
		}

		setActionLoading(null);
	};

	const formatDate = (date: string | null) => {
		if (!date) return "Nigdy";
		return new Date(date).toLocaleDateString("pl-PL", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	return (
		<div>
			<h1 className="md-headline-medium mb-6">Użytkownicy</h1>

			{/* Filters */}
			<div className="flex flex-wrap gap-4 mb-6">
				{/* Search */}
				<div className="relative flex-1 min-w-[200px]">
					<SearchIcon
						sx={{
							position: "absolute",
							left: 12,
							top: "50%",
							transform: "translateY(-50%)",
							fontSize: 20,
							color: "var(--md-sys-color-on-surface-variant)",
						}}
					/>
					<input
						type="text"
						placeholder="Szukaj po nazwie lub ID..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
					/>
				</div>

				{/* Role filter */}
				<div className="flex items-center gap-2">
					<FilterListIcon
						sx={{ fontSize: 20, color: "var(--md-sys-color-on-surface-variant)" }}
					/>
					<select
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
						className="px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] border-none focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
					>
						<option value="all">Wszystkie role</option>
						{ROLE_OPTIONS.map((role) => (
							<option key={role} value={role}>
								{ROLE_CONFIG[role].label}
							</option>
						))}
					</select>
				</div>

				{/* Status filter */}
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value as UserStatus | "all")}
					className="px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] border-none focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
				>
					<option value="all">Wszystkie statusy</option>
					<option value="active">Aktywni</option>
					<option value="shadow_banned">Shadow Ban</option>
					<option value="banned">Zbanowani</option>
				</select>
			</div>

			{/* Users list */}
			{loading ? (
				<div className="flex items-center justify-center h-64">
					<div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
				</div>
			) : filteredUsers.length === 0 ? (
				<div className="md-card md-elevation-1 p-8 text-center">
					<p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
						Brak użytkowników
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{filteredUsers.map((user) => {
						const roleConfig = ROLE_CONFIG[user.role];
						const statusConfig = STATUS_CONFIG[user.status];
						const RoleIcon = roleConfig.icon;
						const isLoading = actionLoading === user.id;
						const isSelf = user.id === currentUserId;

						return (
							<div
								key={user.id}
								className={`md-card md-elevation-1 p-4 border-l-4 ${isSelf ? "opacity-60" : ""}`}
								style={{ borderLeftColor: roleConfig.color }}
							>
								<div className="flex items-start gap-4">
									{/* Avatar */}
									<div
										className="w-12 h-12 rounded-full flex items-center justify-center"
										style={{ backgroundColor: `${roleConfig.color}20` }}
									>
										<RoleIcon sx={{ fontSize: 24, color: roleConfig.color }} />
									</div>

									{/* Info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<p className="md-title-medium truncate">
												{user.display_name || "Bez nazwy"}
											</p>
											{user.status !== "active" && (
												<span
													className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1"
													style={{
														backgroundColor: `${statusConfig.color}20`,
														color: statusConfig.color,
													}}
												>
													{user.status === "shadow_banned" && (
														<VisibilityOffIcon sx={{ fontSize: 12 }} />
													)}
													{user.status === "banned" && (
														<BlockIcon sx={{ fontSize: 12 }} />
													)}
													{statusConfig.label}
												</span>
											)}
											{isSelf && (
												<span className="px-2 py-0.5 rounded-full text-xs bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
													Ty
												</span>
											)}
										</div>

										<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)] mb-1">
											Reputacja: <strong>{user.reputation}</strong> •
											Dołączył: {formatDate(user.created_at)}
										</p>

										<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)] truncate">
											ID: {user.id}
										</p>
									</div>

									{/* Actions */}
									<div className="flex items-center gap-2">
										{/* Role selector */}
										<select
											value={user.role}
											onChange={(e) =>
												handleRoleChange(
													user.id,
													e.target.value as UserRole
												)
											}
											disabled={
												isLoading ||
												isSelf ||
												currentUserRole !== "admin" ||
												ROLE_HIERARCHY[user.role] >=
													ROLE_HIERARCHY[currentUserRole || "viewer"]
											}
											className="px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] text-sm border-none focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] disabled:opacity-50"
										>
											{ROLE_OPTIONS.map((role) => (
												<option key={role} value={role}>
													{ROLE_CONFIG[role].label}
												</option>
											))}
										</select>

										{/* Status buttons */}
										{!isSelf &&
											currentUserRole &&
											ROLE_HIERARCHY[user.role] <
												ROLE_HIERARCHY[currentUserRole] && (
												<>
													{user.status === "active" ? (
														<>
															<button
																onClick={() =>
																	handleStatusChange(
																		user.id,
																		"shadow_banned"
																	)
																}
																disabled={isLoading}
																className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-tertiary-container)] transition-colors disabled:opacity-50"
																title="Shadow Ban"
															>
																<VisibilityOffIcon
																	sx={{
																		fontSize: 20,
																		color: "var(--md-sys-color-tertiary)",
																	}}
																/>
															</button>
															<button
																onClick={() =>
																	handleStatusChange(
																		user.id,
																		"banned"
																	)
																}
																disabled={isLoading}
																className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-error-container)] transition-colors disabled:opacity-50"
																title="Ban"
															>
																<BlockIcon
																	sx={{
																		fontSize: 20,
																		color: "var(--md-sys-color-error)",
																	}}
																/>
															</button>
														</>
													) : (
														<button
															onClick={() =>
																handleStatusChange(
																	user.id,
																	"active"
																)
															}
															disabled={isLoading}
															className="md-outlined-button text-sm disabled:opacity-50"
														>
															Odbanuj
														</button>
													)}
												</>
											)}

										{/* Details link */}
										<Link
											href={`/manage/users/${user.id}`}
											className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
											title="Szczegóły"
										>
											<OpenInNewIcon
												sx={{
													fontSize: 20,
													color: "var(--md-sys-color-on-surface-variant)",
												}}
											/>
										</Link>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
