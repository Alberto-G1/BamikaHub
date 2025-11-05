import React, { useState, useEffect, useMemo } from 'react';
import { FaBoxes, FaDolly, FaFilter, FaHistory, FaSync } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './InventoryStyles.css';

// Reusable currency formatter
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-UG', {
        style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
};

// Helper to format the transaction type for display
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

const TransactionHistoryPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await api.get('/inventory/transactions');
            setTransactions(response.data);
        } catch (err) {
            toast.error('Failed to fetch transaction history.');
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter((transaction) => typeFilter === 'ALL' || transaction.type === typeFilter)
            .filter((transaction) => {
                const searchLower = searchQuery.toLowerCase();
                return (
                    transaction.item.name.toLowerCase().includes(searchLower) ||
                    transaction.item.sku.toLowerCase().includes(searchLower) ||
                    (transaction.reference && transaction.reference.toLowerCase().includes(searchLower)) ||
                    (transaction.user.username && transaction.user.username.toLowerCase().includes(searchLower))
                );
            });
    }, [transactions, searchQuery, typeFilter]);

    const { inboundCount, outboundCount } = useMemo(() => {
        return transactions.reduce(
            (accumulator, transaction) => {
                if (transaction.type === 'IN') accumulator.inboundCount += 1;
                if (transaction.type === 'OUT') accumulator.outboundCount += 1;
                return accumulator;
            },
            { inboundCount: 0, outboundCount: 0 }
        );
    }, [transactions]);

    const bannerMetrics = useMemo(() => ([
        {
            label: 'Total Records',
            value: transactions.length,
            icon: FaHistory,
            modifier: 'inventory-banner__meta-icon--accent'
        },
        {
            label: 'Filtered',
            value: filteredTransactions.length,
            icon: FaFilter,
            modifier: 'inventory-banner__meta-icon--purple'
        },
        {
            label: 'Inbound Moves',
            value: inboundCount,
            icon: FaBoxes,
            modifier: 'inventory-banner__meta-icon--green'
        },
        {
            label: 'Outbound Moves',
            value: outboundCount,
            icon: FaDolly,
            modifier: 'inventory-banner__meta-icon--danger'
        }
    ]), [transactions.length, filteredTransactions.length, inboundCount, outboundCount]);

    if (loading) {
        return (
            <section className="inventory-page inventory-page--centered">
                <div className="inventory-loading">
                    <span className="inventory-spinner" aria-hidden="true" />
                    <p>Loading stock history...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="inventory-page">
            <div className="inventory-banner" data-animate="fade-up">
                <div className="inventory-banner__content">
                    <div className="inventory-banner__info">
                        <span className="inventory-banner__eyebrow">
                            <FaHistory aria-hidden="true" />
                            Movement Ledger
                        </span>
                        <h1 className="inventory-banner__title">Stock Transaction Log</h1>
                        <p className="inventory-banner__subtitle">
                            Audit every movement across the warehouse and catch anomalies before they impact fulfilment.
                        </p>
                    </div>
                    <div className="inventory-banner__actions">
                        <button
                            type="button"
                            className="inventory-ghost-btn"
                            onClick={fetchTransactions}
                            disabled={loading}
                        >
                            <FaSync aria-hidden="true" />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
                <div className="inventory-banner__meta">
                    {bannerMetrics.map((metric) => {
                        const MetricIcon = metric.icon;
                        return (
                            <div key={metric.label} className="inventory-banner__meta-item">
                                <div className={`inventory-banner__meta-icon ${metric.modifier}`} aria-hidden="true">
                                    <MetricIcon />
                                </div>
                                <div className="inventory-banner__meta-content">
                                    <span className="inventory-banner__meta-label">{metric.label}</span>
                                    <span className="inventory-banner__meta-value">{metric.value}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="inventory-card" data-animate="fade-up" data-delay="0.08">
                <header className="inventory-card__header inventory-card__header--split">
                    <div>
                        <h3 className="inventory-card__title">
                            <FaHistory aria-hidden="true" />
                            <span>Transactions</span>
                        </h3>
                        <p className="inventory-card__subtitle">Refine results by movement type or search keywords.</p>
                    </div>
                    <span className="inventory-chip inventory-chip--outline">
                        <FaFilter aria-hidden="true" />
                        <span>Filters Active</span>
                    </span>
                </header>

                <div className="inventory-toolbar">
                    <div className="inventory-toolbar__group">
                        <label htmlFor="typeFilter">Movement Type</label>
                        <select
                            id="typeFilter"
                            className="inventory-select"
                            value={typeFilter}
                            onChange={(event) => setTypeFilter(event.target.value)}
                        >
                            <option value="ALL">All Types</option>
                            <option value="IN">Stock In</option>
                            <option value="OUT">Stock Out</option>
                            <option value="ADJUSTMENT">Adjustment</option>
                            <option value="RETURN">Return</option>
                        </select>
                    </div>

                    <div className="inventory-toolbar__group inventory-toolbar__group--grow">
                        <label htmlFor="transactionSearch">Search</label>
                        <input
                            id="transactionSearch"
                            className="inventory-input"
                            placeholder="Search by item, SKU, reference, or user..."
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                        />
                    </div>
                </div>

                <div className="inventory-table-container">
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Item (SKU)</th>
                                <th>Type</th>
                                <th>Quantity</th>
                                <th>Previous Qty</th>
                                <th>New Qty</th>
                                <th>Unit Cost</th>
                                <th>Reference</th>
                                <th>User</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(transaction => (
                                <tr key={transaction.id}>
                                    <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                                    <td>
                                        <div className="inventory-table__primary">{transaction.item.name}</div>
                                        <div className="inventory-table__secondary">{transaction.item.sku}</div>
                                    </td>
                                    <td>{getTransactionTypeBadge(transaction.type)}</td>
                                    <td>{transaction.quantity.toLocaleString()}</td>
                                    <td>{transaction.previousQuantity.toLocaleString()}</td>
                                    <td>{transaction.newQuantity.toLocaleString()}</td>
                                    <td>{formatCurrency(transaction.unitCost)}</td>
                                    <td>{transaction.reference}</td>
                                    <td>{transaction.user.username}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default TransactionHistoryPage;