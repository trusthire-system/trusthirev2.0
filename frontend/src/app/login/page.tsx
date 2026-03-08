"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Successfully logged in, redirect based on role or to global dashboard
            toast.success("Successfully logged in. Getting your dashboard ready...");
            router.push("/dashboard");
        } catch (err: unknown) {
            if (err instanceof Error) {
                const errorMsg = err.message || "We couldn't log you in. Please check your credentials.";
                toast.error(errorMsg);
                if (errorMsg.includes("pending verification")) {
                    setNeedsVerification(true);
                }
            } else {
                toast.error("An unexpected network error occurred while reaching the authentication server.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/resend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Verification email resent. Please check your inbox.");
            setNeedsVerification(false);
        } catch (err: unknown) {
            if (err instanceof Error) {
                toast.error(err.message || "Failed to resend verification email.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="glass-card" style={{ width: "100%", maxWidth: "450px" }}>
                <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>
                    Welcome back to <span className="title-gradient">TrustHire</span>
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                style={{ paddingRight: "40px" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-secondary)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
                        {loading ? "Logging in..." : "Log In"}
                    </button>
                    {needsVerification && (
                        <button
                            type="button"
                            onClick={handleResend}
                            style={{
                                width: "100%",
                                marginTop: "1rem",
                                background: "transparent",
                                color: "var(--accent-color)",
                                border: "1px solid var(--accent-color)",
                                padding: "0.8rem",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "1rem",
                                transition: "all 0.2s ease"
                            }}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Resend Verification Email"}
                        </button>
                    )}
                </form>
                <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    Don&apos;t have an account? <Link href="/register" style={{ color: "var(--accent-color)" }}>Sign up</Link>
                </div>
            </div>
        </div>
    );
}
