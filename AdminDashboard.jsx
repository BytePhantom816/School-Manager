import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Users, School, UserPlus, Eye, EyeOff, Edit, X, Trash2, Activity, FileWarning } from 'lucide-react';
import CONFIG from '../config';
import Monitoring from './Monitoring';
import ComplaintList from '../components/ComplaintList';
import { useDevice } from '../hooks/useDevice';

export default function AdminDashboard() {
    const { user, logout, token, impersonate } = useAuth();
    const { isMobile } = useDevice();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [newClassName, setNewClassName] = useState('');

    // New User Form State
    const [newUser, setNewUser] = useState({ fullName: '', username: '', password: '', role: 'CLASS_TEACHER' });
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Edit User state
    const [editUser, setEditUser] = useState(null);
    const [newEditPassword, setNewEditPassword] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);

    // Assignment State
    const [assignmentTarget, setAssignmentTarget] = useState(null); // {classId, className}
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchClasses();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/admin/users?cb=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setUsers(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchClasses = async () => {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/admin/classes?cb=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setClasses(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    full_name: newUser.fullName,
                    username: newUser.username,
                    password: newUser.password,
                    role: newUser.role
                })
            });
            if (res.ok) {
                await fetchUsers();
                setNewUser({ fullName: '', username: '', password: '', role: 'CLASS_TEACHER' });
                setShowNewPassword(false);
                alert('User Created');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create user');
            }
        } catch (e) { console.error(e); }
    };

    const handleEditClick = (u) => {
        setEditUser({ ...u });
        setNewEditPassword('');
        setShowEditPassword(false);
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const updateData = {
                full_name: editUser.full_name,
                username: editUser.username,
                role: editUser.role
            };

            if (newEditPassword) {
                updateData.password = newEditPassword;
            }

            const res = await fetch(`${CONFIG.API_BASE_URL}/admin/users/${editUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(updateData)
            });
            if (res.ok) {
                await fetchUsers();
                setShowEditModal(false);
                setEditUser(null);
                setNewEditPassword('');
                alert('User Updated');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update user');
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteClick = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this staff member? This action is permanent.')) return;
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchUsers();
                alert('Staff member removed.');
            } else {
                alert('Failed to delete staff member.');
            }
        } catch (e) { console.error(e); alert('Error deleting user.'); }
    };

    const handleAssignClick = (c) => {
        setAssignmentTarget({ id: c.id, name: c.name });
        // Find existing teacher if any
        const existing = users.find(u => u.full_name === c.teacher_name);
        setSelectedTeacherId(existing ? existing.id : '');
        setShowAssignModal(true);
    };

    const handleAssignTeacher = async () => {
        if (!selectedTeacherId) return alert('Please select a teacher');
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/admin/classes/${assignmentTarget.id}/assign`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ teacher_id: selectedTeacherId })
            });
            if (res.ok) {
                await fetchClasses();
                await fetchUsers();
                setShowAssignModal(false);
                setAssignmentTarget(null);
                alert('Teacher Assigned Successfully');
            }
        } catch (e) { console.error(e); }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/admin/classes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newClassName })
            });
            if (res.ok) {
                await fetchClasses();
                setNewClassName('');
                alert('Class Created Successfully');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create class');
            }
        } catch (e) { console.error(e); }
    };
    const handleDeleteClass = async (classId) => {
        if (!window.confirm('Are you sure you want to delete this class? This will also remove the assignment for any teacher associated with it.')) return;
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/admin/classes/${classId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchClasses();
                alert('Class Deleted successfully');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete class');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting class');
        }
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Mastermind Dashboard</h1>
                    <p className="text-muted">Global Operations Control</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span className="badge badge-neutral">{user?.full_name}</span>
                    <button className="btn btn-secondary" onClick={() => window.confirm('Are you sure you want to log out?') && logout()}><LogOut size={18} /> Logout</button>
                </div>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('users')}>
                    <Users size={18} style={{ marginRight: '8px' }} /> Teachers & Staff
                </button>
                <button className={`btn ${activeTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('classes')}>
                    <School size={18} style={{ marginRight: '8px' }} /> Classes
                </button>
                <button className={`btn ${activeTab === 'complaints' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('complaints')}>
                    <FileWarning size={18} style={{ marginRight: '8px' }} /> Complaints
                </button>
                <button className={`btn ${activeTab === 'monitoring' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('monitoring')}>
                    <Activity size={18} style={{ marginRight: '8px' }} /> Live Monitoring
                </button>
            </div>

            {activeTab === 'monitoring' && <Monitoring />}
            {activeTab === 'complaints' && <ComplaintList />}

            {activeTab === 'users' && (
                <div className="grid-2-cols">
                    <div className="card">
                        <h3>Staff Directory</h3>
                        {isMobile ? (
                            <div className="mobile-list">
                                {users.map(u => (
                                    <div key={u.id} style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '1rem',
                                        marginBottom: '0.75rem',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{u.full_name}</div>
                                                <div className="text-muted" style={{ fontSize: '0.85rem' }}>{u.username}</div>
                                            </div>
                                            <span className={`badge ${u.role === 'ADMIN' ? 'badge-success' : u.role === 'ROAMING_TEACHER' ? 'badge-neutral' : u.assigned_class_id ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                                                {u.role === 'ADMIN' ? 'ADMIN' :
                                                    u.role === 'ROAMING_TEACHER' ? 'ROAMING' :
                                                        u.assigned_class_id ? 'CLASS TEACHER' : (u.role === 'CLASS_TEACHER' ? 'TEACHER' : 'STAFF')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => impersonate(u.id)} style={{ flex: 1 }}>
                                                <Eye size={14} /> View
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(u)} style={{ flex: 1 }}>
                                                <Edit size={14} /> Edit
                                            </button>
                                            <button className="btn btn-secondary btn-sm" style={{ flex: 1, color: 'var(--error-color)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => handleDeleteClick(u.id)}>
                                                <Trash2 size={14} /> Del
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Role</th>
                                            <th>Name</th>
                                            <th>Username</th>
                                            <th style={{ textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td>
                                                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-success' : u.role === 'ROAMING_TEACHER' ? 'badge-neutral' : u.assigned_class_id ? 'badge-primary' : 'badge-neutral'}`}>
                                                        {u.role === 'ADMIN' ? 'ADMIN' :
                                                            u.role === 'ROAMING_TEACHER' ? 'ROAMING TEACHER' :
                                                                u.assigned_class_id ? 'CLASS TEACHER' : (u.role === 'CLASS_TEACHER' ? 'TEACHER' : 'STAFF MEMBER')}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                                                <td className="text-muted">{u.username}</td>
                                                <td style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                                    <button className="btn btn-secondary" onClick={() => impersonate(u.id)} style={{ padding: '0.5rem 1rem' }}>
                                                        <Eye size={18} /> Preview
                                                    </button>
                                                    <button className="btn btn-secondary" onClick={() => handleEditClick(u)} style={{ padding: '0.5rem 1rem' }}>
                                                        <Edit size={18} /> Edit
                                                    </button>
                                                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', color: 'var(--error-color)' }} onClick={() => handleDeleteClick(u.id)}>
                                                        <Trash2 size={18} /> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h3><UserPlus size={20} style={{ marginRight: '8px' }} /> Add New Staff</h3>
                        <form onSubmit={handleCreateUser} style={{ marginTop: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input className="input-field" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} required autoComplete="off" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Username</label>
                                <input className="input-field" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} required autoComplete="new-password" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input-field"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        required
                                        style={{ paddingRight: '2.5rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '0.5rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            opacity: 0.6,
                                            display: 'flex',
                                            padding: '4px'
                                        }}
                                    >
                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Role</label>
                                <select className="input-field" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                    <option value="CLASS_TEACHER">Class Teacher</option>
                                    <option value="ROAMING_TEACHER">Roaming Teacher</option>
                                    {user.role === 'HEAD' && <option value="ADMIN">Admin</option>}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create User</button>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'classes' && (
                <div className="grid-2-cols">
                    <div className="card">
                        <h3>All Classes</h3>

                        {isMobile ? (
                            <div className="mobile-list">
                                {classes.map(c => (
                                    <div key={c.id} style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '1rem',
                                        marginBottom: '0.75rem',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <div style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '1.1rem' }}>{c.name}</div>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                {c.teacher_name ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Users size={12} /> {c.teacher_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted italic">Unassigned</span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => navigate(`/admin/class/${c.id}`)}
                                                style={{ flex: 1 }}
                                            >
                                                <Users size={14} /> Students
                                            </button>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleAssignClick(c)}
                                                style={{ flex: 1 }}
                                            >
                                                Assign
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                style={{ color: 'var(--error-color)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                                onClick={() => handleDeleteClass(c.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Class Name</th>
                                            <th>Assigned Teacher</th>
                                            <th style={{ textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classes.map(c => (
                                            <tr key={c.id}>
                                                <td style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{c.name}</td>
                                                <td>{c.teacher_name || <span className="text-muted italic">Unassigned</span>}</td>
                                                <td style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => navigate(`/admin/class/${c.id}`)}
                                                    >
                                                        <Users size={18} /> Students
                                                    </button>
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                        onClick={() => handleAssignClick(c)}
                                                    >
                                                        Assign Staff
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.5rem', color: 'var(--error-color)' }}
                                                        onClick={() => handleDeleteClass(c.id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h3>Create New Class</h3>
                        <form onSubmit={handleCreateClass} style={{ marginTop: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Class/Section Name</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. 10-A or Prep-B"
                                    value={newClassName}
                                    onChange={e => setNewClassName(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                <School size={18} style={{ marginRight: '8px' }} /> Create Class
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Edit Staff Details</h3>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser}>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input className="input-field" value={editUser.full_name} onChange={e => setEditUser({ ...editUser, full_name: e.target.value })} required autoComplete="off" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Username</label>
                                <input className="input-field" value={editUser.username} onChange={e => setEditUser({ ...editUser, username: e.target.value })} required autoComplete="new-password" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Role</label>
                                <select className="input-field" value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                                    <option value="CLASS_TEACHER">Class Teacher</option>
                                    <option value="ROAMING_TEACHER">Roaming Teacher</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">New Password (leave blank to keep current)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input-field"
                                        type={showEditPassword ? 'text' : 'password'}
                                        value={newEditPassword}
                                        onChange={e => setNewEditPassword(e.target.value)}
                                        style={{ paddingRight: '2.5rem' }}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEditPassword(!showEditPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '0.5rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            opacity: 0.6,
                                            display: 'flex'
                                        }}
                                    >
                                        {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update Staff</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Teacher Modal */}
            {showAssignModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="card" style={{ width: '450px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Assign Staff: {assignmentTarget?.name}</h3>
                            <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Select Staff Member</label>
                            <select
                                className="input-field"
                                value={selectedTeacherId}
                                onChange={e => setSelectedTeacherId(e.target.value)}
                            >
                                <option value="">Select Teacher...</option>
                                {users.filter(u => u.role === 'CLASS_TEACHER').map(u => (
                                    <option key={u.id} value={u.id}>{u.full_name} ({u.username})</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAssignModal(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAssignTeacher}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
