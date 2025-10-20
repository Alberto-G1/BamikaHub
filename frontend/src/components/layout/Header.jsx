import React from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom'; 
import { FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import NotificationBell from '../notifications/NotificationBell.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx'; 

const Header = () => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const navigate = useNavigate(); // This line was causing the error

    // A function to generate a readable title from the URL path
    const getPageTitle = () => {
        const path = location.pathname.split('/').filter(p => p);
        if (path.length === 0 || path[0] === 'dashboard') return 'Dashboard';
        
        // Make titles more readable
        return path
            .map(p => p.replace(/-/g, ' '))
            .join(' / ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    const handleLogout = () => {
        logout();
        toast.info('You have been logged out.');
        navigate('/login');
    };

    return (
        <header className="bg-white shadow-sm mb-4 d-flex justify-content-between align-items-center p-3">
            <h4 className="mb-0 text-secondary">{getPageTitle()}</h4>
            <div className="d-flex align-items-center gap-3">
                {/* Theme Toggle */}
                <ThemeToggle />
                
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* User Profile Dropdown */}
                <div className="dropdown">
                    <a href="#" className="d-flex align-items-center text-dark text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                        {user && user.profilePictureUrl ? (
                             <img src={`http://localhost:8080${user.profilePictureUrl}`} alt="avatar" width="32" height="32" className="rounded-circle me-2" style={{objectFit: 'cover'}} />
                        ) : (
                             <FaUserCircle size={28} className="me-2 text-secondary" />
                        )}
                        <span>{user ? user.email : 'Loading...'}</span>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end text-small shadow">
                        <li><NavLink className="dropdown-item" to="/profile">Profile</NavLink></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li><button className="dropdown-item" onClick={handleLogout}>Sign out</button></li>
                    </ul>
                </div>
            </div>
        </header>
    );
};

export default Header;