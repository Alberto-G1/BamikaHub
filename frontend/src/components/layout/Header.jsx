import React from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { 
    FaUserCircle, 
    FaCog, 
    FaBell, 
    FaUser, 
    FaKey, 
    FaShieldAlt, 
    FaQuestionCircle,
    FaSignOutAlt,
    FaSun,
    FaMoon,
    FaHome,
    FaChevronRight
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import NotificationBell from '../notifications/NotificationBell.jsx';
import './Header.css';

const Header = () => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [theme, setTheme] = React.useState(
        localStorage.getItem('theme') || 'light'
    );

    const getPageTitle = () => {
        const path = location.pathname.split('/').filter(p => p);
        if (path.length === 0 || path[0] === 'dashboard') return 'Dashboard';
        
        return path
            .map(p => p.replace(/-/g, ' '))
            .join(' / ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    const getBreadcrumbs = () => {
        const path = location.pathname.split('/').filter(p => p);
        if (path.length === 0) return [{ name: 'Dashboard', path: '/dashboard' }];
        
        let currentPath = '';
        return path.map(segment => {
            currentPath += `/${segment}`;
            return {
                name: segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                path: currentPath
            };
        });
    };

    const handleLogout = () => {
        logout();
        toast.info('You have been logged out.');
        navigate('/login');
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    React.useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    return (
        <header className="header-modern">
            {/* Left Section - Breadcrumb */}
            <div className="header-breadcrumb">
                <h4>{getPageTitle()}</h4>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <NavLink to="/dashboard" className="breadcrumb-link">
                                <FaHome className="me-1" style={{ fontSize: '0.85rem' }} />
                                Home
                            </NavLink>
                        </li>
                        {getBreadcrumbs().map((crumb, index) => (
                            <li 
                                key={index} 
                                className={`breadcrumb-item ${index === getBreadcrumbs().length - 1 ? 'active' : ''}`}
                            >
                                {index === getBreadcrumbs().length - 1 ? (
                                    <span>{crumb.name}</span>
                                ) : (
                                    <NavLink to={crumb.path} className="breadcrumb-link">
                                        {crumb.name}
                                    </NavLink>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>

            {/* Right Section - Actions */}
            <div className="d-flex align-items-center">
                {/* Theme Toggle Button */}
                <button 
                    className="theme-toggle-btn"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? (
                        <FaMoon size={18} />
                    ) : (
                        <FaSun size={18} />
                    )}
                </button>
                
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* User Profile Dropdown */}
                <div className="dropdown">
                    <button 
                        className="header-user-dropdown" 
                        data-bs-toggle="dropdown" 
                        aria-expanded="false"
                        type="button"
                    >
                        {user && user.profilePictureUrl ? (
                            <img 
                                src={`http://localhost:8080${user.profilePictureUrl}`} 
                                alt="avatar" 
                                width="36" 
                                height="36" 
                                className="rounded-circle user-avatar" 
                            />
                        ) : (
                            <FaUserCircle size={36} className="text-secondary" />
                        )}
                        <div className="d-none d-md-flex flex-column align-items-start">
                            <div className="user-name">{user ? user.email : 'Loading...'}</div>
                            <div className="user-role">{user?.role || 'User'}</div>
                        </div>
                        <FaChevronRight size={12} className="ms-2 d-none d-md-block" style={{ opacity: 0.5 }} />
                    </button>
                    
                    <ul className="dropdown-menu dropdown-menu-end dropdown-menu-modern shadow">
                        <li className="dropdown-header">
                            <div className="fw-bold text-truncate" style={{ maxWidth: '200px' }}>
                                {user?.email}
                            </div>
                            <small className="text-muted">{user?.role || 'User'}</small>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                            <NavLink className="dropdown-item" to="/profile">
                                <FaUser className="me-2" /> My Profile
                            </NavLink>
                        </li>
                        <li>
                            <NavLink className="dropdown-item" to="/profile/settings">
                                <FaCog className="me-2" /> Settings
                            </NavLink>
                        </li>
                        <li>
                            <NavLink className="dropdown-item" to="/profile/security">
                                <FaKey className="me-2" /> Security
                            </NavLink>
                        </li>
                        <li>
                            <NavLink className="dropdown-item" to="/profile/privacy">
                                <FaShieldAlt className="me-2" /> Privacy
                            </NavLink>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                            <NavLink className="dropdown-item" to="/help">
                                <FaQuestionCircle className="me-2" /> Help Center
                            </NavLink>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                            <button className="dropdown-item text-danger" onClick={handleLogout}>
                                <FaSignOutAlt className="me-2" /> Sign out
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    );
};

export default Header;