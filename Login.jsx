import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ShieldCheck, Users } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await login(username, password);
            if (success) {
                navigate('/');
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            console.error('Login attempt failed:', err);
            setError('Could not connect to the server. Please check your internet or if the server is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--background-gradient)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated background elements */}
            <div style={{
                position: 'absolute',
                top: '10%',
                left: '10%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 6s ease-in-out infinite'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '10%',
                right: '10%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 8s ease-in-out infinite reverse'
            }} />

            <div
                className="card animate-fadeIn"
                style={{
                    width: '440px',
                    maxWidth: '90%',
                    background: 'var(--card-bg)',
                    backdropFilter: 'var(--glass-blur-heavy)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-xl)',
                    position: 'relative',
                    zIndex: 1
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-lg)',
                        boxShadow: 'var(--glow-primary)'
                    }}>
                        <ShieldCheck size={40} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '1.875rem',
                        fontWeight: '800',
                        margin: '0 0 var(--spacing-sm)',
                        background: 'linear-gradient(135deg, var(--text-main) 0%, var(--primary-color) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        School Portal
                    </h1>
                    <p style={{
                        color: 'var(--text-muted)',
                        margin: 0,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--spacing-xs)'
                    }}>
                        <Users size={16} />
                        Permission Management System
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--error-color)',
                        marginBottom: 'var(--spacing-lg)',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
                    <div className="input-group">
                        <label className="input-label">Username</label>
                        <input
                            className="input-field"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                            placeholder="Enter your username"
                            disabled={loading}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="input-field"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                                disabled={loading}
                                style={{ paddingRight: '3rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="btn btn-ghost"
                                style={{
                                    position: 'absolute',
                                    right: 'var(--spacing-sm)',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    padding: 'var(--spacing-xs)',
                                    aspectRatio: '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    transition: 'all var(--transition-smooth)'
                                }}
                                disabled={loading}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: 'var(--spacing-lg)',
                            fontSize: '1rem',
                            fontWeight: '700',
                            position: 'relative'
                        }}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div
                                    className="animate-spin"
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        border: '2px solid transparent',
                                        borderTop: '2px solid currentColor',
                                        borderRadius: '50%',
                                        marginRight: 'var(--spacing-sm)'
                                    }}
                                />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div style={{
                    marginTop: 'var(--spacing-xl)',
                    paddingTop: 'var(--spacing-lg)',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center'
                }}>
                    <p style={{
                        color: 'var(--text-dim)',
                        fontSize: '0.75rem',
                        margin: 0
                    }}>
                        Secure Access • Role-Based Authentication
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
            `}</style>
        </div>
    );
}
