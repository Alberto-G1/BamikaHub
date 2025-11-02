import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTags, FaTimes } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import './InventoryStyles.css';

const CategoryManagementPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = useAuth();

    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ id: null, name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
    const [dialogConfig, setDialogConfig] = useState({ open: false });

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

    const handleSave = async (event) => {
        event.preventDefault();
        if (!currentCategory.name.trim()) {
            toast.warn('Please provide a category name.');
            return;
        }

        setSubmitting(true);
        try {
            if (isEditMode) {
                await api.put(`/categories/${currentCategory.id}`, {
                    name: currentCategory.name.trim(),
                    description: currentCategory.description?.trim() || '',
                });
                toast.success('Category updated successfully!');
            } else {
                await api.post('/categories', {
                    name: currentCategory.name.trim(),
                    description: currentCategory.description?.trim() || '',
                });
                toast.success('Category created successfully!');
            }
            fetchCategories();
            handleCloseModal();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save category.');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = (category) => {
        setDialogConfig({
            open: true,
            tone: 'danger',
            title: 'Delete Category',
            message: `Delete the category '${category.name}'?`,
            detail: 'This action cannot be undone and will remove the category immediately.',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            onConfirm: () => handleDelete(category.id, category.name),
        });
    };

    const closeDialog = () => setDialogConfig(prev => ({ ...prev, open: false }));

    const handleDelete = async (categoryId, categoryName) => {
        closeDialog();
        try {
            await api.delete(`/categories/${categoryId}`);
            toast.warn(`Category '${categoryName}' deleted.`);
            fetchCategories();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete category.');
        }
    };

    if (loading) {
        return (
            <section className="inventory-page inventory-page--centered">
                <div className="inventory-loading">
                    <span className="inventory-spinner" aria-hidden="true" />
                    <p>Loading categories...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="inventory-page">
            <div className="inventory-banner inventory-banner--categories" data-animate="fade-up">
                <div className="inventory-banner__content">
                    <div className="inventory-banner__eyebrow">Inventory Settings</div>
                    <h2 className="inventory-banner__title">Category Management</h2>
                    <p className="inventory-banner__subtitle">
                        Organize your catalogue into meaningful groups to keep replenishment fast and reporting effortless.
                    </p>

                    <div className="inventory-banner__meta">
                        <div className="inventory-banner__meta-item">
                            <span className="inventory-meta-label">Categories</span>
                            <span className="inventory-meta-value">{categories.length}</span>
                        </div>
                        <div className="inventory-banner__meta-item">
                            <span className="inventory-meta-label">With Details</span>
                            <span className="inventory-meta-value">{categories.filter(cat => cat.description).length}</span>
                        </div>
                        <div className="inventory-banner__meta-item">
                            <span className="inventory-meta-label">Last Updated</span>
                            <span className="inventory-meta-value">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="inventory-banner__actions">
                    {hasPermission('ITEM_CREATE') && (
                        <button type="button" className="inventory-primary-btn" onClick={handleShowCreateModal}>
                            <FaPlus aria-hidden="true" />
                            <span>Add Category</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="inventory-grid" data-animate="fade-up" data-delay="0.08">
                {categories.length === 0 ? (
                    <div className="inventory-empty-state">
                        No categories yet. Create your first category to start grouping items.
                    </div>
                ) : (
                    categories.map(category => (
                        <article key={category.id} className="inventory-card">
                            <header className="inventory-card__header">
                                <div className="inventory-card__icon" aria-hidden="true">
                                    <FaTags />
                                </div>
                                <div>
                                    <h3 className="inventory-card__title">{category.name}</h3>
                                    <p className="inventory-card__subtitle">
                                        {category.description ? 'Custom grouping' : 'No description yet'}
                                    </p>
                                </div>
                            </header>

                            <p className="inventory-card__description">
                                {category.description || 'Add a short summary so teammates know when to use this category.'}
                            </p>

                            <footer className="inventory-card__footer">
                                {hasPermission('ITEM_UPDATE') && (
                                    <button
                                        type="button"
                                        className="inventory-icon-btn inventory-icon-btn--edit"
                                        onClick={() => handleShowEditModal(category)}
                                    >
                                        <FaEdit />
                                        <span>Edit</span>
                                    </button>
                                )}

                                {hasPermission('ITEM_DELETE') && (
                                    <button
                                        type="button"
                                        className="inventory-icon-btn inventory-icon-btn--danger"
                                        onClick={() => confirmDelete(category)}
                                    >
                                        <FaTrash />
                                        <span>Delete</span>
                                    </button>
                                )}
                            </footer>
                        </article>
                    ))
                )}
            </div>

            {showModal && (
                <div className="inventory-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
                    <div className="inventory-modal__overlay" onClick={handleCloseModal} />
                    <div className="inventory-modal__dialog">
                        <header className="inventory-modal__header">
                            <h3 id="category-modal-title" className="inventory-modal__title">
                                {isEditMode ? 'Edit Category' : 'Add New Category'}
                            </h3>
                            <button type="button" className="inventory-modal__close" onClick={handleCloseModal}>
                                <FaTimes aria-hidden="true" />
                                <span className="sr-only">Close</span>
                            </button>
                        </header>

                        <form className="inventory-modal__body" onSubmit={handleSave}>
                            <div className="inventory-form-group">
                                <label htmlFor="categoryName">Category Name</label>
                                <input
                                    id="categoryName"
                                    name="name"
                                    className="inventory-input"
                                    type="text"
                                    value={currentCategory.name}
                                    onChange={handleFormChange}
                                    required
                                    disabled={submitting}
                                />
                            </div>

                            <div className="inventory-form-group">
                                <label htmlFor="categoryDescription">Description</label>
                                <textarea
                                    id="categoryDescription"
                                    name="description"
                                    className="inventory-textarea"
                                    rows={4}
                                    value={currentCategory.description || ''}
                                    onChange={handleFormChange}
                                    disabled={submitting}
                                />
                            </div>

                            <footer className="inventory-modal__footer">
                                <button type="button" className="inventory-secondary-btn" onClick={handleCloseModal} disabled={submitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="inventory-primary-btn" disabled={submitting}>
                                    <span>{submitting ? 'Saving...' : 'Save Category'}</span>
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={dialogConfig.open}
                tone={dialogConfig.tone}
                title={dialogConfig.title || ''}
                message={dialogConfig.message || ''}
                detail={dialogConfig.detail}
                confirmLabel={dialogConfig.confirmLabel}
                cancelLabel={dialogConfig.cancelLabel}
                onConfirm={dialogConfig.onConfirm}
                onCancel={closeDialog}
            />
        </section>
    );
};

export default CategoryManagementPage;