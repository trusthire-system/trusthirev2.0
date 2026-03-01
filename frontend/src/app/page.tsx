"use client";

import Link from 'next/link';
import { Briefcase, Brain, Users, ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [partnerCount, setPartnerCount] = useState<number>(0);
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Fetch dynamic platform stats
    async function loadLandingData() {
      try {
        const res = await fetch("/api/landing");
        if (res.ok) {
          const data = await res.json();
          setPartnerCount(data.count || 0);
          setPartners(data.companies || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadLandingData();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: 'var(--bg-color-main)', minHeight: '100vh' }}>
      {/* Premium Navigation */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: scrolled ? 'rgba(11, 12, 16, 0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--glass-border)' : '1px solid transparent',
        transition: 'all 0.4s ease'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 2rem' }}>
          <div className="nav-logo" style={{ fontSize: '1.8rem' }}>Trust<span>Hire</span></div>
          <div className="nav-links" style={{ gap: '2.5rem' }}>
            <Link href="/dashboard/jobs" style={{ fontSize: '0.95rem' }}>Opportunities</Link>
            <Link href="/login" className="btn-secondary" style={{ padding: '10px 24px', fontSize: '0.9rem', border: 'none', color: 'var(--text-secondary)' }}>Log In</Link>
            <Link href="/register" className="btn-primary" style={{ padding: '10px 28px', fontSize: '0.9rem' }}>Join Now</Link>
          </div>
        </div>
      </header>

      <main style={{ paddingTop: '8rem' }}>
        {/* Animated Hero Section */}
        <section className="container hero" style={{ padding: '4rem 0 8rem 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(102, 252, 241, 0.1)',
            padding: '8px 16px',
            borderRadius: '100px',
            color: 'var(--accent-color)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '2rem',
            border: '1px solid rgba(102, 252, 241, 0.2)'
          }}>
            <Zap size={14} fill="currentColor" /> Next-Gen AI Recruitment
          </div>
          <h1 style={{ fontSize: '5rem', marginBottom: '2rem' }}>
            The Intelligent <br />
            <span className="title-gradient">Hiring Pipeline</span>
          </h1>
          <p style={{ maxWidth: '700px', fontSize: '1.4rem', lineHeight: '1.5', marginBottom: '4rem' }}>
            Transforming recruitment with deep ML match analysis and OCR resume intelligence.
            Find the perfect fit in seconds, not weeks.
          </p>
          <div className="hero-btns" style={{ gap: '2rem' }}>
            <Link href="/register" className="btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Start Hiring Now <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="container" style={{ marginBottom: '10rem' }}>
          <div className="features">
            <div className="glass-card" style={{ padding: '3rem' }}>
              <div style={{ background: 'rgba(102, 252, 241, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Briefcase color="var(--accent-color)" size={28} />
              </div>
              <div className="feature-title" style={{ fontSize: '1.5rem' }}>Neural OCR Parse</div>
              <div className="feature-desc" style={{ fontSize: '1.05rem' }}>
                Our deep-learning OCR engine extracts skills, education, and career trajectories from complex PDF/DOCX layouts with 99.2% accuracy.
              </div>
            </div>

            <div className="glass-card" style={{ padding: '3rem' }}>
              <div style={{ background: 'rgba(102, 252, 241, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Brain color="var(--accent-color)" size={28} />
              </div>
              <div className="feature-title" style={{ fontSize: '1.5rem' }}>ML Talent Scoring</div>
              <div className="feature-desc" style={{ fontSize: '1.05rem' }}>
                Instant candidate ranking using weight-adjusted ML scoring. Match technical requirements against parsed experience in real-time.
              </div>
            </div>

            <div className="glass-card" style={{ padding: '3rem' }}>
              <div style={{ background: 'rgba(102, 252, 241, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Users color="var(--accent-color)" size={28} />
              </div>
              <div className="feature-title" style={{ fontSize: '1.5rem' }}>Smart Segregation</div>
              <div className="feature-desc" style={{ fontSize: '1.05rem' }}>
                Automated pipeline management. Candidates are instantly categorized into High-Match buckets, reducing time-to-interview by 70%.
              </div>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section style={{ background: 'rgba(255,255,255,0.02)', padding: '5rem 0', borderTop: '1px solid var(--glass-border)' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '3rem' }}>
              Empowering Recruitment at Global Scales
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', opacity: 0.5, flexWrap: 'wrap' }}>
              {partners.length > 0 ? partners.map((p, i) => (
                <span key={i} style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase' }}>{p.name}</span>
              )) : (
                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>TRUSTHIRE PLATFORM</span>
              )}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="container" style={{ padding: '10rem 0' }}>
          <div className="glass-card" style={{
            textAlign: 'center',
            padding: '5rem',
            background: 'radial-gradient(circle at top right, rgba(102, 252, 241, 0.15), transparent), var(--glass-bg)'
          }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Ready to Scale Your Team?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '3rem' }}>
              Join {partnerCount > 0 ? partnerCount : 'innovative'} companies using TrustHire to find their next high-performers.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
              <Link href="/register" className="btn-primary" style={{ padding: '16px 40px' }}>Create Your Account</Link>
              <Link href="/hr" className="btn-secondary" style={{ padding: '16px 40px' }}>Contact Enterprise</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="container" style={{ padding: '4rem 0', borderTop: '1px solid var(--glass-border)', color: 'var(--text-secondary)', textAlign: 'center' }}>
        <p>&copy; 2026 TrustHire AI Intelligence. All rights reserved.</p>
      </footer>
    </div>
  );
}
