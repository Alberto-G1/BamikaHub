import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaExchangeAlt, FaLayerGroup, FaWarehouse } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import StockTransactionModal from '../../components/inventory/StockTransactionModal.jsx';
import placeholderImage from '../../assets/images/placeholder.jpg';
import './InventoryStyles.css';


const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'USh 0';
    return new Intl.NumberFormat('en-UG', {
        style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
};

const getTransactionTypeBadge = (type) => {
    const tone = {
        IN: 'inventory-badge--success',
        OUT: 'inventory-badge--danger',
        ADJUSTMENT: 'inventory-badge--warning',
        RETURN: 'inventory-badge--info',
    }[type] || 'inventory-badge--neutral';

    const label = {
        IN: 'Stock In',
        OUT: 'Stock Out',
        ADJUSTMENT: 'Adjustment',
        RETURN: 'Return',
    }[type] || type;

    return <span className={`inventory-badge ${tone}`}>{label}</span>;
};

const ItemDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    const [item, setItem] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showStockModal, setShowStockModal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemRes, transRes] = await Promise.all([
                api.get(`/inventory/items/${id}`),
                api.get(`/inventory/items/${id}/transactions`)
            ]);
            setItem(itemRes.data);
            setTransactions(transRes.data);
        } catch (error) {
            toast.error("Failed to load item details.");
            navigate('/inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, navigate]);

    if (loading) {
        return (
            <section className="inventory-page inventory-page--centered">
                <div className="inventory-loading">
                    <span className="inventory-spinner" aria-hidden="true" />
                    <p>Loading item details...</p>
                </div>
            </section>
        );
    }

    if (!item) {
        return (
            <section className="inventory-page inventory-page--centered">
                <p>Item not found.</p>
            </section>
        );
    }

    return (
        <section className="inventory-page">
            <div className="inventory-banner inventory-banner--item" data-animate="fade-up">
                <button type="button" className="inventory-ghost-btn" onClick={() => navigate('/inventory')}>
                    <FaArrowLeft aria-hidden="true" />
                    <span>Back to Inventory</span>
                </button>

                <div className="inventory-banner__content">
                    <div className="inventory-banner__eyebrow">Item Overview</div>
                    <h2 className="inventory-banner__title">{item.name}</h2>
                    <p className="inventory-banner__subtitle">Manage stock, suppliers, and traceability in one place.</p>

                    <div className="inventory-banner__meta">
                        <div className="inventory-banner__meta-item">
                            <span className="inventory-meta-label">On Hand</span>
                            <span className="inventory-meta-value">{item.quantity.toLocaleString()}</span>
                        </div>
                        <div className="inventory-banner__meta-item">
                            <span className="inventory-meta-label">Total Value</span>
                            <span className="inventory-meta-value">{formatCurrency(item.quantity * item.unitPrice)}</span>
                        </div>
                        <div className="inventory-banner__meta-item">
                            <span className="inventory-meta-label">SKU</span>
                            <span className="inventory-meta-value">{item.sku}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="inventory-detail-layout" data-animate="fade-up" data-delay="0.08">
                <aside className="inventory-detail-sidebar">
                    <div className="inventory-detail-image">
                        <img src={item.imageUrl ? `http://localhost:8080${item.imageUrl}` : placeholderImage} alt={item.name} />
                        <span className="inventory-detail-image__badge">
                            <FaLayerGroup aria-hidden="true" />
                            <span>{item.category?.name || 'Uncategorized'}</span>
                        </span>
                    </div>

                    <div className="inventory-detail-sidebar__meta">
                        <div>
                            <span className="inventory-meta-label">Location</span>
                            <span className="inventory-meta-value">{item.location || 'Not assigned'}</span>
                        </div>
                        <div>
                            <span className="inventory-meta-label">Supplier</span>
                            <span className="inventory-meta-value">{item.supplier?.name || 'No supplier'}</span>
                        </div>
                    </div>

                    <div className="inventory-detail-actions">
                        {hasPermission('ITEM_UPDATE') && (
                            <button type="button" className="inventory-primary-btn" onClick={() => setShowStockModal(true)}>
                                <FaExchangeAlt aria-hidden="true" />
                                <span>Manage Stock</span>
                            </button>
                        )}
                        {hasPermission('ITEM_UPDATE') && (
                            <button type="button" className="inventory-secondary-btn" onClick={() => navigate(`/inventory/edit/${id}`)}>
                                <FaEdit aria-hidden="true" />
                                <span>Edit Item</span>
                            </button>
                        )}
                    </div>
                </aside>

                <div className="inventory-detail-content">
                    <article className="inventory-detail-card">
                        <header className="inventory-detail-card__header">
                            <div>
                                <h3>Item Details</h3>
                                <p>Reference information and financial snapshot.</p>
                            </div>
                        </header>

                        <dl className="inventory-detail-grid">
                            <div>
                                <dt>Category</dt>
                                <dd>{item.category?.name || 'Uncategorized'}</dd>
                            </div>
                            <div>
                                <dt>Reorder Level</dt>
                                <dd>{item.reorderLevel}</dd>
                            </div>
                            <div>
                                <dt>Unit Price</dt>
                                <dd>{formatCurrency(item.unitPrice)}</dd>
                            </div>
                            <div>
                                <dt>Item Status</dt>
                                <dd>
                                    <span className={`inventory-badge ${item.isActive ? 'inventory-badge--success' : 'inventory-badge--neutral'}`}>
                                        {item.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </dd>
                            </div>
                            <div className="inventory-detail-grid__full">
                                <dt>Description</dt>
                                <dd>{item.description || 'No description provided.'}</dd>
                            </div>
                        </dl>
                    </article>

                    <article className="inventory-detail-card">
                        <header className="inventory-detail-card__header">
                            <div>
                                <h3>Transaction History</h3>
                                <p>Recent movements and adjustments for this item.</p>
                            </div>
                            <span className="inventory-chip inventory-chip--outline">
                                {transactions.length} entries
                            </span>
                        </header>

                        {transactions.length === 0 ? (
                            <div className="inventory-empty-state">
                                No transactions recorded yet.
                            </div>
                        ) : (
                            <div className="inventory-table-container">
                                <table className="inventory-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Quantity</th>
                                            <th>Reference</th>
                                            <th>User</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(transaction => (
                                            <tr key={transaction.id}>
                                                <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                                                <td>{getTransactionTypeBadge(transaction.type)}</td>
                                                <td>{transaction.quantity}</td>
                                                <td>{transaction.reference}</td>
                                                <td>{transaction.user.username}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </article>
                </div>
            </div>

            {item && (
                <StockTransactionModal
                    show={showStockModal}
                    handleClose={() => setShowStockModal(false)}
                    item={item}
                    onTransactionSuccess={fetchData}
                />
            )}
        </section>
    );
};
export default ItemDetailsPage;