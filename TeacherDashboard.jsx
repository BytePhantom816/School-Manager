import React, { useState, useEffect, useCallback, memo } from 'react';
import { useLocation } from 'react-router-dom';
import CONFIG from '../config';
import { useAuth } from '../context/AuthContext';
import { LogOut, Search, ShieldCheck, Clock, Users, FileText, Plus, FileWarning, CheckCircle, User, MapPin } from 'lucide-react';
import { useDevice } from '../hooks/useDevice';
import StudentSelection from '../components/StudentSelection';
import StudentManager from '../components/StudentManager';
import ComplaintList from '../components/ComplaintList';
import PassModal from '../components/PassModal';

// Memoized components for better performance
const StatsCard = memo(({ title, value, icon: Icon, color }) => (
    <div className="card" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
        <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--spacing-md)'
        }}>
            <Icon size={24} color="white" />
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 var(--spacing-xs)' }}>{value}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{title}</p>
    </div>
));

StatsCard.displayName = 'StatsCard';

const TabButton = memo(({ active, onClick, icon: Icon, label }) => (
    <button
        className={`btn ${active ? 'btn-primary' : 'btn-ghost'}`}
        onClick={onClick}
        style={{
            width: '100%',
            justifyContent: 'flex-start',
            background: active ? undefined : 'transparent'
        }}
    >
        <Icon size={20} />
        {label}
    </button>
));

TabButton.displayName = 'TabButton';

