// ============================================
// Enhanced Sidebar.jsx
// ============================================
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    FaTachometerAlt, 
    FaUsers, 
    FaUserTag, 
    FaBoxes, 
    FaHistory, 
    FaTruck,
    FaTags,
    FaProjectDiagram,
    FaMoneyCheckAlt,
    FaTicketAlt,
    FaChartLine,
    FaClipboardList,
    FaTasks,
    FaChevronDown,
    FaComments,
    FaTrophy,
    FaAward
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import logo from '../../assets/logo/logo2.png';
import './Sidebar-Bootstrap.css';

const Sidebar = ({ isOpen = false, onNavigate }) => {
    const { hasPermission } = useAuth();
    const [expandedSections, setExpandedSections] = useState({
        assignments: true,
        support: true,
        analysis: true,
        administration: true
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleNav = () => {
        if (onNavigate) onNavigate();
    };

    return (
        <aside className={`sidebar-modern ${isOpen ? 'show' : ''}`}>
            <div className="sidebar-logo-container">
                <div className="sidebar-logo d-flex align-items-center">
                    <img src={logo} alt="BamikaHub Logo" width="40" height="40" />
                    <span className="ms-2 h5 mb-0">BamikaHub</span>
                </div>
            </div>
            
            <div className="sidebar-scroll-area">
                <ul className="nav nav-pills flex-column">
                    <li className="nav-item">
                        <NavLink to="/dashboard" className="nav-link" onClick={handleNav}>
                            <FaTachometerAlt className="me-2" /> Dashboard
                        </NavLink>
                    </li>

                    {hasPermission('USER_READ') && (
                        <li className="nav-item">
                            <NavLink to="/users" className="nav-link" onClick={handleNav}>
                                <FaUsers className="me-2" /> Users
                            </NavLink>
                        </li>
                    )}

                    {hasPermission('ROLE_READ') && (
                        <li className="nav-item">
                            <NavLink to="/roles" className="nav-link" onClick={handleNav}>
                                <FaUserTag className="me-2" /> Roles & Permissions
                            </NavLink>
                        </li>
                    )}

                    {hasPermission('ITEM_READ') && (
                        <li className="nav-item">
                            <NavLink to="/inventory" className="nav-link" onClick={handleNav}>
                                <FaBoxes className="me-2" /> Inventory
                            </NavLink>
                        </li>
                    )}

                    {hasPermission('ITEM_READ') && (
                        <li className="nav-item">
                            <NavLink to="/inventory/transactions" className="nav-link" onClick={handleNav}>
                                <FaHistory className="me-2" /> Transaction Log
                            </NavLink>
                        </li>
                    )}

                    {hasPermission('SUPPLIER_READ') && (
                        <li className="nav-item">
                            <NavLink to="/suppliers" className="nav-link" onClick={handleNav}>
                                <FaTruck className="me-2" /> Suppliers
                            </NavLink>
                        </li>
                    )}

                    {hasPermission('ITEM_READ') && (
                        <li className="nav-item">
                            <NavLink to="/categories" className="nav-link" onClick={handleNav}>
                                <FaTags className="me-2" /> Categories
                            </NavLink>
                        </li>
                    )}

                    {hasPermission('PROJECT_READ') && (
                        <li className="nav-item">
                            <NavLink to="/projects" className="nav-link" onClick={handleNav}>
                                <FaProjectDiagram className="me-2" /> Projects
                            </NavLink>
                        </li>
                    )}

                    {(hasPermission('REQUISITION_CREATE') || hasPermission('REQUISITION_APPROVE')) && (
                        <li className="nav-item">
                            <NavLink to="/requisitions" className="nav-link" onClick={handleNav}>
                                <FaMoneyCheckAlt className="me-2" /> Requisitions
                            </NavLink>
                        </li>
                    )}

                    <li className="nav-item">
                        <NavLink to="/chat" className="nav-link" onClick={handleNav}>
                            <FaComments className="me-2" /> Chat
                        </NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/motivation/wall-of-fame" className="nav-link" onClick={handleNav}>
                            <FaTrophy className="me-2" /> Wall of Fame
                        </NavLink>
                    </li>

                    {hasPermission('ASSIGNMENT_CREATE') && (
                        <li className="nav-item">
                            <NavLink to="/motivation/awards" className="nav-link" onClick={handleNav}>
                                <FaAward className="me-2" /> Manage Awards
                            </NavLink>
                        </li>
                    )}

                    {/* Assignments Section */}
                    {(hasPermission('ASSIGNMENT_CREATE') || hasPermission('ASSIGNMENT_READ')) && (
                        <>
                            <li className="nav-item">
                                <div 
                                    className={`sidebar-section-header ${expandedSections.assignments ? 'expanded' : 'collapsed'}`}
                                    onClick={() => toggleSection('assignments')}
                                >
                                    <span><FaTasks className="me-2" /> Assignments</span>
                                    <FaChevronDown />
                                </div>
                            </li>
                            <div className={`sidebar-section-content ${expandedSections.assignments ? '' : 'collapsed'}`}>
                                {hasPermission('ASSIGNMENT_CREATE') && (
                                    <li className="nav-item">
                                        <NavLink to="/assignments/create" className="nav-link" onClick={handleNav}>
                                            <FaTasks className="me-2" /> Create Assignment
                                        </NavLink>
                                    </li>
                                )}
                                {hasPermission('ASSIGNMENT_READ') && (
                                    <li className="nav-item">
                                        <NavLink to="/assignments/my-assignments" className="nav-link" onClick={handleNav}>
                                            <FaTasks className="me-2" /> My Assignments
                                        </NavLink>
                                    </li>
                                )}
                                {hasPermission('ASSIGNMENT_CREATE') && (
                                    <li className="nav-item">
                                        <NavLink to="/assignments/created-by-me" className="nav-link" onClick={handleNav}>
                                            <FaTasks className="me-2" /> Created by Me
                                        </NavLink>
                                    </li>
                                )}
                            </div>
                        </>
                    )}

                    {/* Support Section */}
                    <li className="nav-item">
                        <div 
                            className={`sidebar-section-header ${expandedSections.support ? 'expanded' : 'collapsed'}`}
                            onClick={() => toggleSection('support')}
                        >
                            <span>Support</span>
                            <FaChevronDown />
                        </div>
                    </li>
                    <div className={`sidebar-section-content ${expandedSections.support ? '' : 'collapsed'}`}>
                        <li className="nav-item">
                            <NavLink to="/support/tickets" className="nav-link" onClick={handleNav}>
                                <FaTicketAlt className="me-2" /> Support Tickets
                            </NavLink>
                        </li>
                    </div>

                    {/* Analysis Section */}
                    <li className="nav-item">
                        <div 
                            className={`sidebar-section-header ${expandedSections.analysis ? 'expanded' : 'collapsed'}`}
                            onClick={() => toggleSection('analysis')}
                        >
                            <span>Analysis</span>
                            <FaChevronDown />
                        </div>
                    </li>
                    <div className={`sidebar-section-content ${expandedSections.analysis ? '' : 'collapsed'}`}>
                        <li className="nav-item">
                            <NavLink to="/reports" className="nav-link" onClick={handleNav}>
                                <FaChartLine className="me-2" /> Reports & Analytics
                            </NavLink>
                        </li>
                    </div>

                    {/* Administration Section */}
                    {hasPermission('AUDIT_READ') && (
                        <>
                            <li className="nav-item">
                                <div 
                                    className={`sidebar-section-header ${expandedSections.administration ? 'expanded' : 'collapsed'}`}
                                    onClick={() => toggleSection('administration')}
                                >
                                    <span>Administration</span>
                                    <FaChevronDown />
                                </div>
                            </li>
                            <div className={`sidebar-section-content ${expandedSections.administration ? '' : 'collapsed'}`}>
                                <li className="nav-item">
                                    <NavLink to="/audit-trail" className="nav-link" onClick={handleNav}>
                                        <FaClipboardList className="me-2" /> Audit Trail
                                    </NavLink>
                                </li>
                            </div>
                        </>
                    )}
                </ul>
            </div>
            <div className="sidebar-footer-branding">
                <div className="branding-line">© 2025 • Alberto ❤️‍🔥 Grande</div>
                <div className="branding-subline">UI/UX & Software Developer</div>
            </div>
        </aside>
    );
};

export default Sidebar;