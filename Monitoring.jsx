import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Clock, User, LogIn, ExternalLink, X } from 'lucide-react';
import { useDevice } from '../hooks/useDevice';
import CONFIG from '../config';

export default function Monitoring() {
    const { token } = useAuth();
    const { isMobile } = useDevice();
    const [activePasses, setActivePasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Report State
    const [reportTarget, setReportTarget] = useState(null); // {student_id, student_name}
    const [reportText, setReportText] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);

    const fetchActive = async () => {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/permissions/active?cb=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setActivePasses(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleEndPass = async (id) => {
        if (!window.confirm('Mark this student as returned and end the pass?')) return;
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/permissions/${id}/end`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchActive();
                alert('Pass ended successfully.');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to end pass');
            }
        } catch (e) {
            console.error(e);
            alert('Error connecting to server');
        }
    };

    const handleReport = async () => {
        if (!reportText.trim()) return alert('Please describe the misconduct.');
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/complaints`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ student_id: reportTarget.id, description: reportText })
            });
            if (res.ok) {
                setShowReportModal(false);
                setReportTarget(null);
                setReportText('');
                alert('Complaint Filed Successfully');
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchActive();
        const interval = setInterval(fetchActive, 15000); // Auto-refresh every 15s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="badge badge-primary" style={{ padding: '0.75rem' }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0 }}>Live Monitoring</h1>
                        <p className="text-muted">Real-time student movements across campus</p>
                    </div>
                </div>
            </header>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>Students Outside Class</h3>
                    <span className="badge badge-neutral">{activePasses.length} Active</span>
                </div>

                {loading ? (
                    <p>Scanning signals...</p>
                ) : activePasses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                        <User size={48} style={{ marginBottom: '1rem' }} />
                        <p>All students are currently in their designated classes.</p>
                    </div>
                ) : isMobile ? (
                    <div className="mobile-list">
                        {activePasses.map(p => {
                            const expiry = new Date(p.valid_until);
                            const minsLeft = Math.max(0, Math.round((expiry - new Date()) / 60000));
                            return (
                                <div key={p.id} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <div style={{ fontWeight: 600 }}>{p.student_name} ({p.roll_no})</div>
                                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{p.class_name}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                        <span>To: <strong style={{ color: 'var(--text-main)' }}>{p.destination}</strong></span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: minsLeft < 5 ? 'var(--error-color)' : 'var(--primary-color)' }}>
                                            <Clock size={14} /> {minsLeft}m
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', marginBottom: '1rem', fontStyle: 'italic', color: 'var(--text-dim)' }}>
                                        "{p.reason}"
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleEndPass(p.id)}>
                                            End Pass
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            style={{ flex: 1, color: 'var(--error-color)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                                            onClick={() => { setReportTarget({ id: p.student_id, name: p.student_name }); setShowReportModal(true); }}
                                        >
                                            Report
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Class</th>
                                    <th>Destination</th>
                                    <th>Reason</th>
                                    <th>Expires In</th>
                                    <th style={{ textAlign: 'center' }}>Control</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activePasses.map(p => {
                                    const expiry = new Date(p.valid_until);
                                    const minsLeft = Math.max(0, Math.round((expiry - new Date()) / 60000));

                                    return (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 600 }}>{p.student_name} ({p.roll_no})</td>
                                            <td><span className="badge badge-neutral">{p.class_name}</span></td>
                                            <td>{p.destination}</td>
                                            <td className="text-muted">{p.reason}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: minsLeft < 5 ? 'var(--error-color)' : 'var(--primary-color)' }}>
                                                    <Clock size={16} />
                                                    {minsLeft}m
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleEndPass(p.id)}>
                                                        End Pass
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--error-color)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                                                        onClick={() => { setReportTarget({ id: p.student_id, name: p.student_name }); setShowReportModal(true); }}
                                                    >
                                                        Report
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Report Misconduct Modal */}
            {showReportModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="card" style={{ width: '450px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--error-color)' }}>Report Misconduct: {reportTarget?.name}</h3>
                            <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Describe Incident</label>
                            <textarea
                                className="input-field"
                                rows="4"
                                style={{ resize: 'none' }}
                                placeholder="Details of catch, location, etc..."
                                value={reportText}
                                onChange={e => setReportText(e.target.value)}
                            />
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowReportModal(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)' }} onClick={handleReport}>Submit Report</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
