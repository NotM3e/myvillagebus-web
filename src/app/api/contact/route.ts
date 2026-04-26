import { NextRequest, NextResponse } from "next/server";

interface ContactFormData {
	name: string;
	email: string;
	message: string;
}

export async function POST(request: NextRequest) {
	const accessKey = process.env.WEB3FORMS_ACCESS_KEY;

	if (!accessKey) {
		console.error("WEB3FORMS_ACCESS_KEY is not configured");
		return NextResponse.json(
			{ error: "Server configuration error" },
			{ status: 500 }
		);
	}

	try {
		const body: ContactFormData = await request.json();

		const { name, email, message } = body;

		if (!name || !email || !message) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json(
				{ error: "Invalid email address" },
				{ status: 400 }
			);
		}

		const formData = new FormData();
		formData.append("access_key", accessKey);
		formData.append("name", name);
		formData.append("email", email);
		formData.append("message", message);

		const response = await fetch("https://api.web3forms.com/submit", {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			console.error(
				"Web3Forms API error:",
				response.status,
				await response.text()
			);
			return NextResponse.json(
				{ error: "Failed to send message" },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ success: true, message: "Message sent successfully" },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Contact form error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
