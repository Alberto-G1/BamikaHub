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
    FaChevronDown
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import logo from '../../assets/logo/logo2.png';
import './Sidebar.css';

const Sidebar = () => {
    const { hasPermission } = useAuth();
    const [expandedSections, setExpandedSections] = useState({
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

    return (
        <div className="d-flex flex-column flex-shrink-0 p-3 sidebar-modern" style={{ width: '280px', minHeight: '100vh' }}>
            <a href="/dashboard" className="sidebar-logo d-flex align-items-center mb-3 text-white text-decoration-none">
                <img 
                    src={logo} 
                    alt="Bamika Engineering Logo" 
                    width="40" 
                    height="40" 
                    className="me-2" 
                />
                <span className="fs-5 fw-semibold">Bamika Engineering</span>
            </a>
            <hr className="sidebar-divider" />

            <ul className="nav nav-pills flex-column mb-auto">
                <li className="nav-item">
                    <NavLink to="/dashboard" className="nav-link">
                        <FaTachometerAlt className="me-2" /> Dashboard
                    </NavLink>
                </li>

                {hasPermission('USER_READ') && (
                    <li className="nav-item">
                        <NavLink to="/users" className="nav-link">
                            <FaUsers className="me-2" /> Users
                        </NavLink>
                    </li>
                )}

                {hasPermission('ROLE_READ') && (
                    <li className="nav-item">
                        <NavLink to="/roles" className="nav-link">
                            <FaUserTag className="me-2" /> Roles & Permissions
                        </NavLink>
                    </li>
                )}

                {hasPermission('ITEM_READ') && (
                    <li className="nav-item">
                        <NavLink to="/inventory" className="nav-link">
                            <FaBoxes className="me-2" /> Inventory
                        </NavLink>
                    </li>
                )}

                {hasPermission('ITEM_READ') && (
                    <li className="nav-item">
                        <NavLink to="/inventory/transactions" className="nav-link">
                            <FaHistory className="me-2" /> Transaction Log
                        </NavLink>
                    </li>
                )}

                {hasPermission('SUPPLIER_READ') && (
                    <li className="nav-item">
                        <NavLink to="/suppliers" className="nav-link">
                            <FaTruck className="me-2" /> Suppliers
                        </NavLink>
                    </li>
                )}

                {hasPermission('ITEM_READ') && (
                    <li className="nav-item">
                        <NavLink to="/categories" className="nav-link">
                            <FaTags className="me-2" /> Categories
                        </NavLink>
                    </li>
                )}

                {hasPermission('PROJECT_READ') && (
                    <li className="nav-item">
                        <NavLink to="/projects" className="nav-link">
                            <FaProjectDiagram className="me-2" /> Projects
                        </NavLink>
                    </li>
                )}

                {(hasPermission('REQUISITION_CREATE') || hasPermission('REQUISITION_APPROVE')) && (
                    <li className="nav-item">
                        <NavLink to="/requisitions" className="nav-link">
                            <FaMoneyCheckAlt className="me-2" /> Requisitions
                        </NavLink>
                    </li>
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
                        <NavLink to="/support/tickets" className="nav-link">
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
                        <NavLink to="/reports" className="nav-link">
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
                                <NavLink to="/audit-trail" className="nav-link">
                                    <FaClipboardList className="me-2" /> Audit Trail
                                </NavLink>
                            </li>
                        </div>
                    </>
                )}
            </ul>
        </div>
    );
};

export default Sidebar;