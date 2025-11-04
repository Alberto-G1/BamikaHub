import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTruck, FaTimes } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import './SupplierStyles.css';

const SupplierPage = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = useAuth();

    // Modal and Form State
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState({
        id: null, name: '', contactPerson: '', email: '', phone: '', address: ''
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/suppliers');
            setSuppliers(response.data);
        } catch (err) {
            toast.error('Failed to fetch suppliers.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setIsEditMode(false);
        setCurrentSupplier({ id: null, name: '', contactPerson: '', email: '', phone: '', address: '' });
    };

    const handleShowCreateModal = () => {
        setIsEditMode(false);
        setCurrentSupplier({ id: null, name: '', contactPerson: '', email: '', phone: '', address: '' });
        setShowModal(true);
    };

    const handleShowEditModal = (supplier) => {
        setIsEditMode(true);
        setCurrentSupplier(supplier);
        setShowModal(true);
    };
    
    const handleFormChange = (e) => {
        setCurrentSupplier({ ...currentSupplier, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await api.put(`/suppliers/${currentSupplier.id}`, currentSupplier);
                toast.success('Supplier updated successfully!');
            } else {
                await api.post('/suppliers', currentSupplier);
                toast.success('Supplier created successfully!');
            }
            fetchSuppliers();
            handleCloseModal();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save supplier.');
        }
    };

    // This function now only performs the delete action
    const handleDelete = async (supplierId, supplierName) => {
        try {
            await api.delete(`/suppliers/${supplierId}`);
            toast.warn(`Supplier '${supplierName}' deleted.`);
            fetchSuppliers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete supplier. It may be linked to an inventory item.');
        }
    };
    
    // NEW: Custom confirmation toast for delete action
    const confirmDelete = (supplierId, supplierName) => {
        const toastId = toast.error(
            <div>
                <p>Delete supplier <strong>{supplierName}</strong>?</p>
                <p className="small text-muted">This action cannot be undone.</p>
                <div className="mt-3">
                    <Button variant="danger" size="sm" className="me-2" onClick={() => { handleDelete(supplierId, supplierName); toast.dismiss(toastId); }}>
                        Yes, Delete
                    </Button>
                    <Button variant="light" size="sm" onClick={() => toast.dismiss(toastId)}>
                        Cancel
                    </Button>
                </div>
            </div>,
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                position: "top-center",
                theme: "colored"
            }
        );
    };


    if (loading) {
        return (
            <section className="supplier-page">
                <div className="supplier-loading">
                    <span className="supplier-spinner" aria-hidden="true" />
                    <p>Loading suppliers...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="supplier-page">
            {/* Hero Banner */}
            <div className="supplier-banner" data-animate="fade-up">
                <div className="supplier-banner__content">
                    <div className="supplier-banner__info">
                        <div className="supplier-banner__eyebrow">
                            <FaTruck aria-hidden="true" />
                            <span>Supply Chain</span>
                        </div>
                        <h1 className="supplier-banner__title">Supplier Management</h1>
                        <p className="supplier-banner__subtitle">
                            Manage your trusted partners, track contact details, and maintain strong relationships with your supply chain network.
                        </p>
                    </div>

                    <div className="supplier-banner__actions">
                        {hasPermission('SUPPLIER_CREATE') && (
                            <button 
                                type="button" 
                                className="supplier-btn supplier-btn--gold" 
                                onClick={handleShowCreateModal}
                            >
                                <FaPlus aria-hidden="true" />
                                <span>Add Supplier</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="supplier-table-container" data-animate="fade-up" data-delay="0.08">
                {suppliers.length === 0 ? (
                    <div className="supplier-empty-state">
                        No suppliers found. Create your first supplier to start building your supply chain network.
                    </div>
                ) : (
                    <table className="supplier-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact Person</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map(supplier => (
                                <tr key={supplier.id}>
                                    <td><strong>{supplier.name}</strong></td>
                                    <td>{supplier.contactPerson || 'N/A'}</td>
                                    <td>{supplier.email || 'N/A'}</td>
                                    <td>{supplier.phone || 'N/A'}</td>
                                    <td>
                                        <div className="supplier-table__actions">
                                            {hasPermission('SUPPLIER_UPDATE') && (
                                                <button 
                                                    type="button"
                                                    className="supplier-btn supplier-btn--icon supplier-btn--gold" 
                                                    onClick={() => handleShowEditModal(supplier)}
                                                    title="Edit Supplier"
                                                >
                                                    <FaEdit />
                                                </button>
                                            )}
                                            {hasPermission('SUPPLIER_DELETE') && (
                                                <button 
                                                    type="button"
                                                    className="supplier-btn supplier-btn--icon supplier-btn--red" 
                                                    onClick={() => confirmDelete(supplier.id, supplier.name)}
                                                    title="Delete Supplier"
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Supplier Modal */}
            {showModal && (
                <div className="supplier-modal" onClick={(e) => {
                    if (e.target.className === 'supplier-modal') handleCloseModal();
                }}>
                    <div className="supplier-modal__dialog">
                        <div className="supplier-modal__header">
                            <h2 className="supplier-modal__title">
                                {isEditMode ? 'Edit Supplier' : 'Add New Supplier'}
                            </h2>
                            <button 
                                type="button" 
                                className="supplier-modal__close"
                                onClick={handleCloseModal}
                                aria-label="Close modal"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="supplier-modal__body">
                                <div className="supplier-form">
                                    <div className="supplier-form-group">
                                        <label htmlFor="supplierName">Supplier Name</label>
                                        <input
                                            id="supplierName"
                                            type="text"
                                            name="name"
                                            className="supplier-input"
                                            value={currentSupplier.name}
                                            onChange={handleFormChange}
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div className="supplier-form-group">
                                        <label htmlFor="contactPerson">Contact Person</label>
                                        <input
                                            id="contactPerson"
                                            type="text"
                                            name="contactPerson"
                                            className="supplier-input"
                                            value={currentSupplier.contactPerson || ''}
                                            onChange={handleFormChange}
                                        />
                                    </div>

                                    <div className="supplier-form-group">
                                        <label htmlFor="email">Email</label>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            className="supplier-input"
                                            value={currentSupplier.email || ''}
                                            onChange={handleFormChange}
                                        />
                                    </div>

                                    <div className="supplier-form-group">
                                        <label htmlFor="phone">Phone</label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            name="phone"
                                            className="supplier-input"
                                            value={currentSupplier.phone || ''}
                                            onChange={handleFormChange}
                                            placeholder="+256..."
                                        />
                                    </div>

                                    <div className="supplier-form-group">
                                        <label htmlFor="address">Address</label>
                                        <textarea
                                            id="address"
                                            name="address"
                                            className="supplier-textarea"
                                            rows={3}
                                            value={currentSupplier.address || ''}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="supplier-modal__footer">
                                <button 
                                    type="button" 
                                    className="supplier-btn supplier-btn--blue"
                                    onClick={handleCloseModal}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="supplier-btn supplier-btn--gold"
                                >
                                    <span>{isEditMode ? 'Update' : 'Save'} Supplier</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default SupplierPage;