import React, { useState } from 'react';
import HeadClasses from './head/HeadClasses';
import ComplaintList from '../components/ComplaintList';
import { School, FileWarning } from 'lucide-react';

export default function HeadDashboard() {
    const [activeTab, setActiveTab] = useState('classes');

    return (
        <div style={{ padding: 'var(--spacing-xl)' }}>
            <h1 style={{ marginBottom: 'var(--spacing-md)' }}>Mastermind Overview</h1>
            <p style={{ marginBottom: 'var(--spacing-xl)' }}>Manage the entire school operations from here.</p>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
                <button
                    className={`btn ${activeTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('classes')}
                >
                    <School size={20} />
                    Classes Overview
                </button>
                <button
                    className={`btn ${activeTab === 'complaints' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('complaints')}
                >
                    <FileWarning size={20} />
                    All Complaints
                </button>
            </div>

            <div style={{ marginTop: '2rem' }}>
                {activeTab === 'classes' && <HeadClasses />}
                {activeTab === 'complaints' && <ComplaintList />}
            </div>
        </div>
    );
}
