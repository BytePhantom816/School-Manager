import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Upload, Search, User, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../hooks/useDevice';
import CONFIG from '../config';
import PassModal from './PassModal';

export default function StudentManager() {
    const { token, user } = useAuth();
    if (!user) return null;
    const { isMobile } = useDevice();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        student_id_number: '',
        roll_no: '',
        gr_no: '',
        dob: '',
        house: 'NONE',
        contact_number: '',
        address: '',
        photo_url: '',
        class_section_id: user.assigned_class_id
    });

    // Pass Issuance State
    const [passModal, setPassModal] = useState(false);
    const [passData, setPassData] = useState({
        student_id: null,
        student_name: '',
        reason: '',
        destination: '',
        duration_minutes: 15
    });

    const [uploading, setUploading] = useState(false);

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${CONFIG.API_BASE_URL}/students/class/${user.assigned_class_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setStudents(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, user.assigned_class_id]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const form = new FormData();
        form.append('photo', file);

        setUploading(true);
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/students/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form
            });
            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, photo_url: data.photo_url }));
            }
        } catch (err) {
            alert('Photo upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingStudent
                ? `${CONFIG.API_BASE_URL}/students/${editingStudent.id}`
                : `${CONFIG.API_BASE_URL}/students`;

            const method = editingStudent ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowModal(false);
                setEditingStudent(null);
                setFormData({
                    name: '',
                    student_id_number: '',
                    roll_no: '',
                    gr_no: '',
                    dob: '',
                    house: 'NONE',
                    contact_number: '',
                    address: '',
                    photo_url: '',
                    class_section_id: user?.assigned_class_id
                });
                fetchStudents();
            } else {
                const data = await res.json();
                alert(data.error || 'Operation failed');
            }
        } catch (err) {
            alert('Network error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/students/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchStudents();
            else alert('Failed to delete');
        } catch (err) {
            alert('Network error');
        }
    };

    const openEdit = (student) => {
        setEditingStudent(student);
        setFormData({ ...student });
        setShowModal(true);
    };

    const openPassModal = (student) => {
        setPassData({
            student_id: student.id,
            student_name: student.name,
            reason: '',
            destination: '',
            duration_minutes: 15
        });
        setPassModal(true);
    };

    const handleIssuePass = async () => {
        console.log('DEBUG: StudentManager handleIssuePass called with:', passData);
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

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.student_id_number && s.student_id_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">My Class Students</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {/* Info Badge or similar could go here */}
                    <button className="btn btn-primary" onClick={() => { setEditingStudent(null); setShowModal(true); }}>
                        <Plus size={20} /> Add Student
                    </button>
                </div>
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search by Name, Roll No or Student ID..."
                        style={{ paddingLeft: '3rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isMobile ? (
                <div className="mobile-list">
                    {filteredStudents.map(student => (
                        <div key={student.id} style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1rem',
                            marginBottom: '0.75rem',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                {student.photo_url ? (
                                    <img src={student.photo_url.startsWith('http') ? student.photo_url : `${CONFIG.API_BASE_URL}${student.photo_url}`} alt="" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={24} />
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{student.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Roll: {student.roll_no} | <span className={`badge badge-${student.house?.toLowerCase() || 'neutral'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>{student.house || 'NONE'}</span></div>
                                </div>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => openPassModal(student)}
                                    style={{ padding: '8px 12px', minHeight: '36px' }}
                                >
                                    Issue Pass
                                </button>
                            </div>

                            <div style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-dim)', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div><span style={{ fontSize: '0.7rem', textTransform: 'uppercase', display: 'block' }}>ID Number</span> <strong>{student.student_id_number || 'N/A'}</strong></div>
                                <div><span style={{ fontSize: '0.7rem', textTransform: 'uppercase', display: 'block' }}>Contact</span> <strong>{student.contact_number || 'N/A'}</strong></div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(student)} style={{ flex: 1 }}>
                                    <Edit2 size={16} /> Edit Student
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(student.id)} style={{ flex: 1, color: 'var(--error-color)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Student</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>IDs</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Contact</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>House</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {student.photo_url ? (
                                                <img src={student.photo_url.startsWith('http') ? student.photo_url : `${CONFIG.API_BASE_URL}${student.photo_url}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={20} />
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{student.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.address || 'No Address'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div>ID: {student.student_id_number || 'N/A'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Roll: {student.roll_no} | GR: {student.gr_no}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{student.contact_number || 'N/A'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`badge badge-${student.house?.toLowerCase() || 'neutral'}`}>{student.house || 'NONE'}</span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => openPassModal(student)}
                                            style={{ marginRight: '0.5rem', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                        >
                                            Issue Pass
                                        </button>
                                        <button className="btn btn-ghost" onClick={() => openEdit(student)} style={{ marginRight: '0.5rem' }}>
                                            <Edit2 size={18} />
                                        </button>
                                        <button className="btn btn-ghost" onClick={() => handleDelete(student.id)} style={{ color: 'var(--error-color)' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h3 className="card-title">{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
                            <button onClick={() => setShowModal(false)} className="btn btn-ghost"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            {/* Core Identifiers */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Student ID *</label>
                                    <input required name="student_id_number" value={formData.student_id_number} onChange={handleInputChange} className="input-field" placeholder="ST-2024-001" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Full Name *</label>
                                    <input required name="name" value={formData.name} onChange={handleInputChange} className="input-field" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Roll No *</label>
                                    <input required name="roll_no" value={formData.roll_no} onChange={handleInputChange} className="input-field" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">GR No</label>
                                    <input name="gr_no" value={formData.gr_no} onChange={handleInputChange} className="input-field" />
                                </div>
                            </div>

                            {/* Personal Details */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Date of Birth</label>
                                    <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="input-field" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">House Color</label>
                                    <select name="house" value={formData.house} onChange={handleInputChange} className="select-field">
                                        <option value="NONE">None</option>
                                        <option value="RED">Red</option>
                                        <option value="GREEN">Green</option>
                                        <option value="BLUE">Blue</option>
                                        <option value="YELLOW">Yellow</option>
                                    </select>
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Contact Number</label>
                                <input name="contact_number" value={formData.contact_number} onChange={handleInputChange} className="input-field" />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Address</label>
                                <textarea name="address" value={formData.address} onChange={handleInputChange} className="input-field" rows="2" />
                            </div>

                            {/* Photo Upload */}
                            <div className="input-group">
                                <label className="input-label">Photo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {formData.photo_url && (
                                        <img src={formData.photo_url.startsWith('http') ? formData.photo_url : `${CONFIG.API_BASE_URL}${formData.photo_url}`} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                                    )}
                                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                                        {uploading ? 'Uploading...' : 'Choose Photo'}
                                        <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingStudent ? 'Update' : 'Add Student'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pass Issuance Modal */}
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

