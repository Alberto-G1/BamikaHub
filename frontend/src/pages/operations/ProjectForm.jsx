import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaProjectDiagram, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import Select from 'react-select';
import './OperationsStyles.css';

const ProjectForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: '', clientName: '', description: '',
        status: 'PLANNING', startDate: '', endDate: ''
    });
    const [assignedEngineers, setAssignedEngineers] = useState([]);

    // Data for dropdowns
    const [allEngineers, setAllEngineers] = useState([]);

    useEffect(() => {
        const fetchEngineers = async () => {
            try {
                const res = await api.get('/users');
                const engineerOptions = res.data
                    .filter(user => ['Field Engineer (Civil)', 'Admin', 'Inventory & Operations Manager'].includes(user.role.name))
                    .map(user => ({ value: user.id, label: `${user.firstName} ${user.lastName}` }));
                setAllEngineers(engineerOptions);
            } catch (error) {
                toast.error("Failed to load engineers list.");
            }
        };

        const fetchProjectData = async () => {
            if (isEditMode) {
                try {
                    const res = await api.get(`/projects/${id}`);
                    const project = res.data;
                    setFormData({
                        name: project.name || '',
                        clientName: project.clientName || '',
                        description: project.description || '',
                        status: project.status || 'PLANNING',
                        startDate: project.startDate || '',
                        endDate: project.endDate || ''
                    });
                    const selectedEngineers = project.assignedEngineers.map(user => ({
                        value: user.id, label: `${user.firstName} ${user.lastName}`
                    }));
                    setAssignedEngineers(selectedEngineers);
                } catch (error) {
                    toast.error('Failed to load project data.');
                    navigate('/projects');
                }
            }
        };

        const loadAll = async () => {
            setLoading(true);
            await fetchEngineers();
            await fetchProjectData();
            setLoading(false);
        };

        loadAll();
    }, [id, isEditMode, navigate]);

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            assignedEngineerIds: assignedEngineers.map(eng => eng.value)
        };

        try {
            if (isEditMode) {
                await api.put(`/projects/${id}`, payload);
                toast.success("Project updated successfully!");
            } else {
                await api.post('/projects', payload);
                toast.success("Project created successfully!");
            }
            navigate('/projects');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save project.");
        }
    };

    if (loading) {
        return (
            <section className="operations-page">
                <div className="operations-loading">
                    <span className="operations-spinner" aria-hidden="true" />
                    <p>Loading project configuration...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="operations-page">
            {/* Hero Banner */}
            <div className="operations-banner" data-animate="fade-up">
                <button 
                    type="button" 
                    className="operations-btn operations-btn--blue" 
                    onClick={() => navigate(-1)}
                    style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '0.5rem 0', width: 'fit-content' }}
                >
                    <FaArrowLeft aria-hidden="true" />
                    <span>Back</span>
                </button>

                <div className="operations-banner__content">
                    <div className="operations-banner__info">
                        <div className="operations-banner__eyebrow">Project Management</div>
                        <h2 className="operations-banner__title">
                            {isEditMode ? 'Edit Project Details' : 'Create New Project'}
                        </h2>
                        <p className="operations-banner__subtitle">
                            {isEditMode
                                ? 'Update project information, timeline, and assigned engineering team.'
                                : 'Set up a new construction project with client details, timeline, and team assignments.'}
                        </p>

                        <div className="operations-banner__meta">
                            <div className="operations-banner__meta-item">
                                <span className="operations-meta-label">Status</span>
                                <span className="operations-meta-value">
                                    {formData.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="operations-banner__meta-item">
                                <span className="operations-meta-label">Client</span>
                                <span className="operations-meta-value">
                                    {formData.clientName || 'Not Set'}
                                </span>
                            </div>
                            <div className="operations-banner__meta-item">
                                <span className="operations-meta-label">Engineers</span>
                                <span className="operations-meta-value">
                                    {assignedEngineers.length || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form className="operations-form-shell" onSubmit={handleSubmit} data-animate="fade-up" data-delay="0.08">
                {/* Project Information */}
                <section className="operations-form-section">
                    <header className="operations-form-section__header">
                        <div>
                            <h3>
                                <FaProjectDiagram aria-hidden="true" style={{ marginRight: '0.5rem', color: 'var(--operations-purple)' }} />
                                Project Information
                            </h3>
                            <p>Basic details that identify the project and client relationship.</p>
                        </div>
                    </header>

                    <div className="operations-form-grid">
                        <div className="operations-form-group">
                            <label htmlFor="projectName">Project Name</label>
                            <input
                                id="projectName"
                                name="name"
                                className="operations-input"
                                value={formData.name}
                                onChange={handleFormChange}
                                required
                                placeholder="Enter project name"
                            />
                        </div>

                        <div className="operations-form-group">
                            <label htmlFor="clientName">Client Name</label>
                            <input
                                id="clientName"
                                name="clientName"
                                className="operations-input"
                                value={formData.clientName}
                                onChange={handleFormChange}
                                required
                                placeholder="Enter client name"
                            />
                        </div>

                        <div className="operations-form-group operations-form-group--full">
                            <label htmlFor="description">Project Description</label>
                            <textarea
                                id="description"
                                name="description"
                                className="operations-textarea"
                                rows={4}
                                value={formData.description}
                                onChange={handleFormChange}
                                placeholder="Describe the project scope and objectives..."
                            />
                        </div>
                    </div>
                </section>

                {/* Timeline & Status */}
                <section className="operations-form-section">
                    <header className="operations-form-section__header">
                        <div>
                            <h3>
                                <FaCalendarAlt aria-hidden="true" style={{ marginRight: '0.5rem', color: 'var(--operations-blue)' }} />
                                Timeline & Status
                            </h3>
                            <p>Define the project schedule and current status.</p>
                        </div>
                    </header>

                    <div className="operations-form-grid">
                        <div className="operations-form-group">
                            <label htmlFor="startDate">Start Date</label>
                            <input
                                id="startDate"
                                type="date"
                                name="startDate"
                                className="operations-input"
                                value={formData.startDate}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div className="operations-form-group">
                            <label htmlFor="endDate">End Date</label>
                            <input
                                id="endDate"
                                type="date"
                                name="endDate"
                                className="operations-input"
                                value={formData.endDate}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div className="operations-form-group">
                            <label htmlFor="status">Project Status</label>
                            <select
                                id="status"
                                name="status"
                                className="operations-select"
                                value={formData.status}
                                onChange={handleFormChange}
                                required
                            >
                                <option value="PLANNING">Planning</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Team Assignment */}
                <section className="operations-form-section">
                    <header className="operations-form-section__header">
                        <div>
                            <h3>
                                <FaUsers aria-hidden="true" style={{ marginRight: '0.5rem', color: 'var(--operations-green)' }} />
                                Team Assignment
                            </h3>
                            <p>Assign field engineers to work on this project.</p>
                        </div>
                    </header>

                    <div className="operations-form-grid">
                        <div className="operations-form-group operations-form-group--full">
                            <label htmlFor="engineers">Assigned Engineers</label>
                            <Select
                                id="engineers"
                                isMulti
                                name="engineers"
                                options={allEngineers}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                value={assignedEngineers}
                                onChange={setAssignedEngineers}
                                placeholder="Select engineers to assign..."
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        padding: '0.35rem',
                                        borderRadius: '12px',
                                        border: '1.5px solid var(--operations-border)',
                                        fontSize: '0.95rem',
                                    }),
                                    multiValue: (base) => ({
                                        ...base,
                                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                        borderRadius: '8px',
                                    }),
                                    multiValueLabel: (base) => ({
                                        ...base,
                                        color: 'var(--operations-green)',
                                        fontWeight: '600',
                                    }),
                                }}
                            />
                        </div>
                    </div>
                </section>

                {/* Form Actions */}
                <footer className="operations-form-actions">
                    <button 
                        type="button" 
                        className="operations-btn operations-btn--blue" 
                        onClick={() => navigate('/projects')}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className={`operations-btn ${isEditMode ? 'operations-btn--green' : 'operations-btn--gold'}`}
                    >
                        <FaSave aria-hidden="true" />
                        <span>{isEditMode ? 'Update Project' : 'Save Project'}</span>
                    </button>
                </footer>
            </form>
        </section>
    );
};

export default ProjectForm;
