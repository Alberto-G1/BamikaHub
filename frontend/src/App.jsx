import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- CORE & LAYOUT ---
import MainLayout from './components/layout/MainLayout.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// --- AUTH PAGES ---
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

// --- DASHBOARD PAGE ---
import Dashboard from './pages/dashboard/Dashboard.jsx';

// --- USER & PROFILE PAGES ---
import UserManagement from './pages/user/UserManagement.jsx';
import UserForm from './pages/user/UserForm.jsx';
import DeactivatedUsers from './pages/user/DeactivatedUsers.jsx';
import ProfileViewPage from './pages/user/ProfileViewPage.jsx';
import ProfileEditPage from './pages/user/ProfileEditPage.jsx';

// --- ROLES & PERMISSIONS PAGES ---
import RoleManagement from './pages/roles/RoleManagement.jsx';
import RoleForm from './pages/roles/RoleForm.jsx';

// --- INVENTORY PAGES ---
import InventoryPage from './pages/inventory/InventoryPage.jsx';
import InventoryForm from './pages/inventory/InventoryForm.jsx';
import ItemDetailsPage from './pages/inventory/ItemDetailsPage.jsx';
import CategoryManagementPage from './pages/inventory/CategoryManagement.jsx';
import TransactionHistoryPage from './pages/inventory/TransactionHistoryPage.jsx';

// --- SUPPLIERS PAGE ---
import SupplierPage from './pages/suppliers/SupplierPage.jsx';

// --- OPERATIONS (PROJECTS) PAGES ---
import ProjectPage from './pages/operations/ProjectPage.jsx';
import ProjectDetailsPage from './pages/operations/ProjectDetailsPage.jsx';
import ProjectForm from './pages/operations/ProjectForm.jsx';
import ArchivedProjectsPage from './pages/operations/ArchivedProjectsPage.jsx'; // <-- THE MISSING IMPORT

// --- FINANCE (REQUISITIONS) PAGES ---
import RequisitionPage from './pages/finance/RequisitionPage.jsx';
import RequisitionForm from './pages/finance/RequisitionForm.jsx';
import RequisitionDetailsPage from './pages/finance/RequisitionDetailsPage.jsx';

// --- SUPPORT TICKETS PAGES ---
import SupportTicketPage from './pages/support/SupportTicketPage.jsx';
import TicketDetailsPage from './pages/support/TicketDetailsPage.jsx';


function App() {
    return (
        <AuthProvider>
            <Router>
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored"
                />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Protected Routes inside the Main Layout */}
                    <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        <Route index element={<Dashboard />} /> 
                        <Route path="dashboard" element={<Dashboard />} />
                        
                        {/* User & Role Management */}
                        <Route path="users" element={<ProtectedRoute requiredPermission="USER_READ"><UserManagement /></ProtectedRoute>} />
                        <Route path="users/new" element={<ProtectedRoute requiredPermission="USER_CREATE"><UserForm /></ProtectedRoute>} />
                        <Route path="users/edit/:id" element={<ProtectedRoute requiredPermission="USER_UPDATE"><UserForm /></ProtectedRoute>} />
                        <Route path="users/deactivated" element={<ProtectedRoute requiredPermission="USER_READ"><DeactivatedUsers /></ProtectedRoute>} />
                        <Route path="roles" element={<ProtectedRoute requiredPermission="ROLE_READ"><RoleManagement /></ProtectedRoute>} />
                        <Route path="roles/new" element={<ProtectedRoute requiredPermission="ROLE_CREATE"><RoleForm /></ProtectedRoute>} />
                        <Route path="roles/edit/:id" element={<ProtectedRoute requiredPermission="ROLE_UPDATE"><RoleForm /></ProtectedRoute>} />
                        <Route path="profile" element={<ProfileViewPage />} />
                        <Route path="profile/edit" element={<ProfileEditPage />} />

                        {/* Inventory & Supplier Management */}
                        <Route path="inventory" element={<ProtectedRoute requiredPermission="ITEM_READ"><InventoryPage /></ProtectedRoute>} />
                        <Route path="inventory/new" element={<ProtectedRoute requiredPermission="ITEM_CREATE"><InventoryForm /></ProtectedRoute>} />
                        <Route path="inventory/edit/:id" element={<ProtectedRoute requiredPermission="ITEM_UPDATE"><InventoryForm /></ProtectedRoute>} />
                        <Route path="inventory/items/:id" element={<ProtectedRoute requiredPermission="ITEM_READ"><ItemDetailsPage /></ProtectedRoute>} />
                        <Route path="inventory/transactions" element={<ProtectedRoute requiredPermission="ITEM_READ"><TransactionHistoryPage /></ProtectedRoute>} />
                        <Route path="suppliers" element={<ProtectedRoute requiredPermission="SUPPLIER_READ"><SupplierPage /></ProtectedRoute>} />
                        <Route path="categories" element={<ProtectedRoute requiredPermission="ITEM_READ"><CategoryManagementPage /></ProtectedRoute>} />
                        
                        {/* Operations Management */}
                        <Route path="projects" element={<ProtectedRoute requiredPermission="PROJECT_READ"><ProjectPage /></ProtectedRoute>} />
                        <Route path="projects/:id" element={<ProtectedRoute requiredPermission="PROJECT_READ"><ProjectDetailsPage /></ProtectedRoute>} />
                        <Route path="projects/new" element={<ProtectedRoute requiredPermission="PROJECT_CREATE"><ProjectForm /></ProtectedRoute>} />
                        <Route path="projects/edit/:id" element={<ProtectedRoute requiredPermission="PROJECT_UPDATE"><ProjectForm /></ProtectedRoute>} />
                        <Route path="projects/archived" element={<ProtectedRoute requiredPermission="PROJECT_READ"><ArchivedProjectsPage /></ProtectedRoute>} /> {/* <-- THE MISSING ROUTE */}

                        {/* Finance Management */}
                        <Route path="requisitions" element={<ProtectedRoute><RequisitionPage /></ProtectedRoute>} />
                        <Route path="requisitions/new" element={<ProtectedRoute requiredPermission="REQUISITION_CREATE"><RequisitionForm /></ProtectedRoute>} />
                        <Route path="requisitions/:id" element={<ProtectedRoute><RequisitionDetailsPage /></ProtectedRoute>} />
                        <Route path="requisitions/edit/:id" element={<ProtectedRoute requiredPermission="REQUISITION_CREATE"><RequisitionForm /></ProtectedRoute>} />

                        {/* Support Tickets */}
                        <Route path="support/tickets" element={<ProtectedRoute><SupportTicketPage /></ProtectedRoute>} />
                        <Route path="support/tickets/:id" element={<ProtectedRoute><TicketDetailsPage /></ProtectedRoute>} />
                    </Route>
                    
                    {/* Catch-all Route for 404 Not Found */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;