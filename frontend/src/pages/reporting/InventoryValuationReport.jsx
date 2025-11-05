import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaFileCsv,
    FaBoxes,
    FaClipboardList,
    FaWarehouse,
    FaDollarSign
} from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './ReportingStyles.css';

const formatCurrency = (amount) => {
    const numericValue = Number.isFinite(amount) ? amount : Number(amount);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        maximumFractionDigits: 0
    }).format(safeValue);
};

const InventoryValuationReport = () => {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchReport = async () => {
            setLoading(true);
            try {
                const response = await api.get('/reports/inventory-valuation');
                if (isMounted) {
                    const payload = Array.isArray(response.data) ? response.data : [];
                    setReportData(payload);
                }
            } catch (error) {
                if (isMounted) {
                    toast.error('Failed to load inventory valuation data');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchReport();

        return () => {
            isMounted = false;
        };
    }, []);

    const totals = useMemo(() => reportData.reduce((acc, item) => ({
        quantity: acc.quantity + (Number(item?.quantity) || 0),
        totalValue: acc.totalValue + (Number(item?.totalValue) || 0)
    }), { quantity: 0, totalValue: 0 }), [reportData]);

    const categoryCount = useMemo(() => {
        const categories = new Set(reportData.map((item) => item?.category).filter(Boolean));
        return categories.size;
    }, [reportData]);

    const topValuedItem = useMemo(() => reportData.reduce((top, item) => {
        const itemValue = Number(item?.totalValue) || 0;
        if (!top || itemValue > top.value) {
            return { sku: item?.sku, name: item?.name, value: itemValue };
        }
        return top;
    }, null), [reportData]);

    const lowestStockItem = useMemo(() => reportData.reduce((lowest, item) => {
        const quantity = Number(item?.quantity) || 0;
        if (!lowest || quantity < lowest.quantity) {
            return { sku: item?.sku, name: item?.name, quantity };
        }
        return lowest;
    }, null), [reportData]);

    const averageUnitPrice = totals.quantity > 0 ? totals.totalValue / totals.quantity : 0;

    const metrics = [
        { label: 'Inventory Valuation', value: formatCurrency(totals.totalValue), accent: 'gold' },
        { label: 'Average Unit Price', value: formatCurrency(averageUnitPrice), accent: 'green' },
        {
            label: 'Top Value SKU',
            value: topValuedItem ? `${topValuedItem.sku || '—'} • ${formatCurrency(topValuedItem.value)}` : '—',
            accent: 'purple'
        },
        {
            label: 'Lowest Stock SKU',
            value: lowestStockItem ? `${lowestStockItem.sku || '—'} • ${lowestStockItem.quantity.toLocaleString()}` : '—',
            accent: 'red'
        }
    ];

    const handleExportCsv = () => {
        if (reportData.length === 0) {
            toast.info('There is no inventory data to export.');
            return;
        }

        const headers = ['SKU', 'Name', 'Category', 'Quantity', 'UnitPrice_UGX', 'TotalValue_UGX'];
        const rows = reportData.map((item) => [
            item?.sku,
            `"${(item?.name || '').replace(/"/g, '""')}"`,
            item?.category,
            Number(item?.quantity) || 0,
            Number(item?.unitPrice) || 0,
            Number(item?.totalValue) || 0
        ].join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'inventory_valuation_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <section className="reporting-page">
            <div className="reporting-back" data-animate="fade-up">
                <button
                    type="button"
                    className="reporting-btn reporting-btn--secondary reporting-btn--sm"
                    onClick={() => navigate('/reports')}
                >
                    <FaArrowLeft /> Back to Reports
                </button>
                <p className="reporting-back__title">Inventory • Valuation</p>
            </div>

            <div className="reporting-banner reporting-banner--compact" data-animate="fade-up" data-delay="0.04">
                <div className="reporting-banner__content">
                    <div className="reporting-banner__info">
                        <span className="reporting-banner__eyebrow">
                            <FaWarehouse /> Stock Health
                        </span>
                        <h1 className="reporting-banner__title">Inventory Valuation Report</h1>
                        <p className="reporting-banner__subtitle">
                            Review current stock levels, unit pricing, and the total valuation of every SKU to keep procurement and fulfilment decisions grounded in accurate data.
                        </p>
                    </div>
                </div>

                <div className="reporting-banner__meta">
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--blue">
                            <FaBoxes />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Active SKUs</span>
                            <span className="reporting-banner__meta-value">{reportData.length}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--purple">
                            <FaClipboardList />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Categories</span>
                            <span className="reporting-banner__meta-value">{categoryCount}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--green">
                            <FaWarehouse />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Total Quantity</span>
                            <span className="reporting-banner__meta-value">{totals.quantity.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="reporting-banner__meta-item">
                        <div className="reporting-banner__meta-icon reporting-banner__meta-icon--gold">
                            <FaDollarSign />
                        </div>
                        <div className="reporting-banner__meta-content">
                            <span className="reporting-banner__meta-label">Inventory Value</span>
                            <span className="reporting-banner__meta-value">{formatCurrency(totals.totalValue)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="reporting-metrics" data-animate="fade-up" data-delay="0.08">
                {metrics.map((metric) => (
                    <div key={metric.label} className={`reporting-metric reporting-metric--${metric.accent}`}>
                        <span className="reporting-metric__label">{metric.label}</span>
                        <span className="reporting-metric__value">{metric.value}</span>
                    </div>
                ))}
            </div>

            <div className="reporting-card" data-animate="fade-up" data-delay="0.12">
                <div className="reporting-card__header">
                    <div>
                        <h2 className="reporting-card__title">Inventory Detail</h2>
                        <p className="reporting-card__subtitle">SKU-level snapshot with current quantity, unit price, and total valuation.</p>
                    </div>
                    <div className="reporting-card__actions">
                        <span className="reporting-badge reporting-badge--info">{reportData.length} Records</span>
                        <button type="button" className="reporting-btn reporting-btn--green" onClick={handleExportCsv}>
                            <FaFileCsv /> Export CSV
                        </button>
                    </div>
                </div>

                <div className="reporting-card__content">
                    {loading ? (
                        <div className="reporting-loading">
                            <div className="reporting-spinner" />
                            <p className="reporting-card__subtitle">Compiling inventory snapshot…</p>
                        </div>
                    ) : reportData.length === 0 ? (
                        <div className="reporting-empty-state">
                            No inventory valuation data found. Adjust filters or refresh later.
                        </div>
                    ) : (
                        <div className="reporting-table-container">
                            <table className="reporting-table">
                                <thead>
                                    <tr>
                                        <th>SKU</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Total Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((item) => (
                                        <tr key={item?.sku}>
                                            <td>{item?.sku}</td>
                                            <td>{item?.name}</td>
                                            <td>{item?.category}</td>
                                            <td>{(Number(item?.quantity) || 0).toLocaleString()}</td>
                                            <td>{formatCurrency(item?.unitPrice)}</td>
                                            <td>{formatCurrency(item?.totalValue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default InventoryValuationReport;