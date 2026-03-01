"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    Briefcase, Users, Star, CheckCircle,
    TrendingUp, Plus, ArrowRight, BarChart3 as BarChartIcon
} from 'lucide-react';

const COLORS = ['#66fcf1', '#45a29e', '#1f2833', '#c5c6c7'];

export default function HRDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/hr/stats');
                if (res.ok) {
                    const d = await res.json();
                    setData(d);
                }
            } catch (err) {
                console.error("Failed to fetch HR stats", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: "6rem", textAlign: "center" }}>
                <p>Loading Your Insights...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="container" style={{ paddingTop: "6rem", textAlign: "center" }}>
                <h2>Something went wrong.</h2>
                <Link href="/dashboard" className="btn-secondary" style={{ marginTop: "1rem", display: "inline-block" }}>
                    Go Back
                </Link>
            </div>
        );
    }

    const { stats, charts, recentJobs } = data;

    return (
        <div className="container" style={{ paddingBottom: "6rem" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: "0.5rem" }}>Recruitment <span className="title-gradient">Overview</span></h1>
                    <p style={{ color: "var(--text-secondary)" }}>Managing your company's hiring pipeline and candidate analytics.</p>
                </div>
                <Link href="/dashboard/jobs/create" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> Post a Vacancy
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="dashboard-grid">
                <div className="glass-card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-label">Active Vacancies</span>
                        <Briefcase size={20} color="var(--accent-color)" />
                    </div>
                    <span className="stat-value">{stats.totalJobs}</span>
                    <span style={{ fontSize: '0.8rem', color: '#00ff80' }}>Currently hiring</span>
                </div>
                <div className="glass-card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-label">Total Applicants</span>
                        <Users size={20} color="var(--accent-color)" />
                    </div>
                    <span className="stat-value">{stats.totalApplications}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Resumes received</span>
                </div>
                <div className="glass-card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-label">Strong Matches</span>
                        <Star size={20} color="var(--accent-color)" />
                    </div>
                    <span className="stat-value">{stats.avgScore}%</span>
                    <span style={{ fontSize: '0.8rem', color: '#ffa500' }}>Overall fit score</span>
                </div>
                <div className="glass-card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="stat-label">Hired / Selected</span>
                        <CheckCircle size={20} color="var(--accent-color)" />
                    </div>
                    <span className="stat-value">{stats.acceptedCount}</span>
                    <span style={{ fontSize: '0.8rem', color: '#00ff80' }}>Candidates selected</span>
                </div>
            </div>

            {/* Charts Section */}
            <div className="chart-grid">
                {/* 7 Day Trend */}
                <div className="glass-card chart-card">
                    <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <TrendingUp size={18} color="var(--accent-color)" />
                        Application Velocity
                    </h4>
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={charts.trends}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#1f2833', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                                itemStyle={{ color: 'var(--accent-color)' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Match Categories */}
                <div className="glass-card chart-card">
                    <h4 style={{ marginBottom: '1.5rem' }}>Automated Match Quality</h4>
                    <ResponsiveContainer width="100%" height="85%">
                        <PieChart>
                            <Pie
                                data={charts.matchDistribution}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {charts.matchDistribution.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#1f2833', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '-20px' }}>
                        {charts.matchDistribution.map((entry: any, index: number) => (
                            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Campaign Volume Bar Chart */}
            <div className="glass-card" style={{ marginBottom: '2.5rem', height: '350px' }}>
                <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BarChartIcon size={18} color="var(--accent-color)" />
                    Top Campaigns by Volume
                </h4>
                <ResponsiveContainer width="100%" height="85%">
                    <RechartsBarChart data={charts.campaignVolume}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ background: '#1f2833', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                            cursor={{ fill: 'rgba(102, 252, 241, 0.05)' }}
                        />
                        <Bar dataKey="count" fill="var(--accent-color)" radius={[4, 4, 0, 0]} barSize={40} />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>

            {/* Recent Jobs List */}
            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Active Recruiting Campaigns</h3>
                    <Link href="/dashboard/jobs" style={{ fontSize: '0.9rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        View All <ArrowRight size={14} />
                    </Link>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <th style={{ padding: '1rem 0', borderBottom: '1px solid var(--glass-border)' }}>Position</th>
                                <th style={{ padding: '1rem 0', borderBottom: '1px solid var(--glass-border)' }}>Applicants</th>
                                <th style={{ padding: '1rem 0', borderBottom: '1px solid var(--glass-border)' }}>Posted On</th>
                                <th style={{ padding: '1rem 0', borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentJobs.map((job: any) => (
                                <tr key={job.id} style={{ transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ fontWeight: '600' }}>{job.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{job.company?.name || 'Your Company'}</div>
                                    </td>
                                    <td style={{ padding: '1.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="badge badge-success">{job._count?.applications || 0}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>candidates</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        {new Date(job.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', textAlign: 'right' }}>
                                        <Link href={`/dashboard/hr/${job.id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                            Review Pipeline
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
