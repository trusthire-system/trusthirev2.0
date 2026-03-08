"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
    Users, Star, CheckCircle, XCircle, Clock,
    ChevronRight, Award, Hash, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function JobPipelinePage() {
    const { id } = useParams();
    const [job, setJob] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<any>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`/api/jobs/${id}/applications`);
                if (res.ok) {
                    const data = await res.json();
                    setJob(data.job);
                    setApplications(data.applications);
                }
            } catch (err) {
                console.error("Failed to fetch pipeline", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    if (loading) return <div className="container" style={{ paddingTop: '5rem' }}>Loading Pipeline...</div>;

    return (
        <div className="container" style={{ paddingBottom: '5rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/dashboard/hr" style={{ color: 'var(--accent-color)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '1rem' }}>
                    <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to Dashboard
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ marginBottom: '0.5rem' }}>{job?.title}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Pipeline for {job?.company?.name} • {job?.vacancyCount} Vacancies Available
                        </p>
                    </div>
                    <div className="badge badge-success" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                        {applications.length} Applicants total
                    </div>
                </div>
            </div>

            <div className="glass-card">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'grid', gridTemplateColumns: '50px 2fr 1fr 1.5fr 1fr 1fr', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    <div>#</div>
                    <div>Candidate</div>
                    <div>Overall Fit</div>
                    <div>Skill Components</div>
                    <div>Status</div>
                    <div style={{ textAlign: 'right' }}>Actions</div>
                </div>

                {applications.map((app, index) => (
                    <div key={app.id} style={{
                        padding: '1.5rem',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        display: 'grid',
                        gridTemplateColumns: '50px 2fr 1fr 1.5fr 1fr 1fr',
                        gap: '1rem',
                        alignItems: 'center',
                        background: app.isRecommended ? 'rgba(102, 252, 241, 0.03)' : 'transparent'
                    }}>
                        <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {index + 1}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {app.applicant.name}
                                {app.isRecommended && (
                                    <span style={{ fontSize: '0.65rem', background: 'var(--accent-color)', color: '#0b0c10', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                                        BEST FIT
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {app.applicant.email}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: app.finalScore > 70 ? '#00ff80' : app.finalScore > 40 ? '#ffa500' : '#ff4a4a' }}>
                                {Math.round(app.finalScore)}%
                            </div>
                        </div>
                        <div style={{ fontSize: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span>Resume Match:</span>
                                <span>{Math.round(app.matchScore)}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Certifications:</span>
                                <span>{Math.round(app.certificateScore)}%</span>
                            </div>
                        </div>
                        <div>
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '4px 10px',
                                borderRadius: '100px',
                                background: app.status === 'SELECTED' ? '#00ff8022' : '#ffffff11',
                                color: app.status === 'SELECTED' ? '#00ff80' : 'var(--text-secondary)',
                                border: `1px solid ${app.status === 'SELECTED' ? '#00ff8044' : '#ffffff22'}`
                            }}>
                                {app.status}
                            </span>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {app.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={async () => {
                                            const res = await fetch(`/api/hr/applications/${app.id}/status`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ status: 'SELECTED' })
                                            });
                                            if (res.ok) window.location.reload();
                                        }}
                                        className="btn-primary"
                                        style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#00cc66' }}
                                    >
                                        Shortlist
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const res = await fetch(`/api/hr/applications/${app.id}/status`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ status: 'REJECTED' })
                                            });
                                            if (res.ok) window.location.reload();
                                        }}
                                        className="btn-secondary"
                                        style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#ff4a4a' }}
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => {
                                    console.log("View Profile clicked for applicant:", app);
                                    setSelectedApp(app);
                                }}
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            >
                                View Profile
                            </button>
                        </div>
                    </div>
                ))}

                {applications.length === 0 && (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No applications received yet for this vacancy.
                    </div>
                )}
            </div>

            {selectedApp && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 99999, // Super high z-index to stay above all navbars
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto', padding: '2rem', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                        <button
                            onClick={() => setSelectedApp(null)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                            <XCircle size={24} />
                        </button>

                        <h2 style={{ marginBottom: '0.5rem' }}>{selectedApp.applicant.name}</h2>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{selectedApp.applicant.email}</div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>Application Scores</h3>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span>Overall Fit:</span>
                                        <span style={{ fontWeight: 'bold' }}>{Math.round(selectedApp.finalScore)}%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span>Resume Match:</span>
                                        <span>{Math.round(selectedApp.matchScore)}%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Certificates:</span>
                                        <span>{Math.round(selectedApp.certificateScore)}%</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>Skills Gap</h3>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                                    {(() => {
                                        try {
                                            const gaps = selectedApp.skillGap ? JSON.parse(selectedApp.skillGap) : [];
                                            return gaps.length > 0 ? (
                                                <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                                                    {gaps.map((skill: string, i: number) => (
                                                        <li key={i} style={{ color: '#ff4a4a', marginBottom: '4px' }}>{skill}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span style={{ color: '#00ff80' }}>No significant skill gaps identified.</span>
                                            );
                                        } catch (e) {
                                            return <span style={{ color: '#00ff80' }}>No significant skill gaps identified.</span>;
                                        }
                                    })()}
                                </div>
                            </div>
                        </div>

                        {selectedApp.applicant.profile && (
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>Profile Information</h3>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                                    {selectedApp.applicant.profile.experienceYears !== undefined && (
                                        <div style={{ marginBottom: '0.8rem' }}>
                                            <strong>Experience:</strong> {selectedApp.applicant.profile.experienceYears} Years
                                        </div>
                                    )}
                                    {selectedApp.applicant.profile.skills && (
                                        <div style={{ marginBottom: '0.8rem' }}>
                                            <strong>Skills:</strong> {selectedApp.applicant.profile.skills}
                                        </div>
                                    )}
                                    {selectedApp.applicant.profile.education && (
                                        <div style={{ marginBottom: '0.8rem' }}>
                                            <strong>Education:</strong> {selectedApp.applicant.profile.education}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedApp.applicant.profile?.certificates?.length > 0 && (
                            <div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>Certificates</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {selectedApp.applicant.profile.certificates.map((cert: any) => (
                                        <div key={cert.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Award size={18} color={cert.isVerified ? '#00ff80' : 'var(--text-secondary)'} />
                                                <span>{cert.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({cert.category})</span></span>
                                            </div>
                                            {cert.isVerified ? (
                                                <span style={{ fontSize: '0.75rem', color: '#00ff80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <CheckCircle size={14} /> Verified ({cert.confidenceScore}%)
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending Verification</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
