import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Card, Modal, Form } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaTruck } from 'react-icons/fa';
import api from '../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';

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


    if (loading) return <Spinner animation="border" />;

    return (
        <>
            <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <Card.Title as="h3" className="mb-0 d-flex align-items-center">
                        <FaTruck className="me-3" /> Supplier Management
                    </Card.Title>
                    {hasPermission('SUPPLIER_CREATE') && (
                        <Button variant="primary" onClick={handleShowCreateModal}>
                            <FaPlus className="me-2" /> Add Supplier
                        </Button>
                    )}
                </Card.Header>
                <Card.Body>
                    <Table striped bordered hover responsive>
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
                                    <td>{supplier.name}</td>
                                    <td>{supplier.contactPerson || 'N/A'}</td>
                                    <td>{supplier.email || 'N/A'}</td>
                                    <td>{supplier.phone || 'N/A'}</td>
                                    <td>
                                        {hasPermission('SUPPLIER_UPDATE') && (
                                            <Button variant="outline-warning" size="sm" className="me-2" onClick={() => handleShowEditModal(supplier)}>
                                                <FaEdit />
                                            </Button>
                                        )}
                                        {hasPermission('SUPPLIER_DELETE') && (
                                            // UPDATED: Calls the new confirmation toast function
                                            <Button variant="outline-danger" size="sm" onClick={() => confirmDelete(supplier.id, supplier.name)}>
                                                <FaTrash />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Add/Edit Supplier Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? 'Edit Supplier' : 'Add New Supplier'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Supplier Name</Form.Label>
                            <Form.Control type="text" name="name" value={currentSupplier.name} onChange={handleFormChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Contact Person</Form.Label>
                            <Form.Control type="text" name="contactPerson" value={currentSupplier.contactPerson || ''} onChange={handleFormChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" name="email" value={currentSupplier.email || ''} onChange={handleFormChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Phone</Form.Label>
                            <Form.Control type="tel" name="phone" value={currentSupplier.phone || ''} onChange={handleFormChange} placeholder="+256..." />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control as="textarea" rows={2} name="address" value={currentSupplier.address || ''} onChange={handleFormChange} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        <Button variant="primary" type="submit">Save Supplier</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default SupplierPage;