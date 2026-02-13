import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trash2, UserPlus, Shield, Plus, Eye, EyeOff, Edit, X } from 'lucide-react';
import { useDevice } from '../../hooks/useDevice';
import CONFIG from '../../config';

export default function HeadStaff() {
    const { token, impersonate } = useAuth();
    const { isMobile } = useDevice();
    const [users, setUsers] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);

    // New User Form
    const [newUser, setNewUser] = useState({
        full_name: '', username: '', password: '', role: 'CLASS_TEACHER'
    });

    // Edit User Form
    const [editUser, setEditUser] = useState(null);
    const [newEditPassword, setNewEditPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch(`${CONFIG.API_BASE_URL}/admin/users?cb=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setUsers(await res.json());
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newUser)
            });
            const data = await res.json();
            if (res.ok) {
                alert('Staff Account Created');
                setShowAddModal(false);
                setShowPassword(false);
                await fetchUsers();
                setNewUser({ full_name: '', username: '', password: '', role: 'CLASS_TEACHER' });
            } else {
                alert(data.error);
            }
        } catch (e) { alert('Error creating user'); }
    };

    const handleEditClick = (user) => {
        setEditUser({ ...user });
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
            const data = await res.json();
            if (res.ok) {
                alert('Staff Updated Successfully');
                setShowEditModal(false);
                setEditUser(null);
                setNewEditPassword('');
                await fetchUsers();
            } else {
                alert(data.error);
            }
        } catch (e) { alert('Error updating user'); }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure? This will delete the account.')) return;
        const res = await fetch(`${CONFIG.API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            await fetchUsers();
            alert('Staff deleted.');
        } else alert('Failed to delete');
    };

    return (
        <div className="container" style={{ padding: '1rem 0' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Staff Management</h1>
                    <p className="text-muted">Mastermind Operations • {users.length} Active Accounts</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <UserPlus size={20} /> Add Staff Account
                </button>
            </header>

            <div className="card">
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span className={`badge ${u.role === 'HEAD' ? 'badge-primary' : u.role === 'ADMIN' ? 'badge-success' : u.assigned_class_id ? 'badge-primary' : 'badge-neutral'}`}>
                                        {u.role === 'HEAD' ? 'MASTERMIND' :
                                            u.role === 'ADMIN' ? 'ADMIN' :
                                                u.assigned_class_id ? 'CLASS TEACHER' : (u.role === 'CLASS_TEACHER' ? 'TEACHER' : u.role)}
                                    </span>
                                    {u.role !== 'HEAD' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleEditClick(u)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className="btn btn-secondary btn-sm btn-icon" style={{ color: 'var(--error-color)' }} onClick={() => handleDeleteUser(u.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.2rem' }}>{u.full_name}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>@{u.username}</div>

                                {u.role !== 'HEAD' && (
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => impersonate(u.id)}
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        <Eye size={16} /> Preview View
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="staff-table">
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
                                            <span className={`badge ${u.role === 'HEAD' ? 'badge-primary' : u.role === 'ADMIN' ? 'badge-success' : u.assigned_class_id ? 'badge-primary' : 'badge-neutral'}`}>
                                                {u.role === 'HEAD' ? 'MASTERMIND' :
                                                    u.role === 'ADMIN' ? 'ADMIN' :
                                                        u.assigned_class_id ? 'CLASS TEACHER' : (u.role === 'CLASS_TEACHER' ? 'TEACHER' : u.role)}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                                        <td className="text-muted">{u.username}</td>
                                        <td style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                            {u.role !== 'HEAD' && (
                                                <>
                                                    <button className="btn btn-secondary" onClick={() => impersonate(u.id)} style={{ padding: '0.5rem 1rem' }}>
                                                        <Eye size={18} /> Preview
                                                    </button>
                                                    <button className="btn btn-secondary" onClick={() => handleEditClick(u)} style={{ padding: '0.5rem 1rem' }}>
                                                        <Edit size={18} /> Edit
                                                    </button>
                                                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', color: 'var(--error-color)' }} onClick={() => handleDeleteUser(u.id)}>
                                                        <Trash2 size={18} /> Delete
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Staff Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
                        <h3>Add New Staff Member</h3>
                        <form onSubmit={handleAddUser}>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input className="input-field" value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} required autoComplete="off" />
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
                                        type={showPassword ? 'text' : 'password'}
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        required
                                        style={{ paddingRight: '3rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-muted)',
                                            padding: '0.25rem',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Role</label>
                                <select className="input-field" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                    <option value="CLASS_TEACHER">Teacher</option>
                                    <option value="ROAMING_TEACHER">Roaming Teacher</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); setShowPassword(false); }}>
                                    <X size={18} /> Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">Create Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Staff Modal */}
            {showEditModal && editUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
                        <h3>Edit Staff Member</h3>
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
                                    <option value="CLASS_TEACHER">Teacher</option>
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
                                        placeholder="Enter new password"
                                        style={{ paddingRight: '3rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEditPassword(!showEditPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-muted)',
                                            padding: '0.25rem',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {showEditPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setEditUser(null); setNewEditPassword(''); }}>
                                    <X size={18} /> Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">Update Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
