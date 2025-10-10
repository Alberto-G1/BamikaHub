import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

const MainLayout = () => {
    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            {/* The Sidebar is a fixed element on the left */}
            <Sidebar />

            {/* This wrapper div takes up the remaining width of the screen */}
            <div className="w-100 d-flex flex-column">
                {/* The Header sits at the top of the content area */}
                <Header />

                {/* The main content area where pages will be rendered */}
                <main className="p-4 flex-grow-1">
                    <Outlet /> {/* Renders the current route's component (e.g., Dashboard, UserManagement) */}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;