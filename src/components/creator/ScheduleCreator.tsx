"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitSchedule } from "@/lib/supabase/mutations";
import { User } from "@supabase/supabase-js";
import StepCarrier from "./StepCarrier";
import StepLine from "./StepLine";
import StepSchedule from "./StepSchedule";
import CheckIcon from "@mui/icons-material/Check";

interface ScheduleCreatorProps {
	user: User;
}

export interface CreatorData {
	// Krok 1
	carrier: {
		id: string | null; // null = nowy przewoźnik
		name: string;
		isNew: boolean;
	} | null;
	// Krok 2
	line: {
		id: string | null;
		number: string;
		description: string;
		isNew: boolean;
	} | null;
	stops: {
		id: string | null;
		city: string;
		name: string;
		isNew: boolean;
	}[];
	direction: string;
	// Krok 3
	days: string[];
	excludesHolidays: boolean;
	departures: string; // Bulk entry text
}

const STEPS = [
	{ label: "Przewoźnik", key: "carrier" },
	{ label: "Linia i trasa", key: "line" },
	{ label: "Harmonogram", key: "schedule" },
] as const;

export default function ScheduleCreator({ user }: ScheduleCreatorProps) {
	const [currentStep, setCurrentStep] = useState(0);
	const [data, setData] = useState<CreatorData>({
		carrier: null,
		line: null,
		stops: [],
		direction: "",
		days: ["Pon", "Wt", "Śr", "Czw", "Pt"],
		excludesHolidays: true,
		departures: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const router = useRouter();

	const canGoNext = () => {
		switch (currentStep) {
			case 0:
				return data.carrier !== null && data.carrier.name.trim() !== "";
			case 1:
				return data.line !== null && data.stops.length >= 2 && data.direction.trim() !== "";
			case 2:
				// Parse departures and check if at least one valid
				const lines = data.departures
					.split("\n")
					.map((l) => l.trim())
					.filter((l) => l);
				const timeRegex = /([0-1]?[0-9]|2[0-3]):([0-5][0-9])/;
				const validCount = lines.filter((line) => timeRegex.test(line)).length;
				return data.days.length > 0 && validCount > 0;
			default:
				return false;
		}
	};

	const handleNext = () => {
		if (currentStep < STEPS.length - 1 && canGoNext()) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleSubmit = async () => {
		setSubmitting(true);
		setSubmitError(null);

		const result = await submitSchedule(data, user.id);

		if (result.success) {
			// Sukces - przekieruj do strony głównej
			router.push("/app?submitted=true");
		} else {
			setSubmitError(result.error ?? "Wystąpił błąd podczas zapisywania");
			setSubmitting(false);
		}
	};

	const updateData = (updates: Partial<CreatorData>) => {
		setData((prev) => ({ ...prev, ...updates }));
	};

	return (
		<div>
			{/* Stepper */}
			<div className="flex items-start justify-center mb-8 w-full">
				{STEPS.map((step, index) => (
					<div key={step.key} className="flex items-center flex-1 last:flex-none">
						{/* Step circle + label */}
						<div className="flex flex-col items-center min-w-0">
							<div
								className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
									index < currentStep
										? "bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary)"
										: index === currentStep
											? "bg-(--md-sys-color-primary-container) text-(--md-sys-color-on-primary-container) ring-2 ring-(--md-sys-color-primary)"
											: "bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface-variant)"
								}`}
							>
								{index < currentStep ? (
									<CheckIcon sx={{ fontSize: 18 }} />
								) : (
									<span className="md-label-medium sm:md-label-large">
										{index + 1}
									</span>
								)}
							</div>
							<span
								className={`mt-2 text-xs sm:text-sm text-center max-w-[70px] sm:max-w-none ${
									index === currentStep
										? "text-(--md-sys-color-on-surface) font-medium"
										: "text-(--md-sys-color-on-surface-variant)"
								}`}
							>
								{step.label}
							</span>
						</div>

						{/* Connector line */}
						{index < STEPS.length - 1 && (
							<div
								className={`h-0.5 flex-1 mx-2 sm:mx-4 mt-4 sm:mt-5 ${
									index < currentStep
										? "bg-(--md-sys-color-primary)"
										: "bg-(--md-sys-color-outline-variant)"
								}`}
							/>
						)}
					</div>
				))}
			</div>

			{/* Step content */}
			<div className="mb-8">
				{currentStep === 0 && <StepCarrier data={data} updateData={updateData} />}
				{currentStep === 1 && <StepLine data={data} updateData={updateData} />}
				{currentStep === 2 && <StepSchedule data={data} updateData={updateData} />}
			</div>

			{/* Error message */}
			{submitError && (
				<div className="mb-4 p-4 rounded-xl bg-(--md-sys-color-error-container) text-(--md-sys-color-on-error-container)">
					<p className="md-body-medium">{submitError}</p>
				</div>
			)}

			{/* Navigation */}
			<div className="flex justify-between">
				<button
					onClick={handleBack}
					disabled={currentStep === 0 || submitting}
					className="md-text-button disabled:opacity-50"
				>
					Wstecz
				</button>

				{currentStep < STEPS.length - 1 ? (
					<button
						onClick={handleNext}
						disabled={!canGoNext()}
						className="md-filled-button disabled:opacity-50"
					>
						Dalej
					</button>
				) : (
					<button
						onClick={handleSubmit}
						disabled={!canGoNext() || submitting}
						className="md-filled-button disabled:opacity-50 flex items-center gap-2"
					>
						{submitting ? (
							<>
								<div className="w-4 h-4 border-2 border-(--md-sys-color-on-primary) border-t-transparent rounded-full animate-spin" />
								Wysyłanie...
							</>
						) : (
							"Wyślij rozkład"
						)}
					</button>
				)}
			</div>
		</div>
	);
}
