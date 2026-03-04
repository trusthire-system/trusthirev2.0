"use client";

import { useEffect, useState } from "react";
import {
    User, Mail, Star, GraduationCap, Briefcase,
    FileUp, CheckCircle2, AlertCircle, ExternalLink,
    Save, CloudUpload, TrendingUp, Phone, MapPin, Clock
} from "lucide-react";

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [identityStrength, setIdentityStrength] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [file, setFile] = useState<File | null>(null);

    // Cert state
    const [certFile, setCertFile] = useState<File | null>(null);
    const [certName, setCertName] = useState("");
    const [certCategory, setCertCategory] = useState("EDUCATION");
    const [uploadingCert, setUploadingCert] = useState(false);

    const [formData, setFormData] = useState({
        skills: "",
        experienceYears: 0,
        education: "",
        phone: "",
        address: ""
    });

    const loadProfileData = async () => {
        try {
            const res = await fetch("/api/profile");
            if (!res.ok) throw new Error("Failed to load profile.");
            const data = await res.json();

            setUser(data.user);
            setProfile(data.profile);
            setIdentityStrength(data.identityStrength || 0);

            if (data.profile) {
                setFormData({
                    skills: data.profile.skills || "",
                    experienceYears: data.profile.experienceYears || 0,
                    education: data.profile.education || "",
                    phone: data.profile.phone || "",
                    address: data.profile.address || ""
                });
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfileData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess("Your profile has been updated successfully.");
            loadProfileData();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setError("");
        setSuccess("");

        const fileData = new FormData();
        fileData.append("resume", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: fileData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Dynamically update form with extracted data if available
            if (data.extractedData) {
                setFormData(prev => ({
                    ...prev,
                    skills: data.extractedData.skills || prev.skills,
                    experienceYears: data.extractedData.experienceYears || prev.experienceYears,
                    education: data.extractedData.education || prev.education,
                    phone: data.extractedData.phone || prev.phone,
                    address: data.extractedData.address || prev.address
                }));
            }

            setSuccess("Your resume has been uploaded. Details detected from your resume have been populated.");
            loadProfileData(); // Reload for identity strength and timestamp
            setFile(null);
            setTimeout(() => setSuccess(""), 5000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCertUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!certFile || !certName || !certCategory) return;

        setUploadingCert(true);
        setError("");
        setSuccess("");

        const fileData = new FormData();
        fileData.append("certificate", certFile);
        fileData.append("name", certName);
        fileData.append("category", certCategory);

        try {
            const res = await fetch("/api/certificates", {
                method: "POST",
                body: fileData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess("Certificate uploaded securely. AI Verification processed.");
            setCertFile(null);
            setCertName("");
            loadProfileData();
            setTimeout(() => setSuccess(""), 5000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploadingCert(false);
        }
    };

    if (loading) return (
        <div style={{ padding: '6rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading your profile...</p>
        </div>
    );

    if (!user) return <div>Could not load profile. Please try refreshing.</div>;

    const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const profileStrengthLabel =
        identityStrength === 100 ? "Complete" :
            identityStrength >= 60 ? "Good – almost there!" :
                identityStrength >= 30 ? "Getting started..." :
                    "Incomplete – add more details";

    const profileStrengthColor =
        identityStrength === 100 ? '#00cc66' :
            identityStrength >= 60 ? '#66fcf1' :
                identityStrength >= 30 ? '#ffa500' :
                    '#ff4a4a';

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ marginBottom: "0.5rem" }}>
                    My <span className="title-gradient">Profile</span>
                </h1>
                <p style={{ color: "var(--text-secondary)" }}>
                    Keep your profile complete so employers can find the best match for you.
                </p>
            </div>

            {/* Profile Completeness Meter */}
            <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <TrendingUp size={18} color={profileStrengthColor} />
                        <span style={{ fontWeight: 600 }}>Profile Completeness</span>
                    </div>
                    <span style={{ color: profileStrengthColor, fontWeight: 700, fontSize: '1rem' }}>{identityStrength}% — {profileStrengthLabel}</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${identityStrength}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${profileStrengthColor}88, ${profileStrengthColor})`,
                        transition: 'width 1s ease-in-out',
                        borderRadius: '100px'
                    }} />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.75rem' }}>
                    {identityStrength < 100
                        ? "💡 Tip: Fill in all sections below including a resume to improve your chances of getting hired."
                        : "✅ Your profile is complete! Employers can now see the best version of you."}
                </p>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(255, 74, 74, 0.1)',
                    color: '#ff4a4a',
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid rgba(255, 74, 74, 0.2)'
                }}>
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            {success && (
                <div style={{
                    background: 'rgba(0, 204, 102, 0.1)',
                    color: '#00cc66',
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid rgba(0, 204, 102, 0.2)'
                }}>
                    <CheckCircle2 size={20} /> {success}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
                {/* Left Column: Photo + Resume */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
                        <div style={{
                            width: '90px',
                            height: '90px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))',
                            margin: '0 auto 1.5rem auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 30px rgba(102, 252, 241, 0.25)'
                        }}>
                            <User size={44} color="var(--bg-color-main)" />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{user.name}</h2>
                        <p style={{ color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.2rem' }}>
                            {user.role === 'CANDIDATE' ? 'Job Seeker' : 'HR Professional'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            <Mail size={14} /> {user.email}
                        </div>
                    </div>

                    {/* Resume Upload Card */}
                    <div className="glass-card">
                        <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileUp size={18} color="var(--accent-color)" /> Your Resume
                        </h4>

                        {profile?.resumeUrl ? (
                            <div style={{
                                background: 'rgba(0, 204, 102, 0.05)',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(0, 204, 102, 0.15)',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.8rem' }}>
                                    <CheckCircle2 size={16} color="#00cc66" />
                                    <span style={{ fontSize: '0.9rem', color: '#00cc66', fontWeight: 600 }}>Resume Uploaded</span>
                                </div>
                                {profile.resumeLastUploadedAt && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '1rem' }}>
                                        <Clock size={12} />
                                        <span>Last Uploaded: {new Date(profile.resumeLastUploadedAt).toLocaleString()}</span>
                                    </div>
                                )}
                                <a
                                    href={profile.resumeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: 'var(--accent-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                    View Your Resume <ExternalLink size={14} />
                                </a>
                            </div>
                        ) : (
                            <div style={{
                                padding: '1.5rem',
                                border: '1px dashed var(--glass-border)',
                                borderRadius: '12px',
                                textAlign: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No resume uploaded yet.</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Uploading a resume helps employers find you.</p>
                            </div>
                        )}

                        {/* Dynamic Extraction Summary */}
                        {profile?.resumeUrl && (
                            <div style={{
                                background: 'rgba(102, 252, 241, 0.03)',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(102, 252, 241, 0.1)',
                                marginBottom: '1.5rem',
                                fontSize: '0.85rem'
                            }}>
                                <p style={{ fontWeight: 600, color: 'var(--accent-color)', marginBottom: '0.8rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    AI Resume Insights
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Detected Phone:</span>
                                        <span style={{ color: profile.phone ? 'var(--text-primary)' : '#ff4a4a' }}>{profile.phone || 'Missing'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Detected Location:</span>
                                        <span style={{ color: profile.address ? 'var(--text-primary)' : '#ff4a4a' }}>{profile.address || 'Missing'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Exp. Found:</span>
                                        <span style={{ color: 'var(--text-primary)' }}>{profile.experienceYears} Years</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleFileUpload}>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setFile(e.target.files[0]);
                                    }
                                }}
                                style={{ display: 'none' }}
                                id="resume-upload"
                            />
                            <label
                                htmlFor="resume-upload"
                                className="btn-secondary"
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    marginBottom: '1rem'
                                }}
                            >
                                <CloudUpload size={18} /> Choose File (PDF / Word)
                            </label>
                            {file && (
                                <p style={{ fontSize: '0.78rem', textAlign: 'center', marginBottom: '1rem', color: 'var(--accent-color)' }}>
                                    Selected: {file.name}
                                </p>
                            )}
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={!file || uploading}
                                style={{ width: '100%' }}
                            >
                                {uploading ? "Uploading..." : "Upload Resume"}
                            </button>
                        </form>
                    </div>

                    {/* Certificates Upload Card */}
                    <div className="glass-card">
                        <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <GraduationCap size={18} color="var(--accent-color)" /> Certificates
                        </h4>

                        {profile?.certificates && profile.certificates.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                {profile.certificates.map((cert: any) => (
                                    <div key={cert.id} style={{
                                        background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cert.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', padding: '2px 8px', background: 'rgba(102,252,241,0.1)', borderRadius: '100px' }}>{cert.category}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {cert.isVerified ? <CheckCircle2 size={14} color="#00cc66" /> : <AlertCircle size={14} color="#ff4a4a" />}
                                                <span style={{ color: cert.isVerified ? '#00cc66' : '#ff4a4a' }}>
                                                    {cert.isVerified ? `Verified (Score: ${cert.confidenceScore})` : `Not Verified (Score: ${cert.confidenceScore})`}
                                                </span>
                                            </div>
                                            <a href={cert.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)' }}>View <ExternalLink size={12} /></a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '1rem', border: '1px dashed var(--glass-border)', borderRadius: '12px', textAlign: 'center', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No certificates added.</p>
                            </div>
                        )}

                        <form onSubmit={handleCertUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input type="text" className="form-input" placeholder="Certificate Name" value={certName} onChange={e => setCertName(e.target.value)} required />
                            <select className="form-input" value={certCategory} onChange={e => setCertCategory(e.target.value)} required>
                                <option value="EDUCATION">Schooling & College</option>
                                <option value="COURSE">Course or Bootcamps</option>
                                <option value="ACHIEVEMENT">Other Achievements</option>
                            </select>
                            <input type="file" accept=".pdf" onChange={e => setCertFile(e.target.files?.[0] || null)} style={{ display: 'none' }} id="cert-upload" />
                            <label htmlFor="cert-upload" className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                                <CloudUpload size={18} /> {certFile ? certFile.name : "Choose File (PDF)"}
                            </label>
                            <button type="submit" className="btn-primary" disabled={!certFile || !certName || uploadingCert} style={{ width: '100%' }}>
                                {uploadingCert ? "Uploading & Verifying..." : "Upload & Verify"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Profile Details Form */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Save size={20} color="var(--accent-color)" /> Your Career Details
                    </h3>

                    {user.role === 'CANDIDATE' ? (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
                                    <Star size={16} /> Skills
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 400 }}>— separate each skill with a comma</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.skills}
                                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                    placeholder="e.g. Communication, Excel, Python, Design..."
                                    style={{ marginBottom: '1rem' }}
                                />
                                {skillsArray.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {skillsArray.map(skill => (
                                            <span key={skill} style={{
                                                padding: '4px 14px',
                                                background: 'rgba(102, 252, 241, 0.08)',
                                                color: 'var(--accent-color)',
                                                borderRadius: '100px',
                                                fontSize: '0.78rem',
                                                border: '1px solid rgba(102, 252, 241, 0.2)'
                                            }}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Briefcase size={16} /> Years of Work Experience
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            className="form-input"
                                            value={formData.experienceYears}
                                            onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                                            style={{ paddingRight: '4.5rem' }}
                                        />
                                        <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>years</span>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <GraduationCap size={16} /> Highest Qualification
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.education}
                                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                        placeholder="e.g. Bachelor's in Commerce"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Phone size={16} /> Contact Phone
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="e.g. +91 98765 43210"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MapPin size={16} /> Residential Address
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="e.g. Mumbai, Maharashtra"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={saving}
                                style={{ marginTop: "1rem", width: '100%', padding: '16px', fontSize: '1rem' }}
                            >
                                {saving ? "Saving..." : "Save Profile"}
                            </button>
                        </form>
                    ) : (
                        <div style={{
                            padding: '3rem',
                            textAlign: 'center',
                            background: 'rgba(0,0,0,0.1)',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <p style={{ color: "var(--accent-color)", fontWeight: 600 }}>Employer Account</p>
                            <p style={{ color: "var(--text-secondary)", fontSize: '0.9rem', marginTop: '1rem' }}>
                                This area is for job seekers. As an employer, you can manage your job posts from the Opportunities section.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
