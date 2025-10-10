import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    FaTachometerAlt, 
    FaUsers, 
    FaUserTag, 
    FaBoxes, 
    FaHistory, 
    FaTruck,
    FaTags,
    FaProjectDiagram
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import logo from '../../assets/logo/logo2.png';

const Sidebar = () => {
    const { hasPermission } = useAuth();
    
    return (
        <div className="d-flex flex-column flex-shrink-0 p-3 sidebar" style={{ width: '280px', minHeight: '100vh' }}>
            <a href="/dashboard" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                <img src={logo} alt="Bamika Engineering Logo" width="40" height="40" className="me-2" />
                <span className="fs-5">Bamika Engineering</span>
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
            </ul>
        </div>
    );
};

export default Sidebar;