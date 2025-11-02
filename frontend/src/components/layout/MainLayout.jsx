import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import './MainLayout.css';

const MainLayout = () => {
    return (
        <div className="main-layout d-flex" style={{ minHeight: '100vh' }}>
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="main-content-wrapper w-100 d-flex flex-column">
                {/* Header */}
                <Header />

                {/* Page Content */}
                <main className="main-content flex-grow-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;