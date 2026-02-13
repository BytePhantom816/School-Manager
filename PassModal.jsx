import React from 'react';
import { X, Clock } from 'lucide-react';
import { useDevice } from '../hooks/useDevice';

export default function PassModal({ isOpen, onClose, passData, setPassData, onIssue }) {
    if (!isOpen) return null;
    const { isMobile } = useDevice();

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            zIndex: 3000,
            padding: isMobile ? '12px' : '20px',
            paddingTop: isMobile ? '5vh' : '10vh'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '400px',
                borderRadius: 'var(--radius-xl)',
                maxHeight: '85vh',
                overflowY: 'auto',
                margin: '0 auto',
                padding: isMobile ? '16px' : '24px',
                animation: 'scaleIn 0.2s ease-out',
                position: 'relative',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '700' }}>Issue Pass</h3>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{passData.student_name}</p>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ marginTop: '-8px', marginRight: '-8px' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onIssue(); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="input-group">
                        <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Destination *</label>
                        <select
                            required
                            className="select-field"
                            value={passData.destination}
                            onChange={e => setPassData({ ...passData, destination: e.target.value })}
                            style={{ height: '40px', fontSize: '0.9rem', padding: '0 12px', lineHeight: 'normal' }}
                        >
                            <option value="">Select...</option>
                            <option value="Washroom">Washroom</option>
                            <option value="Library">Library</option>
                            <option value="Lab">Computer/Science Lab</option>
                            <option value="Staff Room">Staff Room</option>
                            <option value="Office">Admin Office</option>
                            <option value="Playground">Playground</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Reason *</label>
                        <input
                            required
                            className="input-field"
                            value={passData.reason}
                            onFocus={(e) => isMobile && e.target.scrollIntoView({ behavior: 'smooth' })}
                            onChange={e => setPassData({ ...passData, reason: e.target.value })}
                            placeholder="Reason for pass"
                            style={{ height: '40px', fontSize: '0.9rem', padding: '0 12px', lineHeight: 'normal' }}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Duration (Mins)</label>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                            {[5, 10, 15, 30].map(mins => (
                                <button
                                    key={mins}
                                    type="button"
                                    onClick={() => setPassData({ ...passData, duration_minutes: mins })}
                                    className={`btn ${passData.duration_minutes === mins ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1, padding: '4px', fontSize: '0.8rem', height: '32px' }}
                                >
                                    {mins}m
                                </button>
                            ))}
                        </div>
                        <input
                            type="number"
                            min="1"
                            className="input-field"
                            placeholder="Custom minutes"
                            value={passData.duration_minutes || ''}
                            onChange={e => setPassData({ ...passData, duration_minutes: parseInt(e.target.value) || 0 })}
                            style={{ height: '36px', fontSize: '0.9rem', textAlign: 'center' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1, height: '44px' }} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1.5, height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Clock size={18} /> Issue
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
