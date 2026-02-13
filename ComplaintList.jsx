import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Clock, User, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import CONFIG from '../config';

export default function ComplaintList() {
    const { token, user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${CONFIG.API_BASE_URL}/complaints`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setComplaints(await res.json());
            } else {
                setError('Failed to load complaints');
            }
        } catch (err) {
            console.error(err);
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-muted">Loading complaints...</div>;
    if (error) return <div className="text-error">{error}</div>;

    return (
        <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <FileText size={20} color="var(--primary-color)" />
                Student Complaints
            </h3>

            {complaints.length === 0 ? (
                <p className="text-muted">No complaints found.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: 'var(--spacing-sm)' }}>Student</th>
                                <th style={{ padding: 'var(--spacing-sm)' }}>Class</th>
                                <th style={{ padding: 'var(--spacing-sm)' }}>Reporter</th>
                                <th style={{ padding: 'var(--spacing-sm)' }}>Description</th>
                                <th style={{ padding: 'var(--spacing-sm)' }}>Date</th>
                                <th style={{ padding: 'var(--spacing-sm)' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map(complaint => (
                                <tr key={complaint.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: 'var(--spacing-md)', fontWeight: 600 }}>{complaint.student_name || 'N/A'}</td>
                                    <td style={{ padding: 'var(--spacing-md)' }}>{complaint.class_name || 'N/A'}</td>
                                    <td style={{ padding: 'var(--spacing-md)' }}>{complaint.reporter_name}</td>
                                    <td style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem' }}>{complaint.description}</td>
                                    <td style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {new Date(complaint.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)' }}>
                                        <span className={`badge ${complaint.status === 'PENDING' ? 'badge-warning' : 'badge-success'}`}>
                                            {complaint.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
