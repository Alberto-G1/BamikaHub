import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { FaTimes, FaCalendarAlt, FaCloudSun, FaMapMarkerAlt, FaFileAlt, FaUpload, FaCheckCircle } from 'react-icons/fa';
import api from '../../api/api.js';
import './FieldReportModal.css';

const FieldReportModal = ({ show, handleClose, project, onReportSubmit, sites = [], initialSiteId = '' }) => {
    // State to toggle between form and file upload
    const [submissionType, setSubmissionType] = useState('form'); // 'form' or 'file'

    // State for form fields
    const [formData, setFormData] = useState({
        reportDate: new Date().toISOString().split('T')[0],
        siteId: '',
        workProgressUpdate: '', 
        materialsUsed: '', 
        challengesFaced: '', 
        weatherConditions: ''
    });
    
    // State for the uploaded file
    const [reportFile, setReportFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReportFile(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setReportFile(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const apiFormData = new FormData();
        
        // Construct the JSON part of the payload
        const reportDataPayload = {
            projectId: project.id,
            siteId: formData.siteId ? Number(formData.siteId) : null,
            reportDate: formData.reportDate,
            // If in 'form' mode, send the text data. If in 'file' mode, send placeholder text.
            workProgressUpdate: submissionType === 'form' ? formData.workProgressUpdate : `See attached file: ${reportFile.name}`,
            materialsUsed: submissionType === 'form' ? formData.materialsUsed : '',
            challengesFaced: submissionType === 'form' ? formData.challengesFaced : '',
            weatherConditions: formData.weatherConditions, // Weather is always useful
        };

        apiFormData.append('reportData', new Blob([JSON.stringify(reportDataPayload)], {
            type: "application/json"
        }));

        // Append the file only if in 'file' mode
        if (submissionType === 'file' && reportFile) {
            apiFormData.append('file', reportFile);
        }

        try {
            await api.post('/reports/field-daily', apiFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Daily report submitted successfully!');
            onReportSubmit();
            handleClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit report.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Reset form state when the modal is closed
    const onExit = () => {
        setSubmissionType('form');
        setFormData({
            reportDate: new Date().toISOString().split('T')[0],
            siteId: '',
            workProgressUpdate: '', 
            materialsUsed: '', 
            challengesFaced: '', 
            weatherConditions: ''
        });
        setReportFile(null);
        setIsDragging(false);
    };

    useEffect(() => {
        if (show) {
            setFormData((prev) => ({
                ...prev,
                siteId: initialSiteId || ''
            }));
        } else {
            // Trigger onExit when modal closes
            setTimeout(onExit, 300); // Wait for animation to complete
        }
    }, [show, initialSiteId]);

    if (!project) return null;

    const modalUi = (
        <>
            {/* Backdrop */}
            <div 
                className={`field-report-backdrop ${show ? 'show' : ''}`}
                onClick={handleClose}
            />
            
            {/* Modal */}
            <div className={`field-report-modal ${show ? 'show' : ''}`}>
                <div className="field-report-modal-content" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="field-report-modal-header">
                        <div className="field-report-modal-header-content">
                            <FaFileAlt className="field-report-modal-icon" />
                            <div>
                                <h2 className="field-report-modal-title">Submit Daily Report</h2>
                                <p className="field-report-modal-subtitle">{project.name}</p>
                            </div>
                        </div>
                        <button 
                            className="field-report-modal-close"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            type="button"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit}>
                        <div className="field-report-modal-body">
                            {/* General Information Section */}
                            <div className="field-report-section">
                                <h3 className="field-report-section-title">General Information</h3>
                                <div className="field-report-row">
                                    <div className="field-report-form-group">
                                        <label className="field-report-label">
                                            <FaCalendarAlt className="field-report-label-icon" />
                                            Report Date
                                        </label>
                                        <input 
                                            type="date" 
                                            name="reportDate" 
                                            value={formData.reportDate} 
                                            onChange={handleFormChange} 
                                            className="field-report-input"
                                            required 
                                        />
                                    </div>
                                    <div className="field-report-form-group">
                                        <label className="field-report-label">
                                            <FaCloudSun className="field-report-label-icon" />
                                            Weather Conditions
                                        </label>
                                        <input 
                                            type="text" 
                                            name="weatherConditions" 
                                            value={formData.weatherConditions} 
                                            onChange={handleFormChange} 
                                            className="field-report-input"
                                            placeholder="e.g., Sunny, Overcast, Rainy"
                                        />
                                    </div>
                                </div>

                                <div className="field-report-form-group">
                                    <label className="field-report-label">
                                        <FaMapMarkerAlt className="field-report-label-icon" />
                                        Site (optional)
                                    </label>
                                    <select 
                                        name="siteId" 
                                        value={formData.siteId} 
                                        onChange={handleFormChange}
                                        className="field-report-select"
                                        disabled={sites.length === 0}
                                    >
                                        <option value="">Whole project / unspecified site</option>
                                        {sites.map((site) => (
                                            <option key={site.id} value={site.id}>
                                                {site.name}{site.location ? ` - ${site.location}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {sites.length === 0 && (
                                        <span className="field-report-help-text">
                                            No sites defined for this project yet.
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Submission Type Toggle */}
                            <div className="field-report-section">
                                <h3 className="field-report-section-title">Submission Type</h3>
                                <div className="field-report-toggle-group">
                                    <button
                                        type="button"
                                        className={`field-report-toggle-btn ${submissionType === 'form' ? 'active' : ''}`}
                                        onClick={() => setSubmissionType('form')}
                                    >
                                        <FaFileAlt />
                                        Fill Form
                                    </button>
                                    <button
                                        type="button"
                                        className={`field-report-toggle-btn ${submissionType === 'file' ? 'active' : ''}`}
                                        onClick={() => setSubmissionType('file')}
                                    >
                                        <FaUpload />
                                        Upload File
                                    </button>
                                </div>
                            </div>

                            {/* Conditional Fields based on Toggle */}
                            <div className="field-report-section">
                                {submissionType === 'form' ? (
                                    <div className="field-report-form-content">
                                        <div className="field-report-form-group">
                                            <label className="field-report-label">
                                                Work Progress Update <span className="field-report-required">*</span>
                                            </label>
                                            <textarea 
                                                rows={4} 
                                                name="workProgressUpdate" 
                                                value={formData.workProgressUpdate} 
                                                onChange={handleFormChange} 
                                                className="field-report-textarea"
                                                required 
                                                placeholder="Describe the work completed today..."
                                            />
                                        </div>
                                        <div className="field-report-form-group">
                                            <label className="field-report-label">
                                                Materials Used
                                            </label>
                                            <textarea 
                                                rows={3} 
                                                name="materialsUsed" 
                                                value={formData.materialsUsed} 
                                                onChange={handleFormChange} 
                                                className="field-report-textarea"
                                                placeholder="List materials and quantities used..."
                                            />
                                        </div>
                                        <div className="field-report-form-group">
                                            <label className="field-report-label">
                                                Challenges or Blockers
                                            </label>
                                            <textarea 
                                                rows={2} 
                                                name="challengesFaced" 
                                                value={formData.challengesFaced} 
                                                onChange={handleFormChange} 
                                                className="field-report-textarea"
                                                placeholder="Describe any issues faced..."
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="field-report-upload-section">
                                        <label className="field-report-label">
                                            Upload Report Document <span className="field-report-required">*</span>
                                        </label>
                                        <div 
                                            className={`field-report-dropzone ${isDragging ? 'dragging' : ''} ${reportFile ? 'has-file' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => document.getElementById('report-file-input').click()}
                                        >
                                            <input 
                                                type="file" 
                                                id="report-file-input"
                                                onChange={handleFileChange} 
                                                required 
                                                accept=".pdf,.doc,.docx,image/*"
                                                style={{ display: 'none' }}
                                            />
                                            {reportFile ? (
                                                <div className="field-report-file-preview">
                                                    <FaCheckCircle className="field-report-file-icon success" />
                                                    <div className="field-report-file-info">
                                                        <p className="field-report-file-name">{reportFile.name}</p>
                                                        <p className="field-report-file-size">
                                                            {(reportFile.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        className="field-report-file-remove"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setReportFile(null);
                                                        }}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="field-report-dropzone-content">
                                                    <FaUpload className="field-report-upload-icon" />
                                                    <p className="field-report-dropzone-text">
                                                        Drag & drop your report here
                                                    </p>
                                                    <p className="field-report-dropzone-subtext">
                                                        or click to browse
                                                    </p>
                                                    <span className="field-report-help-text">
                                                        Supports: PDF, Word documents, and images
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="field-report-modal-footer">
                            <button 
                                type="button"
                                className="field-report-btn field-report-btn--cancel"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="field-report-btn field-report-btn--submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="field-report-spinner"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <FaCheckCircle />
                                        Submit Report
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );

    // Render at document.body level to escape any parent stacking context
    return show ? createPortal(modalUi, document.body) : null;
};

export default FieldReportModal;
