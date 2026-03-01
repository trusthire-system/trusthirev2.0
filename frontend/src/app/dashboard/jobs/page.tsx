"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Search, Briefcase, MapPin, Clock, Filter, CheckCircle2,
    ArrowRight, Building2, Star, Users, Award
} from "lucide-react";

export default function JobsPage() {
    const [user, setUser] = useState<any>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState<string | null>(null);
    const [applyResult, setApplyResult] = useState<{ [jobId: string]: { label: string; color: string; score: number } }>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [myApplicationJobIds, setMyApplicationJobIds] = useState<Set<string>>(new Set());
    const [recommendedJobIds, setRecommendedJobIds] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        async function loadData() {
            try {
                const profileRes = await fetch("/api/profile");
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setUser(profileData.user);
                    const appliedIds = new Set<string>((profileData.applications || []).map((a: any) => a.jobId));
                    setMyApplicationJobIds(appliedIds);

                    const recMap = new Map<string, number>();
                    (profileData.recommendedJobs || []).forEach((rj: any) => recMap.set(rj.id, rj.matchScore));
                    setRecommendedJobIds(recMap);
                }

                const jobsRes = await fetch("/api/jobs");
                if (jobsRes.ok) {
                    const jobsData = await jobsRes.json();
                    setJobs(jobsData.jobs || []);
                }
            } catch (err: any) {
                console.error(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleApply = async (jobId: string) => {
        setApplying(jobId);
        try {
            const res = await fetch("/api/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setMyApplicationJobIds(prev => new Set([...prev, jobId]));
            setApplyResult(prev => ({
                ...prev,
                [jobId]: {
                    label: data.isRecommended ? "Top Match!" : "Application Received",
                    color: data.isRecommended ? "#00cc66" : "#ffa500",
                    score: 0
                }
            }));
        } catch (e: any) {
            alert("Couldn't apply: " + e.message);
        } finally {
            setApplying(null);
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.company?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="container" style={{ padding: "4rem", textAlign: "center" }}>
                <p style={{ color: "var(--text-secondary)" }}>Looking for available jobs...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ marginBottom: "0.5rem" }}>Job <span className="title-gradient">Board</span></h1>
                    <p style={{ color: "var(--text-secondary)" }}>
                        {user?.role === 'HR_USER'
                            ? "Manage your active job postings and review applicants."
                            : "Browse available positions and apply in one click."}
                    </p>
                </div>
                {user?.role === 'HR_USER' && (
                    <Link href="/dashboard/jobs/create" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        + Post a New Job
                    </Link>
                )}
            </div>

            {/* Search Bar */}
            <div className="glass-card" style={{ padding: '1.2rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search by job title, company, or keyword..."
                        className="form-input"
                        style={{ paddingLeft: '46px', background: 'rgba(0,0,0,0.1)' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '100px', border: '1px solid var(--glass-border)' }}>
                    {['All', 'IT', 'Healthcare', 'Finance', 'Engineering'].map(industry => (
                        <button
                            key={industry}
                            onClick={() => setSearchQuery(industry === 'All' ? '' : industry)}
                            style={{
                                padding: '6px 16px',
                                fontSize: '0.75rem',
                                borderRadius: '100px',
                                background: searchQuery === (industry === 'All' ? '' : industry) ? 'var(--accent-color)' : 'transparent',
                                color: searchQuery === (industry === 'All' ? '' : industry) ? '#0b0c10' : 'var(--text-secondary)',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            {industry}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <select className="form-input" style={{ width: 'auto', padding: '8px 15px', fontSize: '0.8rem' }}>
                        <option>Any Experience</option>
                        <option>Entry (0-2 Yrs)</option>
                        <option>Mid (3-5 Yrs)</option>
                        <option>Senior (5+ Yrs)</option>
                    </select>
                    <select className="form-input" style={{ width: 'auto', padding: '8px 15px', fontSize: '0.8rem' }}>
                        <option>Any Salary</option>
                        <option>$50k - $100k</option>
                        <option>$100k - $150k</option>
                        <option>$150k+</option>
                    </select>
                </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredJobs.length}</strong> position{filteredJobs.length !== 1 ? 's' : ''}
            </p>

            {/* Jobs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '1.5rem' }}>
                {filteredJobs.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', padding: "4rem", border: "1px dashed var(--glass-border)", borderRadius: "16px", textAlign: "center" }}>
                        <Briefcase size={36} color="var(--text-secondary)" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
                        <p style={{ color: "var(--text-secondary)" }}>No jobs match your search. Try a different keyword.</p>
                    </div>
                ) : (
                    filteredJobs.map(job => {
                        const alreadyApplied = myApplicationJobIds.has(job.id);
                        const matchScore = recommendedJobIds.get(job.id);
                        const result = applyResult[job.id];

                        return (
                            <div key={job.id} className="glass-card" style={{
                                padding: "2rem",
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            }}>
                                {/* Job Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            background: 'rgba(102, 252, 241, 0.08)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Building2 size={22} color="var(--accent-color)" />
                                        </div>
                                        <div>
                                            <Link href={`/dashboard/jobs/${job.id}`}>
                                                <h3 style={{ fontSize: '1.1rem', marginBottom: '2px', lineHeight: 1.3, cursor: 'pointer' }} className="hover-accent">{job.title}</h3>
                                            </Link>
                                            <p style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '0.88rem' }}>{job.company?.name || 'Company'}</p>
                                        </div>
                                    </div>
                                    {alreadyApplied && !result && (
                                        <span style={{
                                            fontSize: '0.72rem',
                                            padding: '4px 10px',
                                            borderRadius: '100px',
                                            background: 'rgba(102, 252, 241, 0.08)',
                                            color: 'var(--accent-color)',
                                            border: '1px solid rgba(102, 252, 241, 0.15)',
                                            whiteSpace: 'nowrap'
                                        }}>Applied</span>
                                    )}
                                    {matchScore && !alreadyApplied && !result && (
                                        <span style={{
                                            fontSize: '0.72rem',
                                            padding: '4px 10px',
                                            borderRadius: '100px',
                                            background: 'rgba(0, 204, 102, 0.1)',
                                            color: '#00cc66',
                                            border: '1px solid rgba(0, 204, 102, 0.2)',
                                            whiteSpace: 'nowrap',
                                            fontWeight: 700
                                        }}>⭐ {matchScore}% Match</span>
                                    )}
                                    {result && (
                                        <span style={{
                                            fontSize: '0.72rem',
                                            padding: '4px 10px',
                                            borderRadius: '100px',
                                            background: `${result.color}15`,
                                            color: result.color,
                                            border: `1px solid ${result.color}33`,
                                            whiteSpace: 'nowrap'
                                        }}>{result.label}</span>
                                    )}
                                </div>

                                {/* Description */}
                                <p style={{
                                    color: "var(--text-secondary)",
                                    fontSize: "0.9rem",
                                    lineHeight: '1.6',
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    marginBottom: '1.5rem',
                                    flex: 1
                                }}>
                                    {job.description}
                                </p>

                                {/* Meta tags */}
                                <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '1.8rem', flexWrap: 'wrap' }}>
                                    {job.salaryRange && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-color)', fontSize: '0.8rem', fontWeight: 600 }}>
                                            💰 {job.salaryRange}
                                        </div>
                                    )}
                                    {job.experienceLevel && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            <Award size={13} /> {job.experienceLevel}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        <Building2 size={13} /> {job.industry || 'General'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        <Users size={13} /> {job.vacancyCount} {job.vacancyCount === 1 ? 'Vacancy' : 'Vacancies'}
                                    </div>
                                </div>

                                {/* Action Footer */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.4rem' }}>
                                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                                        Active since {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </div>
                                    {user?.role === 'CANDIDATE' ? (
                                        alreadyApplied ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00cc66', fontSize: '0.88rem', fontWeight: 600 }}>
                                                <CheckCircle2 size={16} /> Application Sent
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleApply(job.id)}
                                                disabled={applying === job.id}
                                                className="btn-primary"
                                                style={{ padding: "10px 22px", fontSize: "0.88rem", display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                {applying === job.id ? (
                                                    <>Processing Application... <span style={{ opacity: 0.7 }}>⏳</span></>
                                                ) : (
                                                    <>Quick Apply <ArrowRight size={15} /></>
                                                )}
                                            </button>
                                        )
                                    ) : (
                                        <Link href={`/dashboard/hr/${job.id}`} className="btn-secondary" style={{ padding: "10px 22px", fontSize: "0.88rem" }}>
                                            Review Pipeline
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
