import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserPlus, X, Plus, School, Trash2 } from 'lucide-react';
import CONFIG from '../../config';

export default function HeadClasses() {
    const { token } = useAuth();
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [newClassName, setNewClassName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchClasses();
        fetchTeachers();
    }, []);

    const fetchClasses = async () => {
        const res = await fetch(`${CONFIG.API_BASE_URL}/admin/classes?cb=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const sorted = data.sort((a, b) => {
                const [numA] = a.name.split('-');
                const [numB] = b.name.split('-');
                return (parseInt(numA) - parseInt(numB)) || a.name.localeCompare(b.name);
            });
            setClasses(sorted);
        }
    };

    const fetchTeachers = async () => {
        const res = await fetch(`${CONFIG.API_BASE_URL}/admin/users?cb=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setTeachers(data.filter(u => u.role === 'CLASS_TEACHER'));
        }
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
                setShowAddModal(false);
                alert('Class Created Successfully');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create class');
            }
        } catch (e) { console.error(e); }
    };

    const handleAssignClick = (e, cls) => {
        e.stopPropagation();
        setSelectedClass(cls);
        const existing = teachers.find(t => t.full_name === cls.teacher_name);
        setSelectedTeacherId(existing ? existing.id : '');
        setShowAssignModal(true);
    };

    const confirmAssignment = async () => {
        if (!selectedTeacherId) return alert('Select a teacher');
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/admin/classes/${selectedClass.id}/assign`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ teacher_id: selectedTeacherId })
            });
            if (res.ok) {
                alert('Teacher assigned successfully');
                setShowAssignModal(false);
                await fetchClasses();
            } else {
                const d = await res.json();
                alert(d.error);
            }
        } catch (e) { alert('Error assigning teacher'); }
    };
    const handleDeleteClass = async (e, classId) => {
        e.stopPropagation();
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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>All Classes</h1>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={20} /> Add New Class
                </button>
            </div>

            <div className="class-grid">
                {classes.map(cls => (
                    <div key={cls.id} className="class-card" onClick={() => navigate(`/head/class/${cls.id}`)} style={{ position: 'relative' }}>
                        <h3>{cls.name}</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            {cls.teacher_name ? `Tr. ${cls.teacher_name}` : 'Unassigned'}
                        </p>
                        <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={(e) => handleAssignClick(e, cls)}
                            >
                                <UserPlus size={14} /> Assign
                            </button>
                            <button
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem', color: 'var(--error-color)', display: 'flex', alignItems: 'center' }}
                                onClick={(e) => handleDeleteClass(e, cls.id)}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="card" style={{ width: '450px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Create New Class</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateClass}>
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
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Class</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAssignModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="card" style={{ width: '450px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Assign Staff: {selectedClass?.name}</h3>
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
                                {teachers.map(u => (
                                    <option key={u.id} value={u.id}>{u.full_name} ({u.username})</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAssignModal(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmAssignment}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
