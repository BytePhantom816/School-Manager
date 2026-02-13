import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Search, ShieldAlert, CheckCircle, XCircle, Clock, Activity, FileWarning, User, MapPin, Send, AlertTriangle, X } from 'lucide-react';
import CONFIG from '../config';
import StudentSelection from '../components/StudentSelection';
import Monitoring from './Monitoring';

export default function RoamingDashboard() {
    const { user, logout, token } = useAuth();
    const [activeTab, setActiveTab] = useState('security');
    const [verificationMethod, setVerificationMethod] = useState('id'); // 'id' or 'lookup'
    const [studentIdInput, setStudentIdInput] = useState('');
    const [lookupResult, setLookupResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Complaint Modal State
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [complaintDescription, setComplaintDescription] = useState('');
    const [submittingComplaint, setSubmittingComplaint] = useState(false);

    const handleLookup = async () => {
        if (!studentIdInput.trim()) return;
        setLoading(true);
        setLookupResult(null);
        setError('');
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/students/lookup/${studentIdInput}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setLookupResult(data);
            } else {
                const errData = await res.json();
                setError(errData.error || 'Student not found');
            }
        } catch (err) {
            console.error(err);
            setError('Error verifying student');
        } finally {
            setLoading(false);
        }
    };

    const handleFileComplaint = async () => {
        if (!complaintDescription.trim()) return;
        setSubmittingComplaint(true);
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/complaints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    student_id: lookupResult.student.id,
                    description: complaintDescription
                })
            });

            if (res.ok) {
                alert('Complaint filed successfully');
                setShowComplaintModal(false);
                setComplaintDescription('');
            } else {
                alert('Failed to file complaint');
            }
        } catch (err) {
            console.error(err);
            alert('Error filing complaint');
        } finally {
            setSubmittingComplaint(false);
        }
    };

    return (
        <div style={{ padding: 'var(--spacing-2xl)', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-3xl)'
            }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 var(--spacing-xs)' }}>
                        Roaming Dashboard
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                        {user.full_name} • Security & Monitoring
                    </p>
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={logout}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
                <button
                    className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('security')}
                >
                    <ShieldAlert size={20} style={{ marginRight: '8px' }} />
                    Security Check
                </button>
                <button
                    className={`btn ${activeTab === 'monitoring' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('monitoring')}
                >
                    <Activity size={20} style={{ marginRight: '8px' }} />
                    Live Monitoring
                </button>
            </div>

            {/* Content */}
            {activeTab === 'security' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-xl)' }}>

                    {/* Search Section */}
                    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>Quick Verification</h2>
                        <div className="input-group">
                            <label className="input-label">Enter Student ID Number</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input
                                    type="text"
                                    className={`input-field ${error ? 'input-error' : ''}`}
                                    placeholder="e.g. ST1A001"
                                    value={studentIdInput}
                                    onChange={(e) => {
                                        setStudentIdInput(e.target.value.toUpperCase());
                                        setError('');
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={handleLookup}
                                    disabled={loading || !studentIdInput}
                                >
                                    {loading ? 'Checking...' : 'Check Status'}
                                </button>
                            </div>
                            {error && <div className="error-message"><AlertTriangle size={14} /> {error}</div>}
                        </div>
                    </div>

                    {/* Result Card */}
                    {lookupResult && (
                        <div className="card animate-in" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                            <div style={{ display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
                                {/* Student Info */}
                                <div style={{ flex: '1', minWidth: '250px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                                        <div style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'var(--glass-bg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden'
                                        }}>
                                            {lookupResult.student.photo_url ? (
                                                <img src={lookupResult.student.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={32} color="var(--text-dim)" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0 }}>{lookupResult.student.name}</h3>
                                            <p style={{ margin: 0 }}>{lookupResult.student.class_name} • Roll: {lookupResult.student.roll_no}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--text-main)' }}>
                                            <ShieldAlert size={18} color="var(--primary-color)" />
                                            <span>ID: {lookupResult.student.student_id_number}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                            <MapPin size={18} color="var(--text-muted)" />
                                            <span>House: {lookupResult.student.house}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Permission Status */}
                                <div style={{
                                    flex: '1',
                                    minWidth: '250px',
                                    padding: 'var(--spacing-lg)',
                                    borderRadius: 'var(--radius-lg)',
                                    background: lookupResult.hasPermission ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    border: `1px solid ${lookupResult.hasPermission ? 'var(--primary-color)' : 'var(--error-color)'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                                        {lookupResult.hasPermission ? (
                                            <CheckCircle size={32} color="var(--primary-color)" />
                                        ) : (
                                            <XCircle size={32} color="var(--error-color)" />
                                        )}
                                        <div>
                                            <h4 style={{ margin: 0, color: lookupResult.hasPermission ? 'var(--primary-color)' : 'var(--error-color)' }}>
                                                {lookupResult.hasPermission ? 'AUTHORIZED' : 'NOT PERMITTED'}
                                            </h4>
                                            <p style={{ margin: 0, fontSize: '0.875rem' }}>
                                                {lookupResult.hasPermission ? 'Active pass found' : 'No active pass found'}
                                            </p>
                                        </div>
                                    </div>

                                    {lookupResult.hasPermission && (
                                        <div style={{ fontSize: '0.9rem' }}>
                                            <div style={{ marginBottom: 'var(--spacing-xs)' }}><strong>Going to:</strong> {lookupResult.permission.destination}</div>
                                            <div style={{ marginBottom: 'var(--spacing-xs)' }}><strong>Reason:</strong> {lookupResult.permission.reason}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                                                <Clock size={14} />
                                                Until: {new Date(lookupResult.permission.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    )}

                                    {!lookupResult.hasPermission && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            style={{ marginTop: 'var(--spacing-md)', color: 'var(--error-color)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                            onClick={() => setShowComplaintModal(true)}
                                        >
                                            <FileWarning size={16} />
                                            File Complaint
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Toggle */}
                    <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
                        <button
                            className="btn btn-ghost"
                            onClick={() => setVerificationMethod(verificationMethod === 'id' ? 'lookup' : 'id')}
                        >
                            {verificationMethod === 'id' ? 'Or lookup by class...' : 'Back to ID lookup'}
                        </button>
                    </div>

                    {verificationMethod === 'lookup' && (
                        <div className="animate-in">
                            <StudentSelection />
                        </div>
                    )}
                </div>
            ) : (
                <Monitoring />
            )}

            {/* Complaint Modal */}
            {showComplaintModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    padding: 'var(--spacing-md)'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <FileWarning size={20} color="var(--error-color)" />
                                File Complaint
                            </h3>
                            <button onClick={() => setShowComplaintModal(false)} className="btn btn-icon btn-ghost">
                                <X size={20} />
                            </button>
                        </div>

                        <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-lg)' }}>
                            Reporting student: <strong>{lookupResult?.student?.name}</strong>
                        </p>

                        <div className="input-group">
                            <label className="input-label">Description (In your own words)</label>
                            <textarea
                                className="textarea-field"
                                placeholder="Describe the incident or reason for complaint..."
                                value={complaintDescription}
                                onChange={(e) => setComplaintDescription(e.target.value)}
                                style={{ minHeight: '150px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowComplaintModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 2, background: 'var(--error-color)' }}
                                onClick={handleFileComplaint}
                                disabled={submittingComplaint || !complaintDescription.trim()}
                            >
                                <Send size={18} />
                                {submittingComplaint ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
