import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import CONFIG from '../config';


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Safety timeout to prevent permanent loading hang
        const safetyTimeout = setTimeout(() => {
            if (loading) setLoading(false);
        }, 5000);

        if (token) {
            // Validate token with backend
            fetch(`${CONFIG.API_BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Invalid token');
                })
                .then(data => setUser(data.user))
                .catch(() => {
                    logout();
                })
                .finally(() => {
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                });
        } else {
            setLoading(false);
            clearTimeout(safetyTimeout);
        }

        return () => clearTimeout(safetyTimeout);
    }, [token]);

    const login = useCallback(async (username, password) => {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                setToken(data.token);
                setUser(data.user);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            throw error; // Rethrow to be caught by the component
        }
    }, []);

    const impersonate = useCallback(async (targetUserId) => {
        if (!token || !user) return false;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/admin/impersonate/${targetUserId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // Store original admin session
                localStorage.setItem('adminToken', token);
                localStorage.setItem('adminUser', JSON.stringify(user));

                // Set teacher session
                localStorage.setItem('token', data.token);
                setToken(data.token);
                setUser(data.user);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Impersonation error:', error);
            return false;
        }
    }, [token, user]);

    const stopImpersonating = useCallback(() => {
        const adminToken = localStorage.getItem('adminToken');
        const adminUser = JSON.parse(localStorage.getItem('adminUser'));

        if (adminToken && adminUser) {
            localStorage.setItem('token', adminToken);
            setToken(adminToken);
            setUser(adminUser);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
        } else {
            logout();
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setToken(null);
        setUser(null);
    }, []);

    const isImpersonating = useMemo(() => !!localStorage.getItem('adminToken'), [token]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        user,
        login,
        logout,
        loading,
        token,
        impersonate,
        stopImpersonating,
        isImpersonating
    }), [user, login, logout, loading, token, impersonate, stopImpersonating, isImpersonating]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--background-bg)'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '3px solid var(--border-color)',
                    borderTop: '3px solid var(--primary-color)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
