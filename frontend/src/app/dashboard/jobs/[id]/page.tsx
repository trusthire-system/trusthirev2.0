"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Briefcase, Building2, MapPin, Clock, Users,
    CheckCircle2, ArrowLeft, ShieldCheck, Zap,
    Award, DollarSign, Globe, Info, Star
} from "lucide-react";

export default function JobDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [job, setJob] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [matchScore, setMatchScore] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                // Check if user is logged in and their role
                const profileRes = await fetch("/api/profile");
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setUser(profileData.user);

                    const appliedIds = (profileData.applications || []).map((a: any) => a.jobId);
                    if (appliedIds.includes(id)) {
                        setApplied(true);
                    }

                    // Check for recommendation
                    const recommendation = (profileData.recommendedJobs || []).find((rj: any) => rj.id === id);
                    if (recommendation) {
                        setMatchScore(recommendation.matchScore);
                    }
                }

                const jobRes = await fetch(`/api/jobs/${id}`);
                if (jobRes.ok) {
                    const jobData = await jobRes.json();
                    setJob(jobData.job);
                } else {
                    router.push("/dashboard/jobs");
                }
            } catch (err) {
                console.error("Failed to load job details", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id, router]);

    const handleApply = async () => {
        setApplying(true);
        try {
            const res = await fetch("/api/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId: id })
            });
            const data = await res.json();
            if (res.ok) {
                setApplied(true);
            } else {
                alert(data.error || "Failed to apply");
            }
        } catch (err) {
            alert("An error occurred");
        } finally {
            setApplying(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: "8rem", textAlign: "center" }}>Loading Vacancy Details...</div>;
    if (!job) return null;

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "5rem" }}>
            <Link href="/dashboard/jobs" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9rem" }}>
                <ArrowLeft size={16} /> Back to Job Board
            </Link>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2.5rem" }}>
                {/* Main Content */}
                <div>
                    <div style={{ marginBottom: "2.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
                            {matchScore && (
                                <div style={{
                                    padding: "6px 14px",
                                    background: "rgba(0, 204, 102, 0.15)",
                                    borderRadius: "100px",
                                    color: "#00cc66",
                                    fontSize: "0.75rem",
                                    fontWeight: 800,
                                    border: "1px solid rgba(0, 204, 102, 0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}>
                                    <Star size={14} fill="#00cc66" /> Top Talent Match
                                </div>
                            )}
                            <div style={{
                                padding: "6px 14px",
                                background: "rgba(102, 252, 241, 0.1)",
                                borderRadius: "100px",
                                color: "var(--accent-color)",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                border: "1px solid rgba(102, 252, 241, 0.2)"
                            }}>
                                {job.industry || "General Industry"}
                            </div>
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                Posted {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <h1 style={{ fontSize: "2.8rem", marginBottom: "0.5rem" }}>{job.title}</h1>
                        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", color: "var(--text-secondary)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Building2 size={18} color="var(--accent-color)" /> {job.company.name}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <MapPin size={18} /> {job.company.location || "Multiple Locations"}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <DollarSign size={18} /> {job.salaryRange || "Competitive"}
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: "2.5rem", marginBottom: "2rem" }}>
                        <h3 style={{ marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                            <Info size={20} color="var(--accent-color)" /> Job Description
                        </h3>
                        <p style={{ color: "var(--text-secondary)", lineHeight: "1.8", whiteSpace: "pre-wrap", marginBottom: "2rem" }}>
                            {job.description}
                        </p>

                        <h3 style={{ marginBottom: "1.2rem" }}>Required Expertise</h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "2.5rem" }}>
                            {(job.requirements || "").split(",").map((req: string) => (
                                <span key={req} style={{
                                    padding: "8px 16px",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid var(--glass-border)",
                                    borderRadius: "8px",
                                    fontSize: "0.85rem",
                                    color: "var(--text-primary)"
                                }}>
                                    {req.trim()}
                                </span>
                            ))}
                        </div>

                        {job.preferred && (
                            <>
                                <h4 style={{ marginBottom: "1rem" }}>Preferred Skills</h4>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                                    {job.preferred}
                                </p>
                            </>
                        )}
                    </div>

                    <div className="glass-card" style={{ padding: "2.5rem" }}>
                        <h3 style={{ marginBottom: "1.2rem" }}>About {job.company.name}</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: "1.7", marginBottom: "2rem" }}>
                            {job.company.description || "No description provided."}
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            <div>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "5px" }}>Website</p>
                                <a href={job.company.website} target="_blank" style={{ color: "var(--accent-color)", display: "flex", alignItems: "center", gap: "5px" }}>
                                    {job.company.website || "Not listed"} <Globe size={14} />
                                </a>
                            </div>
                            <div>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "5px" }}>Company Size</p>
                                <p style={{ color: "var(--text-primary)" }}>{job.company.organizationSize || "Not specified"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Sticky */}
                <div style={{ position: "sticky", top: "100px", height: "fit-content" }}>
                    <div className="glass-card" style={{ padding: "2rem", border: "1px solid var(--accent-color)", background: "rgba(102, 252, 241, 0.02)" }}>
                        <div style={{ marginBottom: "1.5rem" }}>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Compensation</p>
                            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{job.salaryRange || "Competitive"}</p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                                <Award size={18} color="var(--accent-color)" opacity={0.7} />
                                <span>{job.experienceLevel || "Entry Level"}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                                <Users size={18} color="var(--accent-color)" opacity={0.7} />
                                <span>{job.vacancyCount} Open Positions</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                                <ShieldCheck size={18} color="var(--accent-color)" opacity={0.7} />
                                <span>Verified Employer</span>
                            </div>
                        </div>

                        {user?.role === 'CANDIDATE' ? (
                            applied ? (
                                <div style={{
                                    padding: "1rem",
                                    background: "rgba(0, 204, 102, 0.1)",
                                    border: "1px solid rgba(0, 204, 102, 0.2)",
                                    borderRadius: "12px",
                                    color: "#00cc66",
                                    textAlign: "center",
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px"
                                }}>
                                    <CheckCircle2 size={20} /> Application Submitted
                                </div>
                            ) : (
                                <button
                                    onClick={handleApply}
                                    disabled={applying}
                                    className="btn-primary"
                                    style={{ width: "100%", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                                >
                                    {applying ? "Processing..." : <>Apply Now <Zap size={18} fill="currentColor" /></>}
                                </button>
                            )
                        ) : (
                            <Link href={`/dashboard/hr/${id}`} className="btn-secondary" style={{ width: "100%", display: "block", textAlign: "center", padding: "16px" }}>
                                View Pipeline
                            </Link>
                        )}
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center", marginTop: "1rem" }}>
                            Applied by {job._count.applications} candidates
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: "1.5rem", marginTop: "1.5rem", border: "1px solid rgba(102, 252, 241, 0.2)" }}>
                        <h4 style={{ marginBottom: "1rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Zap size={16} color="var(--accent-color)" /> ML Match Insights
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Skill Alignment</span>
                                <span style={{ color: "#00cc66", fontWeight: 700 }}>{matchScore ? Math.round(matchScore * 0.9) : 40}%</span>
                            </div>
                            <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                                <div style={{ width: `${matchScore ? Math.round(matchScore * 0.9) : 40}%`, height: "100%", background: "#00cc66" }}></div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Profile Trust</span>
                                <span style={{ color: "#ffa500", fontWeight: 700 }}>{matchScore ? Math.round(matchScore * 0.7) : 30}%</span>
                            </div>
                            <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                                <div style={{ width: `${matchScore ? Math.round(matchScore * 0.7) : 30}%`, height: "100%", background: "#ffa500" }}></div>
                            </div>
                        </div>
                        <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "1rem", lineHeight: "1.4" }}>
                            {matchScore && matchScore > 50
                                ? `Your profile shows a ${matchScore}% alignment with this role's core requirements. You are a strong candidate.`
                                : "Enhance your profile skills and experience to improve your alignment with this role."}
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: "1.5rem", marginTop: "1.5rem" }}>
                        <h4 style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>TrustHire Protection</h4>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                            This job is protected by TrustHire anti-fraud verification. Your data is encrypted and only shared with the employer after initial ML screening.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
