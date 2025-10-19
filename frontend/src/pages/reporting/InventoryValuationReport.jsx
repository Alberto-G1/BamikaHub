import React, { useState, useEffect } from 'react';
import { Table, Spinner, Card, Button } from 'react-bootstrap';
import { FaFileCsv, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';

const formatCurrency = (amount) => { /* ... */ };

const InventoryValuationReport = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const response = await api.get('/reports/inventory-valuation');
                setReportData(response.data);
            } catch (err) {
                toast.error('Failed to generate report.');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    const handleExportCsv = () => {
        const headers = ["SKU", "Name", "Category", "Quantity", "UnitPrice_UGX", "TotalValue_UGX"];
        const rows = reportData.map(item => [
            item.sku,
            `"${item.name.replace(/"/g, '""')}"`,
            item.category,
            item.quantity,
            item.unitPrice,
            item.totalValue
        ].join(','));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "inventory_valuation_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    if (loading) return <Spinner animation="border" />;

    return (
        <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                    <Button variant="outline-secondary" size="sm" className="me-3" onClick={() => navigate('/reports')}>
                        <FaArrowLeft /> Back to Reports
                    </Button>
                    <Card.Title as="h4" className="mb-0 d-inline-block">Inventory Valuation Report</Card.Title>
                </div>
                <Button variant="success" onClick={handleExportCsv}>
                    <FaFileCsv className="me-2" /> Export to CSV
                </Button>
            </Card.Header>
            <Card.Body>
                <Table striped bordered hover responsive>
                    <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Quantity</th><th>Unit Price</th><th>Total Value</th></tr></thead>
                    <tbody>
                        {reportData.map(item => (
                            <tr key={item.sku}>
                                <td>{item.sku}</td>
                                <td>{item.name}</td>
                                <td>{item.category}</td>
                                <td>{item.quantity.toLocaleString()}</td>
                                <td>{formatCurrency(item.unitPrice)}</td>
                                <td>{formatCurrency(item.totalValue)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
};

export default InventoryValuationReport;