"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPortalPage() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAdminData = async () => {
        try {
            const res = await fetch("/api/admin");
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setUsers(data.users || []);
                setJobs(data.jobs || []);
                setCompanies(data.companies || []);
            } else if (res.status === 403) {
                router.push("/dashboard");
            }
        } catch (err: any) {
            console.error("Failed to load admin dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdminData();
    }, [router]);

    const toggleCompanyVerification = async (companyId: string, currentStatus: boolean) => {
        try {
            const res = await fetch("/api/admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyId, isVerified: !currentStatus })
            });
            if (res.ok) {
                loadAdminData(); // Refresh
            }
        } catch (err) {
            console.error("Toggle failed", err);
        }
    };

    if (loading) return <div className="container" style={{ padding: '8rem', textAlign: 'center' }}>Loading Platform Governance Metrics...</div>;

    if (!stats) return <div className="container" style={{ padding: '8rem', textAlign: 'center', color: "var(--text-secondary)" }}>Access Denied. Platform Integrity Module Locked.</div>;

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ marginBottom: "0.5rem", fontSize: "2.5rem" }}>
                        Platform <span className="title-gradient">Governance</span>
                    </h1>
                    <p style={{ color: "var(--text-secondary)" }}>
                        Super-Admin Interface. Monitor platform health, verify participating firms, and oversee all system activity.
                    </p>
                </div>
                <div className="glass-card" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff80', boxShadow: '0 0 10px #00ff80' }}></div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>System Status: Operational</span>
                </div>
            </div>

            {/* Top Metrics Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
                {[
                    { label: 'Total Users', value: stats.totalUsers, color: 'var(--text-primary)' },
                    { label: 'Verified Firms', value: stats.totalCompanies, color: 'var(--accent-color)' },
                    { label: 'Active Jobs', value: stats.totalJobs, color: '#ffa500' },
                    { label: 'Applications', value: stats.totalApplications, color: '#00ff80' },
                    { label: 'System Uptime', value: stats.systemUptime || 'Live', color: 'var(--text-secondary)' }
                ].map((m, i) => (
                    <div key={i} className="glass-card" style={{ textAlign: "center", padding: "1.5rem" }}>
                        <h2 style={{ fontSize: "2rem", color: m.color, marginBottom: "0.5rem" }}>{m.value}</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: '1px' }}>{m.label}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "2rem" }}>
                {/* Companies/Firms List */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: "1.5rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Participating Corporate Partners
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {companies.map(c => (
                            <div key={c.id} style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr 1fr",
                                alignItems: "center",
                                padding: "1.2rem",
                                background: "rgba(255,255,255,0.02)",
                                borderRadius: "12px",
                                border: `1px solid ${c.isVerified ? 'rgba(0,255,128,0.1)' : 'rgba(255,165,0,0.1)'}`
                            }}>
                                <div>
                                    <h5 style={{ color: "var(--text-primary)", fontSize: "1rem", marginBottom: '2px' }}>{c.name}</h5>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{c.industry} • {c.location || 'Remote'}</p>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <span style={{
                                        fontSize: "0.7rem",
                                        padding: "4px 10px",
                                        borderRadius: "100px",
                                        background: c.isVerified ? "rgba(0, 255, 128, 0.1)" : "rgba(255, 165, 0, 0.1)",
                                        color: c.isVerified ? "#00ff80" : "#ffa500",
                                        border: `1px solid ${c.isVerified ? '#00ff8033' : '#ffa50033'}`
                                    }}>
                                        {c.isVerified ? 'VERIFIED' : 'PENDING'}
                                    </span>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <button
                                        onClick={() => toggleCompanyVerification(c.id, c.isVerified)}
                                        className={c.isVerified ? "btn-secondary" : "btn-primary"}
                                        style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                                    >
                                        {c.isVerified ? 'Revoke' : 'Verify'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Activity */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: "1.5rem" }}>System User Audit</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", maxHeight: "500px", overflowY: "auto", paddingRight: "10px" }}>
                        {users.map(u => (
                            <div key={u.id} style={{ padding: "1rem", background: "rgba(255,255,255,0.01)", borderRadius: "8px", border: '1px solid rgba(255,255,255,0.03)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{u.name}</span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{u.role}</span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{u.email}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
