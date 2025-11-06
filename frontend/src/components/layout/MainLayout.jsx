import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import './MainLayout.css';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close the mobile sidebar when resizing to desktop
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth > 992 && sidebarOpen) setSidebarOpen(false);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [sidebarOpen]);

    return (
        <div className="main-layout d-flex" style={{ minHeight: '100vh' }}>
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="main-content-wrapper w-100 d-flex flex-column">
                {/* Header */}
                <Header onToggleSidebar={() => setSidebarOpen(v => !v)} />

                {/* Page Content */}
                <main className="main-content flex-grow-1">
                    <Outlet />
                </main>
            </div>

            {/* Mobile overlay when sidebar is open */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                    role="button"
                    aria-label="Close sidebar overlay"
                />
            )}
        </div>
    );
};

export default MainLayout;