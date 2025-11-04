import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaSave, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import './FinanceStyles.css';

const RequisitionForm = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState({
        projectId: '',
        dateNeeded: '',
        justification: '',
        items: [{ itemName: '', description: '', quantity: 1, unit: '', estimatedUnitCost: '' }]
    });

    const [rejectionInfo, setRejectionInfo] = useState(null);

    useEffect(() => {
        fetchProjects();
        if (isEditMode) {
            fetchRequisition();
        }
    }, [id]);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (error) {
            toast.error('Failed to load projects.');
        }
    };

    const fetchRequisition = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/requisitions/${id}`);
            const req = response.data;
            
            setFormData({
                projectId: req.project?.id || '',
                dateNeeded: req.dateNeeded?.split('T')[0] || '',
                justification: req.justification || '',
                items: req.items || [{ itemName: '', description: '', quantity: 1, unit: '', estimatedUnitCost: '' }]
            });

            if (req.status === 'REJECTED' && req.rejectionNotes) {
                setRejectionInfo({
                    notes: req.rejectionNotes,
                    rejectedAt: req.rejectedAt
                });
            }
        } catch (error) {
            toast.error('Failed to load requisition.');
            navigate('/requisitions');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index][field] = value;
        setFormData(prev => ({
            ...prev,
            items: updatedItems
        }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { itemName: '', description: '', quantity: 1, unit: '', estimatedUnitCost: '' }]
        }));
    };

    const removeItem = (index) => {
        if (formData.items.length > 1) {
            const updatedItems = formData.items.filter((_, i) => i !== index);
            setFormData(prev => ({
                ...prev,
                items: updatedItems
            }));
        }
    };

    const calculateTotalCost = () => {
        return formData.items.reduce((total, item) => {
            const cost = parseFloat(item.estimatedUnitCost) || 0;
            const quantity = parseInt(item.quantity) || 0;
            return total + (cost * quantity);
        }, 0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.projectId || !formData.dateNeeded || formData.items.length === 0) {
            toast.error('Please fill in all required fields.');
            return;
        }

        if (formData.items.some(item => !item.itemName || !item.quantity)) {
            toast.error('Please complete all item details.');
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                ...formData,
                items: formData.items.map(item => ({
                    ...item,
                    quantity: parseInt(item.quantity),
                    estimatedUnitCost: parseFloat(item.estimatedUnitCost) || 0
                }))
            };

            if (isEditMode) {
                await api.put(`/requisitions/${id}`, payload);
                toast.success('Requisition updated successfully!');
            } else {
                await api.post('/requisitions', payload);
                toast.success('Requisition created successfully!');
            }
            
            navigate('/requisitions');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save requisition.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <section className="finance-page">
                <div className="finance-loading">
                    <span className="finance-spinner" aria-hidden="true" />
                    <p>Loading requisition...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="finance-page">
            {/* Inline Banner */}
            <div className="finance-banner" data-animate="fade-up">
                <button
                    type="button"
                    className="finance-btn finance-btn--blue"
                    onClick={() => navigate('/requisitions')}
                    style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '0.5rem 0', width: 'fit-content', marginBottom: '1rem' }}
                >
                    <FaArrowLeft aria-hidden="true" />
                    <span>Back to Requisitions</span>
                </button>

                <div className="finance-banner__content">
                    <div className="finance-banner__info">
                        <div className="finance-banner__eyebrow">
                            <span>{isEditMode ? 'Edit' : 'Create'} Requisition</span>
                        </div>
                        <h1 className="finance-banner__title">
                            {isEditMode ? `Edit REQ-${String(id).padStart(4, '0')}` : 'New Material Request'}
                        </h1>
                        <p className="finance-banner__subtitle">
                            {isEditMode 
                                ? 'Update requisition details and item requirements for project materials.'
                                : 'Create a new material requisition for project resources and supplies.'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Rejection Alert */}
            {rejectionInfo && (
                <div className="finance-alert finance-alert--warning" data-animate="fade-up" data-delay="0.08">
                    <strong>Requisition was rejected:</strong> {rejectionInfo.notes}
                    <br />
                    <small>Rejected on {new Date(rejectionInfo.rejectedAt).toLocaleDateString()}</small>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="finance-form" data-animate="fade-up" data-delay="0.12">
                {/* General Information Section */}
                <div className="finance-form-section">
                    <h3 className="finance-form-section__title">General Information</h3>
                    
                    <div className="finance-form-group">
                        <label className="finance-label" htmlFor="projectId">Project *</label>
                        <select
                            id="projectId"
                            name="projectId"
                            className="finance-select"
                            value={formData.projectId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a project...</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name} - {project.clientName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="finance-form-group">
                        <label className="finance-label" htmlFor="dateNeeded">Date Needed *</label>
                        <input
                            id="dateNeeded"
                            type="date"
                            name="dateNeeded"
                            className="finance-input"
                            value={formData.dateNeeded}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="finance-form-group">
                        <label className="finance-label" htmlFor="justification">Justification</label>
                        <textarea
                            id="justification"
                            name="justification"
                            className="finance-textarea"
                            value={formData.justification}
                            onChange={handleChange}
                            placeholder="Explain why these materials are needed..."
                            rows={3}
                        />
                    </div>
                </div>

                {/* Items Section */}
                <div className="finance-form-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 className="finance-form-section__title" style={{ margin: 0 }}>Requested Items</h3>
                        <button
                            type="button"
                            className="finance-btn finance-btn--blue finance-btn--sm"
                            onClick={addItem}
                        >
                            <FaPlus aria-hidden="true" />
                            <span>Add Item</span>
                        </button>
                    </div>

                    {formData.items.map((item, index) => (
                        <div key={index} className="finance-form-group" style={{ 
                            padding: '1.25rem', 
                            border: '1px solid var(--finance-border)',
                            borderRadius: '12px',
                            background: 'var(--finance-surface-secondary)',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: 'var(--finance-text-primary)' }}>
                                    Item {index + 1}
                                </h4>
                                {formData.items.length > 1 && (
                                    <button
                                        type="button"
                                        className="finance-btn finance-btn--red finance-btn--sm finance-btn--icon"
                                        onClick={() => removeItem(index)}
                                        title="Remove Item"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="finance-form-group" style={{ marginBottom: 0 }}>
                                    <label className="finance-label">Item Name *</label>
                                    <input
                                        type="text"
                                        className="finance-input"
                                        value={item.itemName}
                                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                                        placeholder="e.g., Cement bags"
                                        required
                                    />
                                </div>

                                <div className="finance-form-group" style={{ marginBottom: 0 }}>
                                    <label className="finance-label">Quantity *</label>
                                    <input
                                        type="number"
                                        className="finance-input"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="finance-form-group" style={{ marginBottom: 0 }}>
                                    <label className="finance-label">Unit</label>
                                    <input
                                        type="text"
                                        className="finance-input"
                                        value={item.unit}
                                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                        placeholder="e.g., bags, pcs"
                                    />
                                </div>

                                <div className="finance-form-group" style={{ marginBottom: 0 }}>
                                    <label className="finance-label">Est. Unit Cost (UGX)</label>
                                    <input
                                        type="number"
                                        className="finance-input"
                                        value={item.estimatedUnitCost}
                                        onChange={(e) => handleItemChange(index, 'estimatedUnitCost', e.target.value)}
                                        min="0"
                                        step="100"
                                    />
                                </div>
                            </div>

                            <div className="finance-form-group" style={{ marginBottom: 0, marginTop: '1rem' }}>
                                <label className="finance-label">Description</label>
                                <textarea
                                    className="finance-textarea"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                    placeholder="Additional details about this item..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Total Cost */}
                    <div style={{ 
                        padding: '1rem 1.25rem', 
                        background: 'var(--finance-gold-light)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontWeight: '600', color: 'var(--finance-text-primary)' }}>
                            Total Estimated Cost:
                        </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--finance-gold-hover)' }}>
                            {formatCurrency(calculateTotalCost())}
                        </span>
                    </div>
                </div>

                {/* Form Actions */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', padding: '1.5rem 0' }}>
                    <button
                        type="button"
                        className="finance-btn finance-btn--blue"
                        onClick={() => navigate('/requisitions')}
                        disabled={submitting}
                    >
                        <FaTimes aria-hidden="true" />
                        <span>Cancel</span>
                    </button>
                    <button
                        type="submit"
                        className={`finance-btn ${isEditMode ? 'finance-btn--green' : 'finance-btn--gold'}`}
                        disabled={submitting}
                    >
                        <FaSave aria-hidden="true" />
                        <span>
                            {submitting 
                                ? (isEditMode ? 'Updating...' : 'Creating...') 
                                : (isEditMode ? 'Update Requisition' : 'Create Requisition')
                            }
                        </span>
                    </button>
                </div>
            </form>
        </section>
    );
};

export default RequisitionForm;