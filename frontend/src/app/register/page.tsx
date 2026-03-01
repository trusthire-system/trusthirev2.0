"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "CANDIDATE",
        companyName: "",
        industry: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            if (data.needsVerification) {
                setNeedsVerification(true);
            } else {
                router.push("/dashboard");
            }
        } catch (err: any) {
            setError(err.message || "Registration failed");
            setLoading(false);
        }
    };

    if (needsVerification) {
        return (
            <div className="container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="glass-card" style={{ width: "100%", maxWidth: "500px", textAlign: "center" }}>
                    <h2 style={{ marginBottom: "1.5rem" }} className="title-gradient">Verification Sent</h2>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: "1.6" }}>
                        A unique verification link has been sent to <strong>{formData.email}</strong>.<br />
                        Please verify your account to access your dashboard.
                    </p>
                    <Link href="/login" className="btn-primary" style={{ display: 'block', textDecoration: 'none' }}>
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: '2rem' }}>
            <div className="glass-card" style={{ width: "100%", maxWidth: "500px" }}>
                <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>
                    Join <span className="title-gradient">TrustHire</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Standardized hiring for healthcare, finance, engineering & more.
                </p>

                {error && <div style={{ color: "#ff4a4a", marginBottom: "1rem", textAlign: "center", fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@example.com"
                            required
                        />
                        {formData.role === 'HR_USER' && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)' }}>Organizational email required (No Gmail/Yahoo)</span>
                        )}
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
                    <div className="form-group">
                        <label className="form-label">I am a...</label>
                        <select
                            className="form-input"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="CANDIDATE">Candidate / Job Seeker</option>
                            <option value="HR_USER">HR / Company Representative</option>
                        </select>
                    </div>

                    {formData.role === "HR_USER" && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Company Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Industry Type</label>
                                <select
                                    className="form-input"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    required
                                >
                                    <option value="">Select Industry</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Retail">Retail</option>
                                    <option value="Education">Education</option>
                                    <option value="Logistics">Logistics</option>
                                    <option value="IT">Technology</option>
                                </select>
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
                        {loading ? "Initializing..." : "Register Now"}
                    </button>
                </form>
                <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    Already have an account? <Link href="/login" style={{ color: "var(--accent-color)" }}>Log in</Link>
                </div>
            </div>
        </div>
    );
}
