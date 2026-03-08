"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "CANDIDATE",
        companyName: "",
        industry: "",
    });
    const [loading, setLoading] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const calculatePasswordStrength = (password: string) => {
        let score = 0;
        if (!password) return score;
        if (password.length >= 8) score += 1;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        return Math.min(score, 4);
    };

    const strengthScore = calculatePasswordStrength(formData.password);

    const getStrengthColor = (score: number) => {
        switch (score) {
            case 0: return "var(--text-secondary)";
            case 1: return "#ff4a4a"; // Weak
            case 2: return "#ffb34a"; // Fair
            case 3: return "#4aff8d"; // Good
            case 4: return "#00ff66"; // Strong
            default: return "var(--text-secondary)";
        }
    };

    const getStrengthText = (score: number) => {
        switch (score) {
            case 0: return "";
            case 1: return "Weak";
            case 2: return "Fair";
            case 3: return "Good";
            case 4: return "Strong";
            default: return "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Your passwords do not match. Please check and try again.");
            return;
        }

        if (strengthScore < 2) {
            toast.error("Your password is too weak. Try including symbols and numbers.");
            return;
        }

        setLoading(true);

        try {
            const submitData = { ...formData };
            // @ts-ignore
            delete submitData.confirmPassword;
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            if (data.needsVerification) {
                toast.success("Account created successfully! A verification email has been sent.", { duration: 5000 });
                setNeedsVerification(true);
            } else {
                toast.success("Registration successful! Setting up your dashboard...");
                router.push("/dashboard");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                toast.error(err.message || "We encountered an issue creating your account. Please try again.");
            } else {
                toast.error("An unexpected network error interrupted the registration.");
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
        } catch (err: unknown) {
            if (err instanceof Error) {
                toast.error(err.message || "Failed to resend verification email.");
            }
        } finally {
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <Link href="/login" className="btn-primary" style={{ display: 'block', textDecoration: 'none' }}>
                            Back to Login
                        </Link>
                        <button
                            type="button"
                            onClick={handleResend}
                            style={{
                                width: "100%",
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
                    </div>
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
                        {formData.password && (
                            <div style={{ marginTop: "0.5rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                                    <span style={{ color: "var(--text-secondary)" }}>Password Strength:</span>
                                    <span style={{ color: getStrengthColor(strengthScore), fontWeight: "bold" }}>{getStrengthText(strengthScore)}</span>
                                </div>
                                <div style={{ display: "flex", gap: "4px", height: "4px" }}>
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            style={{
                                                flex: 1,
                                                backgroundColor: level <= strengthScore ? getStrengthColor(strengthScore) : "rgba(255,255,255,0.1)",
                                                borderRadius: "2px",
                                                transition: "all 0.3s ease"
                                            }}
                                        />
                                    ))}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: "1.4" }}>
                                    Help: Use at least 8 characters, with uppercase, lowercase, numbers, and special characters.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="form-input"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                style={{ paddingRight: "40px" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
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
