import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromCookies } from "@/lib/auth-util";
import fs from "fs";
import path from "path";
export const maxDuration = 60; // Max execution time

export async function POST(req: Request) {
    try {
        const userPayload = await getUserFromCookies();
        if (!userPayload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = userPayload.userId as string;

        const formData = await req.formData();
        const file = formData.get("certificate") as File;
        const category = formData.get("category") as string;
        const name = formData.get("name") as string;

        if (!file || !category || !name) {
            return NextResponse.json({ error: "Certificate file, name, and category are required." }, { status: 400 });
        }

        // Validate Category
        if (!["EDUCATION", "COURSE", "ACHIEVEMENT"].includes(category)) {
            return NextResponse.json({ error: "Invalid category." }, { status: 400 });
        }

        const userRecord = await db.user.findUnique({
            where: { id: userId },
        });

        if (!userRecord || !userRecord.profileId) {
            return NextResponse.json({ error: "Profile not found." }, { status: 404 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const ext = file.name.split(".").pop();
        const fileName = `cert_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, buffer);

        // Verify with Python Backend
        let isVerified = false;
        let confidenceScore = 0;

        try {
            const pythonApiUrl = process.env.BACKEND_API_URL || "http://localhost:8000";

            const verifyFormData = new URLSearchParams();
            verifyFormData.append("file_path", filePath);

            const verifyResponse = await fetch(`${pythonApiUrl}/api/verify-certificate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: verifyFormData.toString(),
            });

            if (verifyResponse.ok) {
                const result = await verifyResponse.json();
                if (result.success) {
                    isVerified = result.isVerified;
                    confidenceScore = result.confidenceScore;
                }
            }
        } catch (verifyErr) {
            console.error("Backend Verification Error:", verifyErr);
        }

        // Save to DB
        const fileUrl = `/uploads/${fileName}`;

        const certificate = await db.certificate.create({
            data: {
                profileId: userRecord.profileId,
                name,
                category,
                fileUrl,
                isVerified,
                confidenceScore,
            },
        });

        return NextResponse.json({
            success: true,
            certificate,
        });

    } catch (err: any) {
        console.error("Upload Error:", err);
        return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
    }
}
