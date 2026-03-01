"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateJobPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        industry: "IT",
        vacancyCount: 1,
        requirements: "",
        preferred: "",
        experienceLevel: "",
        salaryRange: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            router.push("/dashboard/jobs");
        } catch (err: any) {
            setError(err.message || "Failed to create job.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "800px" }}>
            <Link href="/dashboard/jobs" style={{ display: "inline-block", marginBottom: "1.5rem", color: "var(--accent-color)" }}>
                &larr; Back to Jobs
            </Link>

            <h1 style={{ marginBottom: "1rem" }}>
                Post a <span className="title-gradient">New Opportunity</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "3rem" }}>
                Create a new job posting for candidates to discover. Fill in the requirements completely to help the ML algorithm score candidates better.
            </p>

            {error && <div style={{ color: "#ff4a4a", marginBottom: "1rem" }}>{error}</div>}

            <div className="glass-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Job Title</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="e.g. Senior Frontend Developer"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Industry Type</label>
                            <select
                                className="form-input"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                required
                            >
                                <option value="Healthcare">Healthcare</option>
                                <option value="Finance">Finance</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Retail">Retail</option>
                                <option value="Education">Education</option>
                                <option value="Logistics">Logistics</option>
                                <option value="IT">Technology</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Number of Vacancies (N)</label>
                            <input
                                type="number"
                                min="1"
                                className="form-input"
                                value={formData.vacancyCount}
                                onChange={(e) => setFormData({ ...formData, vacancyCount: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Experience Level</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.experienceLevel}
                                onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                                placeholder="e.g. 3-5 Years, Entry Level"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Salary Range</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.salaryRange}
                                onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                                placeholder="e.g. $50k - $80k, Competitive"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Job Description</label>
                        <textarea
                            className="form-input"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            rows={4}
                            placeholder="Roles and responsibilities..."
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mandatory Skills (Comma separated)</label>
                        <textarea
                            className="form-input"
                            value={formData.requirements}
                            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                            rows={2}
                            placeholder="Critical skills for score weighting (e.g. ICU care, Auditing, React)"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Preferred Skills / Certs (Nice to have)</label>
                        <textarea
                            className="form-input"
                            value={formData.preferred}
                            onChange={(e) => setFormData({ ...formData, preferred: e.target.value })}
                            rows={2}
                            placeholder="Boost matching for candidates with these additional skills"
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "1rem" }}>
                        {loading ? "Posting..." : "Create Job Post"}
                    </button>
                </form>
            </div>
        </div>
    );
}
