"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    CheckCircle2, FileText, Clock, TrendingUp,
    Activity, Briefcase, Award, ChevronRight, AlertCircle, Brain, ShieldCheck
} from 'lucide-react';

import { useTranslations, useLocale } from 'next-intl';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default function Dashboard() {
    const t = useTranslations('Dashboard');
    const ts = useTranslations('Stats');
    const th = useTranslations('History');
    const locale = useLocale();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
    const [userProgress, setUserProgress] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch('/api/profile');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    setApplications(data.applications || []);
                    setRecommendedJobs(data.recommendedJobs || []);
                    setUserProgress(data.identityStrength || 0);

                    if (data.user.role === 'HR_USER' || data.user.role === 'ADMIN') {
                        router.push('/dashboard/hr');
                    }
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, [router]);

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: "6rem", textAlign: "center" }}>
                <p style={{ color: "var(--text-secondary)" }}>Loading your dashboard...</p>
            </div>
        );
    }

    const acceptedApps = applications.filter(a => a.status === 'ACCEPTED').length;
    const pendingApps = applications.filter(a => a.status === 'PENDING').length;
    const rejectedApps = applications.filter(a => a.status === 'REJECTED').length;

    const getStatusBadge = (status: string) => {
        if (status === 'ACCEPTED') return { label: '✅ Shortlisted', color: '#00cc66' };
        if (status === 'REJECTED') return { label: '❌ Not Selected', color: '#ff4a4a' };
        return { label: '⏳ Under Review', color: '#ffa500' };
    };

    const getScoreLabel = (score: number) => {
        if (score >= 75) return { label: 'Strong Match', color: '#00cc66' };
        if (score >= 45) return { label: 'Partial Match', color: '#ffa500' };
        return { label: 'Low Match', color: '#ff4a4a' };
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* Welcome */}
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>
                        Welcome back, <span className="title-gradient">{user?.name?.split(' ')[0]}</span> 👋
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        {t('subtitle')}
                    </p>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                    <LocaleSwitcher currentLocale={locale} />
                </div>
            </div>

            {/* Profile incomplete warning */}
            {userProgress < 100 && (
                <div style={{
                    background: 'rgba(255, 165, 0, 0.08)',
                    border: '1px solid rgba(255, 165, 0, 0.2)',
                    borderRadius: '14px',
                    padding: '1.2rem 1.5rem',
                    marginBottom: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <AlertCircle size={20} color="#ffa500" />
                        <div>
                            <p style={{ fontWeight: 600, color: '#ffa500', marginBottom: '2px' }}>Your profile is {userProgress}% complete</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Add your skills, experience, and resume to get noticed by employers.</p>
                        </div>
                    </div>
                    <Link href="/dashboard/profile" className="btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 20px', whiteSpace: 'nowrap' }}>
                        Complete Profile
                    </Link>
                </div>
            )}

            {/* Stats */}
            <div className="dashboard-grid" style={{ marginBottom: '3rem' }}>
                <div className="glass-card stat-card">
                    <span className="stat-label">{ts('applied')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="stat-value">{applications.length}</span>
                        <FileText size={24} color="var(--accent-color)" opacity={0.5} />
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <span className="stat-label">{ts('shortlisted')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="stat-value">{acceptedApps}</span>
                        <CheckCircle2 size={24} color="#00cc66" opacity={0.5} />
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <span className="stat-label">{ts('review')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="stat-value">{pendingApps}</span>
                        <Clock size={24} color="#ffa500" opacity={0.5} />
                    </div>
                </div>
                <div className="glass-card stat-card" style={{ border: '1px solid rgba(102, 252, 241, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-label">{ts('trustScore')}</span>
                        <ShieldCheck size={20} color="var(--accent-color)" />
                    </div>
                    <span className="stat-value">{userProgress}%</span>
                    <span style={{ fontSize: '0.8rem', color: userProgress > 70 ? '#00ff80' : '#ffa500' }}>
                        {userProgress === 100 ? ts('verified') : ts('increase')}
                    </span>
                </div>
                <div className="glass-card stat-card">
                    <span className="stat-label">{ts('notSelected')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="stat-value">{rejectedApps}</span>
                        <TrendingUp size={24} color="#ff4a4a" opacity={0.4} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                {/* Application History */}
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                            <Activity size={18} color="var(--accent-color)" /> {th('title')}
                        </h3>
                        <Link href="/dashboard/jobs" style={{ fontSize: '0.85rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {th('browse')} <ChevronRight size={14} />
                        </Link>
                    </div>

                    {applications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
                            <Briefcase size={32} color="var(--text-secondary)" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>{th('noApps')}</p>
                            <Link href="/dashboard/jobs" className="btn-primary">{th('findJobs')}</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {applications.slice(0, 6).map(app => {
                                const statusBadge = getStatusBadge(app.status);
                                const scoreLabel = getScoreLabel(app.finalScore);
                                return (
                                    <div key={app.id} style={{
                                        padding: '1.2rem',
                                        background: app.isRecommended ? 'rgba(0, 204, 102, 0.03)' : 'rgba(255,255,255,0.02)',
                                        borderRadius: '12px',
                                        border: app.isRecommended ? '1px solid rgba(0, 204, 102, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {app.job.title}
                                                {app.isRecommended && (
                                                    <span style={{ fontSize: '0.65rem', background: '#00cc66', color: '#0b0c10', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                                                        {th('topFit')}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                                                {app.job.company?.name || 'Company'} · Applied {new Date(app.createdAt).toLocaleDateString(locale)}
                                            </div>

                                            {/* Stepper Implementation */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '0.5rem' }}>
                                                {[
                                                    { label: 'Applied', done: true },
                                                    { label: 'ML Scan', done: true },
                                                    { label: 'Review', done: app.status !== 'PENDING' || app.finalScore > 0 },
                                                    { label: 'Result', done: app.status === 'ACCEPTED' || app.status === 'SELECTED' || app.status === 'REJECTED' }
                                                ].map((step, i, arr) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i === arr.length - 1 ? '0' : '1' }}>
                                                        <div style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            background: step.done ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                                                            boxShadow: step.done ? '0 0 10px var(--accent-color)' : 'none'
                                                        }} title={step.label} />
                                                        {i < arr.length - 1 && (
                                                            <div style={{
                                                                height: '1px',
                                                                flex: 1,
                                                                background: step.done ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                                                                margin: '0 4px',
                                                                opacity: 0.3
                                                            }} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                <span>Pipeline Started</span>
                                                <span style={{ color: app.status === 'REJECTED' ? '#ff4a4a' : 'var(--accent-color)' }}>{statusBadge.label}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: scoreLabel.color, marginBottom: '2px' }}>
                                                {Math.round(app.finalScore)}%
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                {th('matchScore')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Recommended Jobs */}
                    <div className="glass-card" style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
                            <TrendingUp size={18} color="var(--accent-color)" /> {t('recommended')}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {recommendedJobs.length > 0 ? (
                                recommendedJobs.map(job => (
                                    <Link
                                        href={`/dashboard/jobs/${job.id}`}
                                        key={job.id}
                                        style={{
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            padding: '0.8rem',
                                            background: 'rgba(102, 252, 241, 0.03)',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'all 0.2s ease',
                                            border: '1px solid transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(102, 252, 241, 0.08)';
                                            e.currentTarget.style.borderColor = 'rgba(102, 252, 241, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(102, 252, 241, 0.03)';
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }}
                                    >
                                        <div>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{job.title}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{job.companyName} · {job.industry}</p>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: job.matchScore > 80 ? '#00cc66' : '#ffa500', fontWeight: 800 }}>{t('match', { score: job.matchScore })}</span>
                                    </Link>
                                ))
                            ) : (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                                    {t('noRecommendations')}
                                </p>
                            )}
                        </div>
                        <Link href="/dashboard/jobs" style={{ display: 'block', textAlign: 'center', fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '1rem', fontWeight: 600 }}>
                            View More Suggestions
                        </Link>
                    </div>

                    {/* Profile tip */}
                    <div className="glass-card" style={{
                        background: userProgress === 100
                            ? 'linear-gradient(135deg, rgba(0, 204, 102, 0.05) 0%, transparent 100%), var(--glass-bg)'
                            : 'linear-gradient(135deg, rgba(102, 252, 241, 0.07) 0%, transparent 100%), var(--glass-bg)',
                        borderColor: userProgress === 100 ? 'rgba(0, 204, 102, 0.2)' : 'var(--glass-border)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                            {userProgress === 100
                                ? <CheckCircle2 size={18} color="#00cc66" />
                                : <AlertCircle size={18} color="var(--accent-color)" />}
                            <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                                {userProgress === 100 ? t('profileComplete') : t('completeProfile')}
                            </h4>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '1.5rem' }}>
                            {userProgress === 100
                                ? t('profileSuccess')
                                : t('profileProgress', { progress: userProgress })}
                        </p>
                        <Link
                            href="/dashboard/profile"
                            className={userProgress === 100 ? "btn-secondary" : "btn-primary"}
                            style={{ width: '100%', display: 'block', textAlign: 'center', fontSize: '0.88rem' }}
                        >
                            {userProgress === 100 ? t('viewProfile') : t('updateProfile')}
                        </Link>
                    </div>

                    {/* Career Intelligence */}
                    <div className="glass-card" style={{
                        background: 'linear-gradient(135deg, rgba(102, 252, 241, 0.05) 0%, transparent 100%), var(--glass-bg)',
                        border: '1px solid rgba(102, 252, 241, 0.1)'
                    }}>
                        <h4 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
                            <Brain size={18} color="var(--accent-color)" /> {t('careerIntelligence')}
                        </h4>
                        {applications.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-color)' }}>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>{t('skillGap')}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                        Based on your application for <strong>{applications[0].job.title}</strong>, we recommend learning:
                                        <span style={{ color: 'var(--accent-color)' }}>
                                            {(() => {
                                                try {
                                                    const gap = applications[0].skillGap;
                                                    if (!gap || gap === '[]') return "your core skills are strong, but keep improving niche specializations.";
                                                    const arr = JSON.parse(gap);
                                                    return Array.isArray(arr) ? arr.join(", ") : gap;
                                                } catch {
                                                    return applications[0].skillGap || "Advanced system design and cloud architecture.";
                                                }
                                            })()}
                                        </span>
                                    </p>
                                </div>
                                <button className="btn-secondary" style={{ width: '100%', fontSize: '0.75rem', padding: '8px' }}>
                                    {t('roadmap')}
                                </button>
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                                {t('noApplications')}
                            </p>
                        )}
                    </div>

                    {/* Achievements */}
                    <div className="glass-card">
                        <h4 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
                            <Award size={18} color="var(--accent-color)" /> My Milestones
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: applications.length >= 1 ? 1 : 0.4 }}>
                                <span style={{ fontSize: '1.4rem' }}>🎯</span>
                                <div>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>First Application</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{applications.length >= 1 ? 'Unlocked!' : 'Apply to your first job'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: acceptedApps >= 1 ? 1 : 0.4 }}>
                                <span style={{ fontSize: '1.4rem' }}>🏆</span>
                                <div>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>First Shortlist</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{acceptedApps >= 1 ? 'Unlocked!' : 'Get shortlisted by an employer'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