export default function TeacherDashboard() {
    const { user, logout, token } = useAuth();
    const { isMobile } = useDevice();
    const location = useLocation();
    // Default to 'my-class' only if assigned, otherwise 'security-check'
    const [activeTab, setActiveTab] = useState(user?.assigned_class_id ? 'my-class' : 'security-check');

    // Sync tab with URL path
    useEffect(() => {
        if (!user) return;
        const path = location.pathname;
        if (path === '/teacher/security-check') {
            setActiveTab('security-check');
        } else if (path === '/teacher') {
            setActiveTab(user.assigned_class_id ? 'my-class' : 'security-check');
        }
    }, [location.pathname, user?.assigned_class_id, user]);

    // Stats state
    const [stats, setStats] = useState({
        totalStudents: 0,
        activePermissions: 0,
        pendingComplaints: 0,
        todayIssued: 0
    });

    // Loading states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch dashboard stats
    const fetchStats = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            setError('');

            // Parallel API calls for better performance
            const [studentsRes, permissionsRes, complaintsRes] = await Promise.all([
                fetch(`${CONFIG.API_BASE_URL}/students/class/${user.assigned_class_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${CONFIG.API_BASE_URL}/permissions`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${CONFIG.API_BASE_URL}/complaints`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const [students, permissions, complaints] = await Promise.all([
                studentsRes.ok ? studentsRes.json() : [],
                permissionsRes.ok ? permissionsRes.json() : [],
                complaintsRes.ok ? complaintsRes.json() : []
            ]);

            // Calculate today's permissions
            const today = new Date().toDateString();
            const todayPermissions = permissions.filter(p =>
                new Date(p.created_at).toDateString() === today
            ).length;

            setStats({
                totalStudents: students.length,
                activePermissions: permissions.filter(p => p.status === 'ACTIVE').length,
                pendingComplaints: complaints.filter(c => c.status === 'PENDING').length,
                todayIssued: todayPermissions
            });

        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, user.assigned_class_id]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // ID Lookup & Complaint State
    const [studentIdInput, setStudentIdInput] = useState('');
    const [lookupResult, setLookupResult] = useState(null);
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [complaintDescription, setComplaintDescription] = useState('');
    const [submittingComplaint, setSubmittingComplaint] = useState(false);

    // Pass Issuance State
    const [passModal, setPassModal] = useState(false);
    const [passData, setPassData] = useState({
        student_id: null,
        student_name: '',
        reason: '',
        destination: '',
        duration_minutes: 15
    });

    const handleIssuePass = async () => {
        console.log('DEBUG: handleIssuePass called with:', passData);
        try {
            const body = JSON.stringify({
                student_id: passData.student_id,
                reason: passData.reason,
                destination: passData.destination,
                duration_minutes: passData.duration_minutes,
                type: 'STANDARD'
            });
            console.log('DEBUG: Sending body:', body);

            const res = await fetch(`${CONFIG.API_BASE_URL}/permissions/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: body
            });

            console.log('DEBUG: Response status:', res.status);

            if (res.ok) {
                const data = await res.json();
                console.log('DEBUG: Success response:', data);
                setPassModal(false);
                alert(`Pass issued for ${passData.student_name}.`);
                fetchStats(); // Refresh stats
                setLookupResult(null); // Clear lookup
                setStudentIdInput('');
            } else {
                const data = await res.json();
                console.error('DEBUG: Error response:', data);
                alert(data.error || 'Failed to issue pass');
            }
        } catch (err) {
            console.error('DEBUG: Network error:', err);
            alert('Network error: ' + err.message);
        }
    };

    const handleIdLookup = async () => {
        if (!studentIdInput.trim()) return;
        setLoadingStatus(true);
        setLookupResult(null);
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/students/lookup/${studentIdInput}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setLookupResult(await res.json());
            } else {
                alert('Student not found');
            }
        } catch (err) {
            console.error(err);
            alert('Error lookup student');
        } finally {
            setLoadingStatus(false);
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
                fetchStats(); // Update stats count
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

    const handleStudentSelect = useCallback((student) => {
        console.log('Selected student for pass:', student);
        setPassData({
            student_id: student.id,
            student_name: student.name,
            reason: '',
            destination: '',
            duration_minutes: 15
        });
        setPassModal(true);
    }, []);

    if (!user) return null;

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                flexDirection: 'column',
                gap: 'var(--spacing-md)'
            }}>
                <div className="animate-spin" style={{
                    width: '48px',
                    height: '48px',
                    border: '3px solid var(--border-color)',
                    borderTop: '3px solid var(--primary-color)',
                    borderRadius: '50%'
                }} />
                <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
            </div>
        );
    }

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
                        Welcome back, {user?.full_name}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                        {user.assigned_class_id ? `Class Teacher (${user.role})` : 'Staff Member'} Dashboard
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

            {/* Error Display */}
            {error && (
                <div style={{
                    padding: 'var(--spacing-md)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--error-color)',
                    marginBottom: 'var(--spacing-xl)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)'
                }}>
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-3xl)'
            }}>
                <StatsCard
                    title="Total Students"
                    value={stats.totalStudents}
                    icon={Users}
                    color="var(--primary-color)"
                />
                <StatsCard
                    title="Active Permissions"
                    value={stats.activePermissions}
                    icon={ShieldCheck}
                    color="var(--info-color)"
                />
                <StatsCard
                    title="Pending Complaints"
                    value={stats.pendingComplaints}
                    icon={FileText}
                    color="var(--warning-color)"
                />
                <StatsCard
                    title="Issued Today"
                    value={stats.todayIssued}
                    icon={Clock}
                    color="var(--accent-color)"
                />
            </div>

            {/* Main Content */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '250px 1fr',
                gap: 'var(--spacing-2xl)'
            }}>
                {/* Sidebar Navigation */}
                {!isMobile && (
                    <div style={{ position: 'sticky', top: 'var(--spacing-xl)' }}>
                        <h3 style={{
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--text-muted)',
                            marginBottom: 'var(--spacing-md)',
                            fontWeight: '700'
                        }}>
                            Quick Actions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {user.assigned_class_id && (
                                <TabButton
                                    active={activeTab === 'my-class'}
                                    onClick={() => setActiveTab('my-class')}
                                    icon={Users}
                                    label="My Class"
                                />
                            )}
                            <TabButton
                                active={activeTab === 'security-check'}
                                onClick={() => setActiveTab('security-check')}
                                icon={ShieldCheck}
                                label="Security Check"
                            />
                            <TabButton
                                active={activeTab === 'search'}
                                onClick={() => setActiveTab('search')}
                                icon={Search}
                                label="Global Search"
                            />
                            <TabButton
                                active={activeTab === 'complaints'}
                                onClick={() => setActiveTab('complaints')}
                                icon={FileWarning}
                                label="Complaints"
                            />
                        </div>
                    </div>
                )}

                {/* Mobile Tab Selector (if needed, but we have bottom nav. However, these are sub-tabs) */}
                {isMobile && (
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        {user.assigned_class_id && (
                            <button
                                className={`btn ${activeTab === 'my-class' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setActiveTab('my-class')}
                                style={{ flexShrink: 0 }}
                            >
                                <Users size={16} /> My Class
                            </button>
                        )}
                        <button
                            className={`btn ${activeTab === 'security-check' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('security-check')}
                            style={{ flexShrink: 0 }}
                        >
                            <ShieldCheck size={16} /> Security
                        </button>
                        <button
                            className={`btn ${activeTab === 'search' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('search')}
                            style={{ flexShrink: 0 }}
                        >
                            <Search size={16} /> Search
                        </button>
                        <button
                            className={`btn ${activeTab === 'complaints' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('complaints')}
                            style={{ flexShrink: 0 }}
                        >
                            <FileWarning size={16} /> Complaints
                        </button>
                    </div>
                )}

                {/* Main Content Area */}
                <div>
                    {activeTab === 'my-class' && (
                        <div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                marginBottom: 'var(--spacing-xl)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)'
                            }}>
                                <Users size={24} color="var(--primary-color)" />
                                My Class Management
                            </h2>
                            <StudentManager />
                        </div>
                    )}

                    {activeTab === 'security-check' && (
                        <div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                marginBottom: 'var(--spacing-xl)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)'
                            }}>
                                <ShieldCheck size={24} color="var(--primary-color)" />
                                Student Security Check
                            </h2>

                            <div className="card" style={{ maxWidth: '600px', margin: '0 0 var(--spacing-xl)' }}>
                                <div className="input-group">
                                    <label className="input-label">Quick Verify by Student ID</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. ST1A001"
                                            value={studentIdInput}
                                            onChange={(e) => setStudentIdInput(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => e.key === 'Enter' && handleIdLookup()}
                                        />
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleIdLookup}
                                            disabled={loadingStatus}
                                        >
                                            {loadingStatus ? 'Checking...' : 'Check Status'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {lookupResult && (
                                <div className="card animate-in" style={{ marginBottom: 'var(--spacing-xl)' }}>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
                                        <div style={{ flex: '1', minWidth: '250px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                                                <div style={{
                                                    width: '64px', height: '64px', borderRadius: 'var(--radius-lg)',
                                                    background: 'var(--glass-bg)', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', overflow: 'hidden'
                                                }}>
                                                    {lookupResult.student.photo_url ? (
                                                        <img src={lookupResult.student.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <Users size={32} color="var(--text-dim)" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: 0 }}>{lookupResult.student.name}</h3>
                                                    <p style={{ margin: 0 }}>{lookupResult.student.class_name} • Roll: {lookupResult.student.roll_no}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            flex: '1', minWidth: '250px', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)',
                                            background: lookupResult.hasPermission ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            border: `1px solid ${lookupResult.hasPermission ? 'var(--primary-color)' : 'var(--error-color)'}`,
                                            display: 'flex', flexDirection: 'column', justifyContent: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: '12px' }}>
                                                {lookupResult.hasPermission ? <CheckCircle size={32} color="var(--primary-color)" /> : <FileWarning size={32} color="var(--error-color)" />}
                                                <div>
                                                    <h4 style={{ margin: 0, color: lookupResult.hasPermission ? 'var(--primary-color)' : 'var(--error-color)' }}>
                                                        {lookupResult.hasPermission ? 'AUTHORIZED' : 'NOT PERMITTED'}
                                                    </h4>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: lookupResult.hasPermission ? 'var(--primary-color)' : 'var(--error-color)', opacity: 0.8 }}>
                                                        {lookupResult.hasPermission ? 'Validated Status' : 'No active pass found'}
                                                    </p>
                                                </div>
                                            </div>

                                            {lookupResult.hasPermission && (
                                                <div style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                        <User size={16} color="var(--text-muted)" />
                                                        <span>Issued by: <strong>{lookupResult.permission.issuer_name || 'Unknown'}</strong></span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <MapPin size={16} color="var(--text-muted)" />
                                                        <span>Going to: <strong>{lookupResult.permission.destination || 'Unspecified'}</strong></span>
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {!lookupResult.hasPermission && (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => {
                                                            // Logic to open pass modal (we'll need to ensure PassModal is available here)
                                                            setPassData({
                                                                student_id: lookupResult.student.id,
                                                                student_name: lookupResult.student.name,
                                                                reason: '',
                                                                destination: '',
                                                                duration_minutes: 15
                                                            });
                                                            setPassModal(true);
                                                        }}
                                                        style={{ flex: 1 }}
                                                    >
                                                        <Clock size={16} /> Issue Pass
                                                    </button>
                                                )}
                                                {!lookupResult.hasPermission && (
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        style={{ color: 'var(--error-color)', flex: 1 }}
                                                        onClick={() => setShowComplaintModal(true)}
                                                    >
                                                        <FileWarning size={16} /> File Complaint
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}


                        </div>
                    )}

                    {activeTab === 'search' && (
                        <div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                marginBottom: 'var(--spacing-xl)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)'
                            }}>
                                <Search size={24} color="var(--primary-color)" />
                                Global Student Search
                            </h2>
                            <StudentSelection onStudentSelect={handleStudentSelect} allowGlobalSearch={true} />
                        </div>
                    )}

                    {activeTab === 'complaints' && (
                        <div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                marginBottom: 'var(--spacing-xl)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)'
                            }}>
                                <FileWarning size={24} color="var(--primary-color)" />
                                Student Complaints
                            </h2>
                            <ComplaintList />
                        </div>
                    )}
                </div>
            </div>

            {/* Complaint Modal */}
            {showComplaintModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 100, padding: 'var(--spacing-md)'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <FileWarning size={20} color="var(--error-color)" />
                                File Complaint
                            </h3>
                            <button onClick={() => setShowComplaintModal(false)} className="btn btn-icon btn-ghost">
                                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
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
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PassModal
                isOpen={passModal}
                onClose={() => setPassModal(false)}
                passData={passData}
                setPassData={setPassData}
                onIssue={handleIssuePass}
            />
        </div>
    );
}