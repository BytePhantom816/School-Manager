import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, School, ShieldAlert, Ticket, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileBottomNav() {
    const { user } = useAuth();
    if (!user) return null;

    const navClass = ({ isActive }) =>
        `mobile-nav-link ${isActive ? 'active' : ''}`;

    return (
        <nav className="mobile-bottom-nav">
            {user.role === 'HEAD' && (
                <>
                    <NavLink to="/head" className={navClass} end>
                        <LayoutDashboard size={24} />
                        <span>Dash</span>
                    </NavLink>
                    <NavLink to="/head/classes" className={navClass}>
                        <School size={24} />
                        <span>Classes</span>
                    </NavLink>
                    <NavLink to="/head/staff" className={navClass}>
                        <Users size={24} />
                        <span>Staff</span>
                    </NavLink>
                    <NavLink to="/monitoring" className={navClass}>
                        <Activity size={24} />
                        <span>Live</span>
                    </NavLink>
                </>
            )}

            {user.role === 'ADMIN' && (
                <>
                    <NavLink to="/admin" className={navClass} end>
                        <LayoutDashboard size={24} />
                        <span>Dash</span>
                    </NavLink>
                    <NavLink to="/admin/classes" className={navClass}>
                        <School size={24} />
                        <span>Classes</span>
                    </NavLink>
                    <NavLink to="/admin/users" className={navClass}>
                        <Users size={24} />
                        <span>Staff</span>
                    </NavLink>
                    <NavLink to="/monitoring" className={navClass}>
                        <Activity size={24} />
                        <span>Live</span>
                    </NavLink>
                </>
            )}

            {(user.role === 'CLASS_TEACHER' || user.role === 'ROAMING_TEACHER') && (
                <>
                    <NavLink to="/teacher" className={navClass} end>
                        <Ticket size={24} />
                        <span>Class</span>
                    </NavLink>
                    <NavLink to="/teacher/security-check" className={navClass}>
                        <ShieldAlert size={24} />
                        <span>Security</span>
                    </NavLink>
                    <NavLink to="/monitoring" className={navClass}>
                        <Activity size={24} />
                        <span>Live</span>
                    </NavLink>
                </>
            )}
        </nav>
    );
}
