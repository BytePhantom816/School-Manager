import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, Eye } from 'lucide-react';
import Sidebar from './Sidebar';
import { useDevice } from '../hooks/useDevice';
import MobileBottomNav from './MobileBottomNav';
import ScrollToTop from './ScrollToTop';

export default function Layout() {
    const { isImpersonating, stopImpersonating, user } = useAuth();
    const { isMobile } = useDevice();
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
    const mainContentRef = useRef(null);

    useEffect(() => {
        setSidebarOpen(!isMobile);
    }, [isMobile]);

    useEffect(() => {
        if (isImpersonating) {
            document.body.classList.add('preview-active');
        } else {
            document.body.classList.remove('preview-active');
        }
    }, [isImpersonating]);

    return (
        <div className="app-layout" style={{ flexDirection: 'column' }}>
            {isImpersonating && (
                <div className="preview-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'rgba(2, 44, 34, 0.2)', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                            <Eye size={18} color="#022c22" />
                        </div>
                        <p>
                            Preview Mode: Viewing as <strong>{user?.full_name}</strong>
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="preview-exit-btn" onClick={stopImpersonating}>
                            <LogOut size={16} style={{ marginRight: '6px' }} /> Exit Preview
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Header - Keep for Sidebar access (Profile/Logout) */}
            <div className="mobile-header">
                <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                    <Menu size={24} />
                    <span>Mastermind</span>
                </button>
            </div>

            <div style={{
                display: 'flex',
                flex: 1,
                minHeight: 0
            }}>
                <Sidebar
                    topOffset={0}
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                />
                {/* Main Content */}
                <main
                    ref={mainContentRef}
                    className={`main-content ${sidebarOpen ? 'sidebar-open' : ''} `}
                    style={{
                         paddingTop: isImpersonating ? 'calc(var(--spacing-lg) + 60px)' : undefined
                    }}
                >
                    <Outlet />
                </main>
            </div>

            <ScrollToTop scrollContainerRef={mainContentRef} />

            {/* Mobile Bottom Nav */}
            <MobileBottomNav />

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && isMobile && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                    style={{ display: 'block' }}
                />
            )}
        </div>
    );
}
