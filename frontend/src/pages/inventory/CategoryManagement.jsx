import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Card, Modal, Form, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaTags } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';

const CategoryManagementPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = useAuth();

    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ id: null, name: '', description: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
        } catch (err) {
            toast.error('Failed to fetch categories.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setIsEditMode(false);
        setCurrentCategory({ id: null, name: '', description: '' });
    };

    const handleShowCreateModal = () => {
        setIsEditMode(false);
        setCurrentCategory({ id: null, name: '', description: '' });
        setShowModal(true);
    };

    const handleShowEditModal = (category) => {
        setIsEditMode(true);
        setCurrentCategory(category);
        setShowModal(true);
    };
    
    const handleFormChange = (e) => {
        setCurrentCategory({ ...currentCategory, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await api.put(`/categories/${currentCategory.id}`, currentCategory);
                toast.success('Category updated successfully!');
            } else {
                await api.post('/categories', currentCategory);
                toast.success('Category created successfully!');
            }
            fetchCategories();
            handleCloseModal();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save category.');
        }
    };

    const handleDelete = async (categoryId, categoryName) => {
        // We are using a custom toast confirmation here
        const toastId = toast.error(
            <div>
                <p>Delete category <strong>{categoryName}</strong>?</p>
                <div className="mt-2">
                    <Button variant="danger" size="sm" className="me-2" onClick={async () => { 
                        try {
                            await api.delete(`/categories/${categoryId}`);
                            toast.warn(`Category '${categoryName}' deleted.`);
                            fetchCategories();
                        } catch (err) {
                            toast.error(err.response?.data?.message || 'Failed to delete category.');
                        }
                        toast.dismiss(toastId); 
                    }}>Confirm</Button>
                    <Button variant="light" size="sm" onClick={() => toast.dismiss(toastId)}>Cancel</Button>
                </div>
            </div>,
            { autoClose: false, closeOnClick: false, position: "top-center", theme: "colored" }
        );
    };

    if (loading) return <Spinner animation="border" />;

    return (
        <>
            <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                     <Card.Title as="h3" className="mb-0 d-flex align-items-center"><FaTags className="me-3" /> Category Management</Card.Title>
                     {hasPermission('ITEM_CREATE') && (
                        <Button variant="primary" onClick={handleShowCreateModal}>
                            <FaPlus className="me-2" /> Add Category
                        </Button>
                    )}
                </Card.Header>
                <Card.Body>
                    {categories.length === 0 ? (
                        <Alert variant="info">No categories found. Click 'Add Category' to get started.</Alert>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(cat => (
                                    <tr key={cat.id}>
                                        <td>{cat.name}</td>
                                        <td>{cat.description || 'N/A'}</td>
                                        <td>
                                            {hasPermission('ITEM_UPDATE') && (
                                                <Button variant="outline-warning" size="sm" className="me-2" onClick={() => handleShowEditModal(cat)}>
                                                    <FaEdit />
                                                </Button>
                                            )}
                                            {hasPermission('ITEM_DELETE') && (
                                                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(cat.id, cat.name)}>
                                                    <FaTrash />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? 'Edit Category' : 'Add New Category'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body>
                         <Form.Group className="mb-3">
                            <Form.Label>Category Name</Form.Label>
                            <Form.Control type="text" name="name" value={currentCategory.name} onChange={handleFormChange} required />
                        </Form.Group>
                         <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={3} name="description" value={currentCategory.description || ''} onChange={handleFormChange} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        <Button variant="primary" type="submit">Save Category</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default CategoryManagementPage;