import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, School, ShieldAlert, LogOut, Ticket, X, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ topOffset = 0, isOpen, setIsOpen }) {
    const { user, logout } = useAuth();
    if (!user) return null;

    const navClass = ({ isActive }) =>
        `nav-link ${isActive ? 'active' : ''}`;

    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

    const closeSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsOpen(false);
        }
    };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ top: topOffset }}>
            <div className="sidebar-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ letterSpacing: '2px', color: 'var(--primary-color)' }}>MASTERMIND</h2>
                    <button className="close-sidebar" onClick={() => setIsOpen(false)}>
                        <X size={24} />
                    </button>
                </div>
                <div className="user-info">
                    <p className="user-name">{user.full_name}</p>
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {user.role === 'HEAD' ? 'MASTERMIND' : user.role}
                    </span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {user.role === 'HEAD' && (
                    <>
                        <NavLink to="/head" className={navClass} end onClick={closeSidebar}>
                            <LayoutDashboard size={20} /> Dashboard
                        </NavLink>
                        <NavLink to="/head/classes" className={navClass} onClick={closeSidebar}>
                            <School size={20} /> All Classes
                        </NavLink>
                        <NavLink to="/head/staff" className={navClass} onClick={closeSidebar}>
                            <Users size={20} /> Staff Management
                        </NavLink>
                        <NavLink to="/monitoring" className={navClass} onClick={closeSidebar}>
                            <Activity size={20} /> Live Monitoring
                        </NavLink>
                    </>
                )}

                {user.role === 'ADMIN' && (
                    <>
                        <NavLink to="/admin" className={navClass} end onClick={closeSidebar}>
                            <LayoutDashboard size={20} /> Dashboard
                        </NavLink>
                        <NavLink to="/admin/classes" className={navClass} onClick={closeSidebar}>
                            <School size={20} /> Manage Classes
                        </NavLink>
                        <NavLink to="/admin/users" className={navClass} onClick={closeSidebar}>
                            <Users size={20} /> Manage Teachers
                        </NavLink>
                        <NavLink to="/monitoring" className={navClass} onClick={closeSidebar}>
                            <Activity size={20} /> Live Monitoring
                        </NavLink>
                    </>
                )}

                {(user.role === 'CLASS_TEACHER' || user.role === 'ROAMING_TEACHER') && (
                    <>
                        <NavLink to="/teacher" className={navClass} end onClick={closeSidebar}>
                            <Ticket size={20} /> My Class & Issue
                        </NavLink>
                        <NavLink to="/teacher/security-check" className={navClass} onClick={closeSidebar}>
                            <ShieldAlert size={20} /> Security Check
                        </NavLink>
                        <NavLink to="/monitoring" className={navClass} onClick={closeSidebar}>
                            <Activity size={20} /> Live Monitoring
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <button onClick={() => setShowLogoutConfirm(true)} className="logout-btn">
                    <LogOut size={18} /> Logout
                </button>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="card" style={{ width: '400px', textAlign: 'center', padding: '2rem' }}>
                        <div style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>
                            <LogOut size={48} />
                        </div>
                        <h3>Confirm Logout</h3>
                        <p className="text-muted" style={{ marginBottom: '2rem' }}>Are you sure you want to log out of your account?</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)' }} onClick={logout}>Yes, Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
