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
        let details = { issuer: "Unknown", recipient: "Unknown", date: "Unknown", type: "Unknown" };
        let reasoning = "";

        try {
            const pythonApiUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8001";

            const verifyFormData = new URLSearchParams();
            verifyFormData.append("file_path", filePath);

            console.log(`[INFO] Calling Backend Verification: ${pythonApiUrl}/api/verify-certificate`);
            const verifyResponse = await fetch(`${pythonApiUrl}/api/verify-certificate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: verifyFormData.toString(),
            });

            if (verifyResponse.ok) {
                const result = await verifyResponse.json();
                console.log("[INFO] Backend Response:", result);
                if (result.success) {
                    isVerified = result.isVerified;
                    confidenceScore = result.confidenceScore || 0;
                    details = result.details || details;
                    reasoning = result.reasoning || "";
                }
            } else {
                const errorText = await verifyResponse.text();
                console.error(`[ERROR] Backend Verification failed with status ${verifyResponse.status}:`, errorText);
            }
        } catch (verifyErr) {
            console.error("[CRITICAL] Failed to connect to Python Backend:", verifyErr);
        }

        // Save to DB
        const fileUrl = `/uploads/${fileName}`;

        const certificate = await db.certificate.create({
            data: {
                profileId: userRecord.profileId,
                name,
                category,
                fileUrl,
                issuer: details.issuer,
                recipient: details.recipient,
                date: details.date,
                type: details.type,
                isVerified,
                confidenceScore,
                reasoning
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

export async function DELETE(req: Request) {
    try {
        const userPayload = await getUserFromCookies();
        if (!userPayload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = userPayload.userId as string;
        const { searchParams } = new URL(req.url);
        const certId = searchParams.get("id");

        if (!certId) {
            return NextResponse.json({ error: "Certificate ID is required." }, { status: 400 });
        }

        // Verify the certificate belongs to the user
        const certificate = await db.certificate.findUnique({
            where: { id: certId },
            include: { profile: { include: { user: true } } }
        });

        if (!certificate) {
            return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
        }

        if (certificate.profile.user.id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete File if it exists
        if (certificate.fileUrl.startsWith("/uploads/")) {
            const filePath = path.join(process.cwd(), "public", certificate.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`[INFO] Deleted file: ${filePath}`);
            }
        }

        // Delete from DB
        await db.certificate.delete({
            where: { id: certId }
        });

        return NextResponse.json({
            success: true,
            message: "Certificate deleted successfully."
        });

    } catch (err: any) {
        console.error("Deletion Error:", err);
        return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
    }
}
