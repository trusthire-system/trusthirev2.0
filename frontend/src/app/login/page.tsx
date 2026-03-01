"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
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
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Login failed");
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
                {error && <div style={{ color: "#ff4a4a", marginBottom: "1rem", textAlign: "center" }}>{error}</div>}
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
                        <input
                            type="password"
                            className="form-input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
                        {loading ? "Logging in..." : "Log In"}
                    </button>
                </form>
                <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    Don't have an account? <Link href="/register" style={{ color: "var(--accent-color)" }}>Sign up</Link>
                </div>
            </div>
        </div>
    );
}
