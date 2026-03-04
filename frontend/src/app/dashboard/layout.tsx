"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    Briefcase, UserCircle, LayoutDashboard,
    LogOut, Settings, HelpCircle, ShieldCheck, Bell
} from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('');

    useEffect(() => {
        async function fetchInitialData() {
            try {
                // Check Role & Profile
                const res = await fetch('/api/profile');
                if (res.ok) {
                    const data = await res.json();
                    setRole(data.user.role);
                    setUserName(data.user.name?.split(' ')[0] || '');
                }

                // Fetch Notifications
                const notifRes = await fetch('/api/notifications');
                if (notifRes.ok) {
                    const notifData = await notifRes.json();
                    if (notifData.notifications) setNotifications(notifData.notifications);
                }

            } catch (err) {
                console.error("Failed to fetch initial dashboard data", err);
            }
        }
        fetchInitialData();
    }, []);

    const handleClearNotifications = async () => {
        try {
            await fetch('/api/notifications', { method: 'PUT' });
            setNotifications([]);
            setShowNotifications(false);
        } catch (e) {
            console.error("Failed to clear notifications");
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const isActive = (path: string) => pathname === path || (path !== '/dashboard' && path !== '/dashboard/hr' && pathname.startsWith(path));

    const navLink = (href: string, label: string, icon: React.ReactNode, exact = false) => {
        const active = exact ? pathname === href : isActive(href);
        return (
            <Link href={href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: '12px',
                background: active ? 'rgba(102, 252, 241, 0.08)' : 'transparent',
                color: active ? 'var(--accent-color)' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                border: active ? '1px solid rgba(102, 252, 241, 0.15)' : '1px solid transparent',
                fontWeight: active ? 600 : 400,
                fontSize: '0.93rem'
            }}>
                {icon}
                <span>{label}</span>
            </Link>
        );
    };

    const isHR = role === 'HR_USER' || role === 'ADMIN';

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color-main)' }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                borderRight: '1px solid var(--glass-border)',
                padding: '2rem 1.2rem',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(11, 12, 16, 0.5)',
                backdropFilter: 'blur(24px)',
                position: 'sticky',
                top: 0,
                height: '100vh',
                zIndex: 100
            }}>
                {/* Logo */}
                <div style={{ padding: '0 0.5rem', marginBottom: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.8rem' }} className="nav-logo">Trust<span>Hire</span></h2>
                    {userName && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Welcome, {userName} 👋
                        </p>
                    )}
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 1rem 0.6rem 1rem' }}>Main</p>

                    {navLink(
                        isHR ? '/dashboard/hr' : '/dashboard',
                        'Home',
                        <LayoutDashboard size={18} />,
                        true
                    )}

                    {navLink(
                        '/dashboard/jobs',
                        isHR ? 'Job Postings' : 'Browse Jobs',
                        <Briefcase size={18} />
                    )}

                    {navLink(
                        '/dashboard/profile',
                        'My Profile',
                        <UserCircle size={18} />
                    )}

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '1.8rem 1rem 0.6rem 1rem' }}>More</p>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '11px 16px',
                        borderRadius: '12px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.88rem',
                        opacity: 0.45,
                        cursor: 'not-allowed'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Settings size={18} />
                            <span>Settings</span>
                        </div>
                        <span style={{ fontSize: '0.58rem', border: '1px solid currentColor', padding: '2px 5px', borderRadius: '4px' }}>SOON</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '11px 16px',
                        borderRadius: '12px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.88rem',
                        opacity: 0.45,
                        cursor: 'not-allowed'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <HelpCircle size={18} />
                            <span>Help &amp; Support</span>
                        </div>
                        <span style={{ fontSize: '0.58rem', border: '1px solid currentColor', padding: '2px 5px', borderRadius: '4px' }}>SOON</span>
                    </div>
                </nav>

                {/* Logout */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.2rem' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '11px 16px',
                            borderRadius: '12px',
                            color: 'var(--text-secondary)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.93rem',
                            transition: 'color 0.2s ease'
                        }}
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Page Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
                {/* Top bar */}
                <header style={{
                    padding: '1.2rem 3rem',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '2rem',
                    background: 'rgba(11, 12, 16, 0.2)',
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    zIndex: 200
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <ShieldCheck size={16} color="var(--accent-color)" /> Platform Multi-Factor Trust Active
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div
                            onClick={() => setShowNotifications(!showNotifications)}
                            style={{ cursor: 'pointer', padding: '5px' }}
                        >
                            <Bell size={20} color={showNotifications ? "var(--accent-color)" : "var(--text-secondary)"} />
                            {notifications.length > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '2px',
                                    width: '8px',
                                    height: '8px',
                                    background: '#ff4a4a',
                                    borderRadius: '50%',
                                    border: '2px solid var(--bg-color-main)'
                                }}></span>
                            )}
                        </div>

                        {showNotifications && (
                            <div className="glass-card" style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                width: '320px',
                                marginTop: '1rem',
                                padding: '1rem',
                                zIndex: 1000,
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <h5 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Recent Notifications</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {notifications.length > 0 ? notifications.map(n => (
                                        <div key={n.id} style={{
                                            padding: '0.8rem',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            borderLeft: `3px solid ${n.type === 'success' ? '#00cc66' : 'var(--accent-color)'}`
                                        }}>
                                            <p style={{ color: 'var(--text-primary)', marginBottom: '3px' }}>{n.text}</p>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>{n.time}</p>
                                        </div>
                                    )) : (
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem 0' }}>No new notifications.</p>
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <button className="btn-secondary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.7rem', padding: '6px' }} onClick={handleClearNotifications}>
                                        Clear All
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{userName}</p>
                            <p style={{ fontSize: '0.65rem', color: 'var(--accent-color)', textTransform: 'uppercase' }}>{role?.replace('_', ' ')}</p>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-color)', color: '#0b0c10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            {userName[0]}
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
                    {children}
                </div>
            </main>
        </div >
    );
}
