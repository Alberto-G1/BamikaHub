import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx'; 
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import UserManagement from './pages/UserManagement.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import RoleManagement from './pages/RoleManagement.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RoleForm from './pages/RoleForm.jsx'; 
import UserForm from './pages/UserForm.jsx'; 
import ProfileViewPage from './pages/ProfileViewPage.jsx';
import ProfileEditPage from './pages/ProfileEditPage.jsx';
import DeactivatedUsers from './pages/DeactivatedUsers.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import InventoryForm from './pages/InventoryForm.jsx';
import SupplierPage from './pages/SupplierPage.jsx';
import TransactionHistoryPage from './pages/TransactionHistoryPage.jsx';


// We will create this simple NotFound component for now
const NotFound = () => <h1>404 - Page Not Found</h1>;

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
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    <Route 
                        path="/" 
                        element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        }
                    >
                        {/* The index route will render when the path is exactly "/" */}
                        <Route index element={<Dashboard />} /> 
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="profile" element={<ProfileViewPage />} />
                        <Route path="profile/edit" element={<ProfileEditPage />} />
                        <Route 
                            path="users" 
                            element={
                                <ProtectedRoute requiredPermission="USER_READ">
                                    <UserManagement />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="users/new" 
                            element={ <ProtectedRoute requiredPermission="USER_CREATE"><UserForm /></ProtectedRoute> } 
                        />
                        <Route 
                            path="users/edit/:id" 
                            element={ <ProtectedRoute requiredPermission="USER_UPDATE"><UserForm /></ProtectedRoute> } 
                        />
                        <Route 
                            path="users/deactivated" 
                            element={ <ProtectedRoute requiredPermission="USER_READ"><DeactivatedUsers /></ProtectedRoute> } 
                        />
                        <Route 
                          path="roles" 
                            element={
                                <ProtectedRoute requiredPermission="ROLE_READ">
                                    <RoleManagement />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="roles/new" 
                            element={ <ProtectedRoute requiredPermission="ROLE_CREATE"><RoleForm /></ProtectedRoute> } 
                        />
                        <Route 
                            path="roles/edit/:id" 
                            element={ <ProtectedRoute requiredPermission="ROLE_UPDATE"><RoleForm /></ProtectedRoute> } 
                        />
                        <Route path="inventory" element={<ProtectedRoute requiredPermission="ITEM_READ"><InventoryPage /></ProtectedRoute>} />
                        <Route path="inventory/new" element={<ProtectedRoute requiredPermission="ITEM_CREATE"><InventoryForm /></ProtectedRoute>} />
                        <Route path="inventory/edit/:id" element={<ProtectedRoute requiredPermission="ITEM_UPDATE"><InventoryForm /></ProtectedRoute>} />
                        <Route path="suppliers" element={<ProtectedRoute requiredPermission="SUPPLIER_READ"><SupplierPage /></ProtectedRoute>} />
                        <Route path="inventory/transactions" element={<ProtectedRoute requiredPermission="ITEM_READ"><TransactionHistoryPage /></ProtectedRoute>} />

                        {/* Add other routes for inventory, suppliers, etc. here */}
                    </Route>
                    
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;