import React, { useState, useEffect, useMemo } from 'react';
import { FaBoxes, FaDolly, FaExclamationTriangle, FaPlus, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import placeholderImage from '../../assets/images/placeholder.jpg';
import './InventoryStyles.css';

// Reusable currency formatter
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'USh 0';
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const InventoryPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await api.get('/inventory/items');
            setItems(response.data);
        } catch (err) {
            toast.error('Failed to fetch inventory items.');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        if (!items) return [];
        return items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.category && item.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [items, searchQuery]);

    // RESTORED: Dashboard card metrics calculated using useMemo for efficiency
    const { totalStockValue, lowStockItems, outOfStockItems } = useMemo(() => {
        if (!items) return { totalStockValue: 0, lowStockItems: 0, outOfStockItems: 0 };
        return {
            totalStockValue: items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0),
            lowStockItems: items.filter(item => item.quantity > 0 && item.quantity <= item.reorderLevel).length,
            outOfStockItems: items.filter(item => item.quantity === 0).length
        };
    }, [items]);

    const getStockStatus = (item) => {
        if (item.quantity === 0) return 'out';
        if (item.quantity <= item.reorderLevel) return 'low';
        return 'healthy';
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'out':
                return 'Out of Stock';
            case 'low':
                return 'Low Stock';
            default:
                return 'In Stock';
        }
    };

    if (loading) {
        return (
            <section className="inventory-page inventory-page--centered">
                <div className="inventory-loading">
                    <span className="inventory-spinner" aria-hidden="true" />
                    <p>Loading inventory overview...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="inventory-page inventory-dashboard" data-page-pattern="hero">
            <div className="inventory-hero" data-animate="fade-up">
                <div className="inventory-hero__content">
                    <div className="inventory-banner__eyebrow">Inventory Pulse</div>
                    <h2 className="inventory-banner__title">Warehouse Command Center</h2>
                    <p className="inventory-banner__subtitle">
                        Monitor valuation, spot low stock signals, and keep your fulfilment teams aligned in real time.
                    </p>

                    <div className="inventory-hero__actions">
                        {hasPermission('ITEM_CREATE') && (
                            <button type="button" className="inventory-primary-btn" onClick={() => navigate('/inventory/new')}>
                                <FaPlus aria-hidden="true" />
                                <span>Add New Item</span>
                            </button>
                        )}
                        <div className="inventory-hero__hint">{filteredItems.length} of {items.length} items visible</div>
                    </div>
                </div>

                <div className="inventory-hero__stats">
                    <div className="inventory-hero-card">
                        <div className="inventory-hero-card__icon inventory-hero-card__icon--primary">
                            <FaBoxes aria-hidden="true" />
                        </div>
                        <span className="inventory-hero-card__label">Total Stock Value</span>
                        <span className="inventory-hero-card__value">{formatCurrency(totalStockValue)}</span>
                        <span className="inventory-hero-card__hint">Across {items.length} tracked items</span>
                    </div>
                    <div className="inventory-hero-card">
                        <div className="inventory-hero-card__icon inventory-hero-card__icon--warning">
                            <FaExclamationTriangle aria-hidden="true" />
                        </div>
                        <span className="inventory-hero-card__label">Low Stock Alerts</span>
                        <span className="inventory-hero-card__value">{lowStockItems}</span>
                        <span className="inventory-hero-card__hint">Requires reorder attention</span>
                    </div>
                    <div className="inventory-hero-card">
                        <div className="inventory-hero-card__icon inventory-hero-card__icon--danger">
                            <FaDolly aria-hidden="true" />
                        </div>
                        <span className="inventory-hero-card__label">Out of Stock</span>
                        <span className="inventory-hero-card__value">{outOfStockItems}</span>
                        <span className="inventory-hero-card__hint">Ready for restock</span>
                    </div>
                </div>
            </div>

            <div className="inventory-search-panel" data-animate="fade-up" data-delay="0.08">
                <div className="inventory-search-panel__field">
                    <FaSearch aria-hidden="true" />
                    <input
                        type="text"
                        placeholder="Search by name, SKU, or category..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                    />
                </div>
                <div className="inventory-search-panel__meta">
                    <span>
                        Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong> items
                    </span>
                    <span className="inventory-search-panel__meta-divider" aria-hidden="true">•</span>
                    <span>
                        Total valuation <strong>{formatCurrency(totalStockValue)}</strong>
                    </span>
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div className="inventory-empty-state" data-animate="fade-up" data-delay="0.12">
                    No inventory matches your search. Try adjusting the keywords or create a new item.
                </div>
            ) : (
                <div className="inventory-item-grid" data-animate="fade-up" data-delay="0.12">
                    {filteredItems.map((item) => {
                        const status = getStockStatus(item);
                        return (
                            <article
                                key={item.id}
                                className={`inventory-item-card inventory-item-card--${status}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => navigate(`/inventory/items/${item.id}`)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        navigate(`/inventory/items/${item.id}`);
                                    }
                                }}
                            >
                                <div className="inventory-item-card__media">
                                    <img
                                        src={item.imageUrl ? `http://localhost:8080${item.imageUrl}` : placeholderImage}
                                        alt={item.name}
                                    />
                                    {item.category && (
                                        <span className="inventory-item-card__badge">{item.category.name}</span>
                                    )}
                                </div>

                                <div className="inventory-item-card__body">
                                    <h3>{item.name}</h3>
                                    <p>{item.sku}</p>

                                    <div className="inventory-item-card__meta">
                                        <div>
                                            <span className="inventory-meta-label">On Hand</span>
                                            <span className="inventory-meta-value">{item.quantity.toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="inventory-meta-label">Unit Price</span>
                                            <span className="inventory-meta-value">{formatCurrency(item.unitPrice)}</span>
                                        </div>
                                    </div>
                                </div>

                                <footer className="inventory-item-card__footer">
                                    <span className={`inventory-status inventory-status--${status}`}>
                                        {getStatusLabel(status)}
                                    </span>
                                    <span className="inventory-item-card__cta">View Details →</span>
                                </footer>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default InventoryPage;