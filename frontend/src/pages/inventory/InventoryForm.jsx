import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBoxOpen, FaSave, FaUpload, FaWarehouse } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import placeholderImage from '../../assets/images/placeholder.jpg';
import './InventoryStyles.css';

const InventoryForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '', sku: '', categoryId: '', description: '',
        quantity: 0, reorderLevel: 0, unitPrice: '',
        supplierId: '', location: '', isActive: true, version: 0
    });
    
    const [imageUrl, setImageUrl] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchSupportData = async () => {
            try {
                const [suppliersRes, categoriesRes] = await Promise.all([
                    api.get('/suppliers'),
                    api.get('/categories')
                ]);
                setSuppliers(suppliersRes.data);
                setCategories(categoriesRes.data);
            } catch (error) {
                toast.error("Failed to load suppliers and categories.");
            }
        };

        const fetchItemData = async () => {
            if (isEditMode) {
                try {
                    const res = await api.get(`/inventory/items/${id}`);
                    const item = res.data;
                    setFormData({
                        name: item.name || '',
                        sku: item.sku || '',
                        categoryId: item.category?.id || '',
                        description: item.description || '',
                        quantity: item.quantity || 0,
                        reorderLevel: item.reorderLevel || 0,
                        unitPrice: item.unitPrice || '',
                        supplierId: item.supplier?.id || '',
                        location: item.location || '',
                        isActive: item.isActive,
                        version: item.version,
                    });
                    setImageUrl(item.imageUrl);
                } catch (error) {
                    toast.error('Failed to load item data.');
                    navigate('/inventory');
                }
            }
        };
        
        const loadAll = async () => {
            setLoading(true);
            await fetchSupportData();
            await fetchItemData();
            setLoading(false);
        };
        
        loadAll();
    }, [id, isEditMode, navigate]);

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !id) return;

        const apiFormData = new FormData();
        apiFormData.append('file', file);
        setUploading(true);
        try {
            const res = await api.post(`/inventory/items/${id}/image`, apiFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImageUrl(res.data.imageUrl);
            toast.success("Image uploaded successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Image upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await api.put(`/inventory/items/${id}`, formData);
                toast.success("Item updated successfully!");
            } else {
                await api.post('/inventory/items', formData);
                toast.success("Item created successfully!");
            }
            navigate('/inventory');
        } catch (err) {
            toast.error(err.response?.data?.message || "An error occurred.");
        }
    };

    if (loading) {
        return (
            <section className="inventory-page inventory-page--centered">
                <div className="inventory-loading">
                    <span className="inventory-spinner" aria-hidden="true" />
                    <p>Loading item configuration...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="inventory-page inventory-form-page">
            <div className="inventory-form-banner" data-animate="fade-up">
                <button type="button" className="inventory-ghost-btn" onClick={() => navigate(-1)}>
                    <FaArrowLeft aria-hidden="true" />
                    <span>Back</span>
                </button>

                <div className="inventory-form-banner__content">
                    <div className="inventory-banner__eyebrow">Inventory Control</div>
                    <h2 className="inventory-banner__title">
                        {isEditMode ? 'Edit Item Details' : 'Create New Inventory Item'}
                    </h2>
                    <p className="inventory-banner__subtitle">
                        {isEditMode
                            ? 'Refresh product details, supplier links, and reorder thresholds to keep inventory accurate.'
                            : 'Create a new catalogue entry with supplier links and replenishment settings.'}
                    </p>

                    <div className="inventory-banner__meta">
                        <div className="inventory-banner__meta-item">
                            <span className="inventory-meta-label">Status</span>
                            <span className="inventory-meta-value">
                                {formData.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="inventory-banner__meta-item">
                            <span className="inventory-meta-label">Reorder Level</span>
                            <span className="inventory-meta-value">{formData.reorderLevel || 0}</span>
                        </div>
                        <div className="inventory-banner__meta-item">
                            <span className="inventory-meta-label">Tracking SKU</span>
                            <span className="inventory-meta-value">{formData.sku || 'Pending'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <form className="inventory-form-shell" onSubmit={handleSubmit} data-animate="fade-up" data-delay="0.08">
                <section className="inventory-form-section inventory-form-section--two-column">
                    <div className="inventory-form-section__main">
                        <header className="inventory-form-section__header">
                            <div>
                                <h3>Item Information</h3>
                                <p>Basic details that appear across the platform, including item name and pricing.</p>
                            </div>
                            <span className="inventory-chip">
                                <FaBoxOpen aria-hidden="true" /> Core Data
                            </span>
                        </header>

                        <div className="inventory-form-grid">
                            <div className="inventory-form-group">
                                <label htmlFor="itemName">Item Name</label>
                                <input
                                    id="itemName"
                                    name="name"
                                    className="inventory-input"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="inventory-form-group">
                                <label htmlFor="itemSku">SKU (Stock Keeping Unit)</label>
                                <input
                                    id="itemSku"
                                    name="sku"
                                    className="inventory-input"
                                    value={formData.sku}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="inventory-form-group">
                                <label htmlFor="categoryId">Category</label>
                                <select
                                    id="categoryId"
                                    name="categoryId"
                                    className="inventory-select"
                                    value={formData.categoryId}
                                    onChange={handleFormChange}
                                    required
                                >
                                    <option value="">Select a category...</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="inventory-form-group">
                                <label htmlFor="unitPrice">Unit Price (UGX)</label>
                                <input
                                    id="unitPrice"
                                    type="number"
                                    min="0"
                                    name="unitPrice"
                                    className="inventory-input"
                                    value={formData.unitPrice}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="inventory-form-group inventory-form-group--full">
                                <label htmlFor="itemDescription">Description</label>
                                <textarea
                                    id="itemDescription"
                                    name="description"
                                    className="inventory-textarea"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleFormChange}
                                />
                            </div>
                        </div>
                    </div>

                    {isEditMode && (
                        <aside className="inventory-form-preview">
                            <div className="inventory-form-preview__media">
                                <img
                                    src={imageUrl ? `http://localhost:8080${imageUrl}` : placeholderImage}
                                    alt={formData.name || 'Inventory item preview'}
                                />
                                <div className="inventory-form-preview__badge">
                                    <FaWarehouse aria-hidden="true" />
                                    <span>{formData.location || 'Unassigned Location'}</span>
                                </div>
                            </div>

                            <dl className="inventory-form-preview__meta">
                                <div>
                                    <dt>On Hand</dt>
                                    <dd>{formData.quantity}</dd>
                                </div>
                                <div>
                                    <dt>Reorder Level</dt>
                                    <dd>{formData.reorderLevel}</dd>
                                </div>
                                <div>
                                    <dt>Supplier</dt>
                                    <dd>{suppliers.find(supplier => String(supplier.id) === String(formData.supplierId))?.name || 'No Supplier'}</dd>
                                </div>
                            </dl>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="sr-only"
                                accept="image/png, image/jpeg, image/gif"
                                onChange={handleImageUpload}
                            />

                            <button
                                type="button"
                                className="inventory-secondary-btn inventory-secondary-btn--wide"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                <FaUpload aria-hidden="true" />
                                <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                            </button>
                        </aside>
                    )}
                </section>

                <section className="inventory-form-section">
                    <header className="inventory-form-section__header">
                        <div>
                            <h3>Stock Settings</h3>
                            <p>Configure stock levels and alerts to stay ahead of shortages.</p>
                        </div>
                    </header>

                    <div className="inventory-form-grid">
                        <div className="inventory-form-group">
                            <label htmlFor="itemQuantity">Initial Quantity</label>
                            <input
                                id="itemQuantity"
                                type="number"
                                min="0"
                                name="quantity"
                                className="inventory-input"
                                value={formData.quantity}
                                onChange={handleFormChange}
                                required
                                disabled={isEditMode}
                            />
                            {isEditMode && (
                                <p className="inventory-form-helper">Quantity updates happen through stock transactions.</p>
                            )}
                        </div>

                        <div className="inventory-form-group">
                            <label htmlFor="reorderLevel">Reorder Level</label>
                            <input
                                id="reorderLevel"
                                type="number"
                                min="0"
                                name="reorderLevel"
                                className="inventory-input"
                                value={formData.reorderLevel}
                                onChange={handleFormChange}
                                required
                            />
                        </div>

                        <div className="inventory-form-group inventory-form-group--toggle">
                            <span>Item Visibility</span>
                            <label className="inventory-toggle">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleFormChange}
                                />
                                <span className="inventory-toggle__slider" aria-hidden="true" />
                                <span className="inventory-toggle__label">
                                    {formData.isActive ? 'Active in catalogue' : 'Hidden from listings'}
                                </span>
                            </label>
                        </div>
                    </div>
                </section>

                <section className="inventory-form-section">
                    <header className="inventory-form-section__header">
                        <div>
                            <h3>Supplier &amp; Location</h3>
                            <p>Link trusted suppliers and track where items live in your warehouse map.</p>
                        </div>
                    </header>

                    <div className="inventory-form-grid">
                        <div className="inventory-form-group">
                            <label htmlFor="supplierId">Supplier</label>
                            <select
                                id="supplierId"
                                name="supplierId"
                                className="inventory-select"
                                value={formData.supplierId}
                                onChange={handleFormChange}
                            >
                                <option value="">No supplier assigned</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="inventory-form-group">
                            <label htmlFor="location">Storage Location</label>
                            <input
                                id="location"
                                name="location"
                                className="inventory-input"
                                value={formData.location}
                                onChange={handleFormChange}
                                placeholder="e.g. Aisle 4 - Shelf B"
                            />
                        </div>
                    </div>
                </section>

                <footer className="inventory-form-actions">
                    <button type="button" className="inventory-secondary-btn" onClick={() => navigate('/inventory')}>
                        Cancel
                    </button>
                    <button type="submit" className="inventory-primary-btn">
                        <FaSave aria-hidden="true" />
                        <span>{isEditMode ? 'Update Item' : 'Create Item'}</span>
                    </button>
                </footer>
            </form>
        </section>
    );
};

export default InventoryForm;