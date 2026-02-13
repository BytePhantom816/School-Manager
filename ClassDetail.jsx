import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, User, Trash2 } from 'lucide-react';
import { useDevice } from '../../hooks/useDevice';
import CONFIG from '../../config';

export default function ClassDetail() {
    const { id } = useParams();
    const { isMobile } = useDevice();
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [classData, setClassData] = useState(null);
    const [students, setStudents] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editStudent, setEditStudent] = useState(null);

    // Add Student Form
    const [newStudent, setNewStudent] = useState({
        name: '', roll_no: '', gr_no: '', house: 'NONE', contact_number: '', photo_url: '', imageFile: null
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, [id]);

    const fetchStudents = async () => {
        const res = await fetch(`${CONFIG.API_BASE_URL}/admin/classes/${id}/students?cb=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setStudents(data.students);
            setClassData(data.classInfo);
        }
    };

    const handleDeleteStudent = async (studentId) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/students/${studentId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchStudents();
                alert('Student deleted.');
            } else {
                alert('Failed to delete');
            }
        } catch (e) { alert('Error deleting'); }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let photo_url = '';

            // Handle File Upload if selected
            if (newStudent.imageFile) {
                const formData = new FormData();
                formData.append('photo', newStudent.imageFile);
                const uploadRes = await fetch(`${CONFIG.API_BASE_URL}/students/upload`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    photo_url = uploadData.photo_url;
                }
            }

            const res = await fetch(`${CONFIG.API_BASE_URL}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...newStudent, photo_url, class_section_id: id })
            });
            if (res.ok) {
                await fetchStudents();
                setShowAddModal(false);
                setNewStudent({ name: '', roll_no: '', gr_no: '', house: 'NONE', contact_number: '', photo_url: '', imageFile: null });
                alert('Student Added');
            } else {
                const d = await res.json();
                alert(d.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error adding student');
        } finally {
            setUploading(false);
        }
    };

    const handleEditClick = (student) => {
        setEditStudent({ ...student });
        setShowEditModal(true);
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let photo_url = editStudent.photo_url;

            // Handle File Upload if selected
            if (editStudent.imageFile) {
                const formData = new FormData();
                formData.append('photo', editStudent.imageFile);
                const uploadRes = await fetch(`${CONFIG.API_BASE_URL}/students/upload`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    photo_url = uploadData.photo_url;
                }
            }

            const res = await fetch(`${CONFIG.API_BASE_URL}/students/${editStudent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...editStudent, photo_url })
            });
            if (res.ok) {
                await fetchStudents();
                setShowEditModal(false);
                setEditStudent(null);
                alert('Student Updated');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update student');
            }
        } catch (e) {
            console.error(e);
            alert('Error updating student');
        } finally {
            setUploading(false);
        }
    };

    if (!classData) return <div className="p-4">Loading...</div>;

    return (
        <div style={{ padding: isMobile ? '0' : 'var(--spacing-md)' }}>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <button
                    onClick={() => navigate(user.role === 'ADMIN' ? '/admin' : '/head/classes')}
                    className="btn btn-secondary"
                    style={{ width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
                >
                    <ArrowLeft size={16} style={{ marginRight: 8 }} /> Back to Classes
                </button>
            </div>

            <header style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: 'var(--spacing-xl)',
                gap: 'var(--spacing-md)'
            }}>
                <div>
                    <h1 style={{ margin: 0 }}>Class {classData.name}</h1>
                    <p className="text-muted" style={{ margin: 0 }}>Teacher: {classData.teacher_name || 'Unassigned'}</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                    style={{ width: isMobile ? '100%' : 'auto' }}
                >
                    <Plus size={18} style={{ marginRight: 8 }} /> Add Student
                </button>
            </header>

            <div className={isMobile ? "" : "card"} style={{ padding: isMobile ? '0' : undefined }}>
                <table className={isMobile ? "responsive-table" : ""} style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ display: isMobile ? 'none' : 'table-header-group' }}>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                            <th className="p-2">Photo</th>
                            <th>Roll</th>
                            <th>Name</th>
                            <th>GR No</th>
                            <th>House</th>
                            <th>Contact</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody style={{ display: isMobile ? 'flex' : 'table-row-group', flexDirection: 'column', gap: '1rem' }}>
                        {students.map(s => (
                            <tr key={s.id} style={{
                                borderBottom: isMobile ? 'none' : '1px solid var(--border-color)',
                                display: isMobile ? 'grid' : 'table-row',
                                gridTemplateColumns: isMobile ? '1fr 1fr' : undefined,
                                gap: isMobile ? 'var(--spacing-sm)' : undefined,
                                padding: isMobile ? 'var(--spacing-md)' : undefined,
                                background: isMobile ? 'var(--card-bg)' : 'transparent',
                                borderRadius: isMobile ? 'var(--radius-lg)' : '0',
                                border: isMobile ? '1px solid var(--border-color)' : 'none'
                            }}>
                                <td data-label="Photo" style={{ border: 'none' }}>
                                    {s.photo_url ? (
                                        <img
                                            src={s.photo_url.startsWith('http') ? s.photo_url : `${CONFIG.API_BASE_URL}${s.photo_url}`}
                                            alt={s.name}
                                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={20} className="text-muted" />
                                        </div>
                                    )}
                                </td>
                                <td data-label="Roll" style={{ border: 'none', fontWeight: 'bold' }}>{s.roll_no}</td>
                                <td data-label="Name" className="full-width" style={{ border: 'none', fontSize: '1rem', fontWeight: 'bold' }}>{s.name}</td>
                                <td data-label="GR No" style={{ border: 'none' }}>{s.gr_no}</td>
                                <td data-label="House" style={{ border: 'none' }}>
                                    <span className="badge badge-neutral" style={{ color: s.house !== 'NONE' ? s.house : 'inherit' }}>{s.house}</span>
                                </td>
                                <td data-label="Contact" className="full-width" style={{ border: 'none' }}>{s.contact_number}</td>
                                <td data-label="Actions" className="full-width" style={{ border: 'none', marginTop: 'var(--spacing-sm)' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleEditClick(s)}>
                                            <Edit size={16} /> Edit
                                        </button>
                                        <button className="btn btn-secondary" style={{ flex: 1, color: 'var(--error-color)' }} onClick={() => handleDeleteStudent(s.id)}>
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-muted">No students in this class yet.</td></tr>}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
                        <h3>Add New Student</h3>
                        <form onSubmit={handleAddStudent}>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input className="input-field" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Roll No</label>
                                    <input className="input-field" value={newStudent.roll_no} onChange={e => setNewStudent({ ...newStudent, roll_no: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">GR No</label>
                                    <input className="input-field" value={newStudent.gr_no} onChange={e => setNewStudent({ ...newStudent, gr_no: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">House</label>
                                <select className="input-field" value={newStudent.house} onChange={e => setNewStudent({ ...newStudent, house: e.target.value })}>
                                    <option value="NONE">None</option>
                                    <option value="RED">Red</option>
                                    <option value="GREEN">Green</option>
                                    <option value="BLUE">Blue</option>
                                    <option value="YELLOW">Yellow</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Contact Number</label>
                                <input className="input-field" value={newStudent.contact_number} onChange={e => setNewStudent({ ...newStudent, contact_number: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Student Photo</label>
                                <input
                                    type="file"
                                    className="input-field"
                                    accept="image/*"
                                    onChange={e => setNewStudent({ ...newStudent, imageFile: e.target.files[0] })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={uploading}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={uploading}>
                                    {uploading ? 'Adding...' : 'Add Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showEditModal && editStudent && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
                        <h3>Edit Student</h3>
                        <form onSubmit={handleUpdateStudent}>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input className="input-field" value={editStudent.name} onChange={e => setEditStudent({ ...editStudent, name: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Roll No</label>
                                    <input className="input-field" value={editStudent.roll_no} onChange={e => setEditStudent({ ...editStudent, roll_no: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">GR No</label>
                                    <input className="input-field" value={editStudent.gr_no} onChange={e => setEditStudent({ ...editStudent, gr_no: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">House</label>
                                <select className="input-field" value={editStudent.house} onChange={e => setEditStudent({ ...editStudent, house: e.target.value })}>
                                    <option value="NONE">None</option>
                                    <option value="RED">Red</option>
                                    <option value="GREEN">Green</option>
                                    <option value="BLUE">Blue</option>
                                    <option value="YELLOW">Yellow</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Contact Number</label>
                                <input className="input-field" value={editStudent.contact_number} onChange={e => setEditStudent({ ...editStudent, contact_number: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Student Photo</label>
                                {editStudent.photo_url && !editStudent.imageFile && (
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <img src={editStudent.photo_url.startsWith('http') ? editStudent.photo_url : `${CONFIG.API_BASE_URL}${editStudent.photo_url}`} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    className="input-field"
                                    accept="image/*"
                                    onChange={e => setEditStudent({ ...editStudent, imageFile: e.target.files[0] })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={uploading}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={uploading}>
                                    {uploading ? 'Updating...' : 'Update Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
