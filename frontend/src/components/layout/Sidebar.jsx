import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaUserTag } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import { FaBoxes } from 'react-icons/fa';
import { FaTruck } from 'react-icons/fa';
import { FaHistory } from 'react-icons/fa';

const Sidebar = () => {
    const { hasPermission } = useAuth();
    
    return (
        <div className="d-flex flex-column flex-shrink-0 p-3 sidebar" style={{ width: '280px', minHeight: '100vh' }}>
            <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                <span className="fs-4" style={{ color: '#FFD700' }}>BamikaHub IS</span>
            </a>
            <hr />
            <ul className="nav nav-pills flex-column mb-auto">
                <li className="nav-item">
                    <NavLink to="/dashboard" className="nav-link" aria-current="page">
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
                {hasPermission('SUPPLIER_READ') && (
                    <li className="nav-item">
                        <NavLink to="/suppliers" className="nav-link">
                        <FaTruck className="me-2" /> Suppliers
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
                {/* Add future links for Inventory, Suppliers, etc. here */}
            </ul>
        </div>
    );
};

export default Sidebar;