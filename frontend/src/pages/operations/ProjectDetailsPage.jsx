import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaUser, FaEdit, FaImage, FaArchive, FaTrash, FaFileExcel, FaFilePdf, FaMapMarkerAlt, FaUsers, FaCalendarAlt, FaProjectDiagram, FaFileAlt, FaTimes } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import FieldReportModal from '../../components/operations/FieldReportModal.jsx';
import ReportViewModal from '../../components/operations/ReportViewModal.jsx';
import GalleryUploadModal from '../../components/operations/GalleryUploadModal.jsx';
import ImageLightbox from '../../components/operations/ImageLightbox.jsx';
import './OperationsStyles.css';

const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'IN_PROGRESS': return 'operations-badge--in-progress';
        case 'COMPLETED': return 'operations-badge--completed';
        case 'PLANNING': return 'operations-badge--planning';
        case 'ON_HOLD': return 'operations-badge--on-hold';
        case 'CANCELLED': return 'operations-badge--cancelled';
        default: return 'operations-badge--planning';
    }
};

const formatStatus = (status) => {
    return status ? status.replace('_', ' ') : 'Unknown';
};

const ProjectDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    const [project, setProject] = useState(null);
    const [reports, setReports] = useState([]);
    const [reportSummaries, setReportSummaries] = useState([]);
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [downloadingFormat, setDownloadingFormat] = useState(null);
    const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
    const [activeTab, setActiveTab] = useState('reports');

    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [showSiteModal, setShowSiteModal] = useState(false);
    const [editingSite, setEditingSite] = useState(null);
    const [siteForm, setSiteForm] = useState({ name: '', location: '' });
    const [siteSubmitting, setSiteSubmitting] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({ open: false });

    const loadReports = async (siteId) => {
        setReportsLoading(true);
        try {
            const params = {};
            if (siteId) params.siteId = siteId;
            const response = await api.get(`/reports/project/${id}`, { params });
            const { reports: reportList = [], siteSummaries = [] } = response.data || {};
            setReports(reportList);
            setReportSummaries(siteSummaries);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load project reports.');
        } finally {
            setReportsLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [projectRes, sitesRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/projects/${id}/sites`)
            ]);
            setProject(projectRes.data);
            setSites(sitesRes.data || []);
            await loadReports(selectedSiteFilter || null);
        } catch (error) {
            toast.error("Failed to load project details.");
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const refreshSites = useCallback(async () => {
        try {
            const response = await api.get(`/projects/${id}/sites`);
            setSites(response.data || []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load project sites.');
        }
    }, [id]);

    const handleSiteFilterChange = async (event) => {
        const value = event.target.value;
        setSelectedSiteFilter(value);
        await loadReports(value || null);
    };

    const handleExport = async (format) => {
        try {
            setDownloadingFormat(format);
            const params = new URLSearchParams();
            if (selectedSiteFilter) params.append('siteId', selectedSiteFilter);

            const response = await api.get(`/reports/project/${id}/export/${format}` + (params.toString() ? `?${params.toString()}` : ''), {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: format === 'pdf' ? 'application/pdf' : 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `field-reports-${id}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Failed to export field reports.');
        } finally {
            setDownloadingFormat(null);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, navigate]);

    const closeDialog = () => setDialogConfig(prev => ({ ...prev, open: false }));

    const openSiteModal = (site = null) => {
        if (site) {
            setEditingSite(site);
            setSiteForm({ name: site.name || '', location: site.location || '' });
        } else {
            setEditingSite(null);
            setSiteForm({ name: '', location: '' });
        }
        setShowSiteModal(true);
    };

    const closeSiteModal = (force = false) => {
        if (siteSubmitting && !force) return;
        setShowSiteModal(false);
        setEditingSite(null);
        setSiteForm({ name: '', location: '' });
    };

    const handleSiteFormChange = (event) => {
        const { name, value } = event.target;
        setSiteForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSiteSubmit = async (event) => {
        event.preventDefault();
        if (!project) return;
        if (project.isArchived) {
            toast.error('This project is archived; sites cannot be modified.');
            return;
        }
        setSiteSubmitting(true);
        try {
            if (editingSite) {
                await api.put(`/sites/${editingSite.id}`, { ...siteForm, projectId: project.id });
                toast.success('Site updated successfully.');
            } else {
                await api.post(`/projects/${project.id}/sites`, siteForm);
                toast.success('Site created successfully.');
            }
            closeSiteModal(true);
            await refreshSites();
            await loadReports(selectedSiteFilter || null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save site.');
        } finally {
            setSiteSubmitting(false);
        }
    };

    const confirmSiteDelete = (site) => {
        setDialogConfig({
            open: true,
            tone: 'danger',
            title: 'Delete Site',
            message: `Delete site "${site.name}"?`,
            detail: 'This action cannot be undone. All associated reports will remain but will no longer be linked to this site.',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            onConfirm: () => handleSiteDelete(site),
        });
    };

    const handleSiteDelete = async (site) => {
        closeDialog();
        if (!project || project.isArchived) return;
        try {
            await api.delete(`/sites/${site.id}`);
            toast.success('Site deleted successfully.');
            await refreshSites();
            if (selectedSiteFilter === String(site.id)) {
                setSelectedSiteFilter('');
                await loadReports(null);
            } else {
                await loadReports(selectedSiteFilter || null);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete site.');
        }
    };

    const confirmImageDelete = (imageId, event) => {
        event.stopPropagation();
        setDialogConfig({
            open: true,
            tone: 'danger',
            title: 'Delete Image',
            message: 'Delete this image from the gallery?',
            detail: 'This action cannot be undone.',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            onConfirm: () => handleImageDelete(imageId),
        });
    };

    const handleImageDelete = async (imageId) => {
        closeDialog();
        try {
            await api.delete(`/projects/${project.id}/gallery/${imageId}`);
            toast.success("Image deleted successfully.");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete image.");
        }
    };

    if (loading) {
        return (
            <section className="operations-page">
                <div className="operations-loading">
                    <span className="operations-spinner" aria-hidden="true" />
                    <p>Loading project details...</p>
                </div>
            </section>
        );
    }

    if (!project) return <p>Project not found.</p>;

    const galleryImages = project.galleryImages || [];
    const assignedEngineers = project.assignedEngineers || [];

    return (
        <section className="operations-page">
            {/* Hero Banner */}
            <div className="operations-banner" data-animate="fade-up">
                <button
                    type="button"
                    className="operations-btn operations-btn--blue"
                    onClick={() => navigate('/projects')}
                    style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '0.5rem 0', width: 'fit-content' }}
                >
                    <FaArrowLeft aria-hidden="true" />
                    <span>Back to Projects</span>
                </button>

                <div className="operations-banner__content">
                    <div className="operations-banner__info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <div className="operations-banner__eyebrow">Project Details</div>
                            <span className={`operations-badge ${getStatusBadgeClass(project.status)}`}>
                                {formatStatus(project.status)}
                            </span>
                            {project.isArchived && (
                                <span className="operations-badge" style={{
                                    background: 'rgba(148, 163, 184, 0.15)',
                                    color: 'var(--operations-text-muted)',
                                    borderColor: 'rgba(148, 163, 184, 0.3)'
                                }}>
                                    <FaArchive aria-hidden="true" />
                                    Archived
                                </span>
                            )}
                        </div>
                        <h2 className="operations-banner__title">{project.name}</h2>
                        <p className="operations-banner__subtitle">
                            <FaProjectDiagram aria-hidden="true" style={{ marginRight: '0.5rem' }} />
                            {project.clientName}
                        </p>
                        {project.description && (
                            <p style={{
                                fontSize: '0.95rem',
                                color: 'var(--operations-text-secondary)',
                                lineHeight: '1.6',
                                maxWidth: '60ch',
                                margin: '0.5rem 0 0'
                            }}>
                                {project.description}
                            </p>
                        )}

                        <div className="operations-banner__meta">
                            <div className="operations-banner__meta-item">
                                <span className="operations-meta-label">
                                    <FaMapMarkerAlt aria-hidden="true" /> Sites
                                </span>
                                <span className="operations-meta-value">{sites.length}</span>
                            </div>
                            <div className="operations-banner__meta-item">
                                <span className="operations-meta-label">
                                    <FaUsers aria-hidden="true" /> Engineers
                                </span>
                                <span className="operations-meta-value">{assignedEngineers.length}</span>
                            </div>
                            <div className="operations-banner__meta-item">
                                <span className="operations-meta-label">
                                    <FaFileAlt aria-hidden="true" /> Reports
                                </span>
                                <span className="operations-meta-value">{reports.length}</span>
                            </div>
                            <div className="operations-banner__meta-item">
                                <span className="operations-meta-label">
                                    <FaImage aria-hidden="true" /> Gallery
                                </span>
                                <span className="operations-meta-value">{galleryImages.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="operations-banner__actions">
                        {hasPermission('PROJECT_UPDATE') && !project.isArchived && (
                            <button
                                className="operations-btn operations-btn--green"
                                onClick={() => navigate(`/projects/edit/${id}`)}
                            >
                                <FaEdit aria-hidden="true" />
                                <span>Edit Project</span>
                            </button>
                        )}
                        {hasPermission('FIELD_REPORT_SUBMIT') && !project.isArchived && (
                            <button
                                className="operations-btn operations-btn--gold"
                                onClick={() => setShowReportModal(true)}
                            >
                                <FaPlus aria-hidden="true" />
                                <span>Submit Report</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Archived Warning */}
            {project.isArchived && (
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: '14px',
                    background: 'rgba(148, 163, 184, 0.1)',
                    border: '1.5px solid rgba(148, 163, 184, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }} data-animate="fade-up" data-delay="0.08">
                    <FaArchive size={24} style={{ color: 'var(--operations-text-muted)' }} />
                    <div>
                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: '700' }}>
                            This Project is Archived
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--operations-text-muted)' }}>
                            This is a read-only historical record. No further modifications are allowed.
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs Navigation */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: '14px',
                background: 'var(--operations-surface-secondary)',
                border: '1px solid var(--operations-border)',
                overflowX: 'auto'
            }} data-animate="fade-up" data-delay="0.12">
                <button
                    className={`operations-btn ${activeTab === 'reports' ? 'operations-btn--gold' : 'operations-btn--secondary'}`}
                    onClick={() => setActiveTab('reports')}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    <FaFileAlt aria-hidden="true" />
                    <span>Daily Reports ({reports.length})</span>
                </button>
                <button
                    className={`operations-btn ${activeTab === 'gallery' ? 'operations-btn--gold' : 'operations-btn--secondary'}`}
                    onClick={() => setActiveTab('gallery')}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    <FaImage aria-hidden="true" />
                    <span>Gallery ({galleryImages.length})</span>
                </button>
                <button
                    className={`operations-btn ${activeTab === 'sites' ? 'operations-btn--gold' : 'operations-btn--secondary'}`}
                    onClick={() => setActiveTab('sites')}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    <FaMapMarkerAlt aria-hidden="true" />
                    <span>Sites ({sites.length})</span>
                </button>
                <button
                    className={`operations-btn ${activeTab === 'engineers' ? 'operations-btn--gold' : 'operations-btn--secondary'}`}
                    onClick={() => setActiveTab('engineers')}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    <FaUsers aria-hidden="true" />
                    <span>Engineers ({assignedEngineers.length})</span>
                </button>
            </div>

            {/* Tab Content */}
            <div data-animate="fade-up" data-delay="0.16">
                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <div className="operations-form-shell" style={{ padding: '2rem' }}>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontWeight: '600' }}>Filter by site:</span>
                                <select
                                    className="operations-select"
                                    value={selectedSiteFilter}
                                    onChange={handleSiteFilterChange}
                                    disabled={sites.length === 0}
                                    style={{ minWidth: '220px' }}
                                >
                                    <option value="">All sites</option>
                                    {sites.map((site) => (
                                        <option key={site.id} value={site.id}>
                                            {site.name}{site.location ? ` - ${site.location}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                {reportsLoading && <span className="operations-spinner" style={{ width: '24px', height: '24px' }} />}
                                <button
                                    className="operations-btn operations-btn--green operations-btn--icon"
                                    onClick={() => handleExport('excel')}
                                    disabled={downloadingFormat !== null}
                                    title="Export Excel"
                                >
                                    <FaFileExcel aria-hidden="true" />
                                </button>
                                <button
                                    className="operations-btn operations-btn--red operations-btn--icon"
                                    onClick={() => handleExport('pdf')}
                                    disabled={downloadingFormat !== null}
                                    title="Export PDF"
                                >
                                    <FaFilePdf aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {reports.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'separate',
                                    borderSpacing: '0'
                                }}>
                                    <thead>
                                        <tr style={{
                                            background: 'var(--operations-surface-tertiary)',
                                            borderBottom: '2px solid var(--operations-border)'
                                        }}>
                                            <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report Date</th>
                                            <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Site</th>
                                            <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submitted By</th>
                                            <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update Summary</th>
                                            <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attachment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map(report => (
                                            <tr
                                                key={report.id}
                                                onClick={() => setSelectedReport(report)}
                                                style={{
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid var(--operations-border)',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--operations-surface-tertiary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '1rem' }}>{new Date(report.reportDate).toLocaleDateString()}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    {report.site ? (
                                                        <>
                                                            <div style={{ fontWeight: '600' }}>{report.site.name}</div>
                                                            {report.site.location && <div style={{ fontSize: '0.85rem', color: 'var(--operations-text-muted)' }}>{report.site.location}</div>}
                                                        </>
                                                    ) : (
                                                        <span style={{ color: 'var(--operations-text-muted)' }}>Whole project</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem' }}>{report.submittedBy.username}</td>
                                                <td style={{ padding: '1rem', maxWidth: '300px' }}>
                                                    {report.workProgressUpdate.substring(0, 100)}{report.workProgressUpdate.length > 100 ? '...' : ''}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    {report.reportFileUrl ? (
                                                        <span className="operations-badge operations-badge--completed">Yes</span>
                                                    ) : (
                                                        <span style={{ color: 'var(--operations-text-muted)' }}>No</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="operations-empty" style={{ padding: '3rem 2rem' }}>
                                <div className="operations-empty__icon" style={{ width: '60px', height: '60px', fontSize: '2rem' }}>
                                    <FaFileAlt aria-hidden="true" />
                                </div>
                                <h3 className="operations-empty__title" style={{ fontSize: '1.25rem' }}>No Daily Reports</h3>
                                <p className="operations-empty__subtitle">
                                    No daily reports have been submitted for this project yet.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Gallery Tab */}
                {activeTab === 'gallery' && (
                    <div className="operations-form-shell" style={{ padding: '2rem' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '700' }}>Image Gallery</h3>
                            {hasPermission('PROJECT_UPDATE') && !project.isArchived && (
                                <button
                                    className="operations-btn operations-btn--green"
                                    onClick={() => setShowGalleryModal(true)}
                                >
                                    <FaImage aria-hidden="true" />
                                    <span>Add Image</span>
                                </button>
                            )}
                        </div>

                        {galleryImages.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                {galleryImages.map(img => (
                                    <div key={img.id} style={{ position: 'relative' }}>
                                        <div
                                            onClick={() => setLightboxImage(img)}
                                            style={{
                                                position: 'relative',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                border: '1px solid var(--operations-border)',
                                                transition: 'transform 0.2s, box-shadow 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <img
                                                src={`http://localhost:8080${img.imageUrl}`}
                                                alt={img.description || 'Gallery image'}
                                                style={{
                                                    width: '100%',
                                                    height: '200px',
                                                    objectFit: 'cover',
                                                    display: 'block'
                                                }}
                                            />
                                            {hasPermission('PROJECT_DELETE') && !project.isArchived && (
                                                <button
                                                    onClick={(e) => confirmImageDelete(img.id, e)}
                                                    className="operations-btn operations-btn--red operations-btn--icon"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '0.5rem',
                                                        right: '0.5rem'
                                                    }}
                                                    title="Delete Image"
                                                >
                                                    <FaTrash aria-hidden="true" />
                                                </button>
                                            )}
                                        </div>
                                        {img.description && (
                                            <small style={{
                                                display: 'block',
                                                marginTop: '0.5rem',
                                                color: 'var(--operations-text-muted)',
                                                fontSize: '0.85rem'
                                            }}>
                                                {img.description}
                                            </small>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="operations-empty" style={{ padding: '3rem 2rem' }}>
                                <div className="operations-empty__icon" style={{ width: '60px', height: '60px', fontSize: '2rem' }}>
                                    <FaImage aria-hidden="true" />
                                </div>
                                <h3 className="operations-empty__title" style={{ fontSize: '1.25rem' }}>No Images</h3>
                                <p className="operations-empty__subtitle">
                                    No images have been added to the gallery yet.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Sites Tab */}
                {activeTab === 'sites' && (
                    <div className="operations-form-shell" style={{ padding: '2rem' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '700' }}>Project Sites</h3>
                            {hasPermission('PROJECT_UPDATE') && !project.isArchived && (
                                <button
                                    className="operations-btn operations-btn--gold"
                                    onClick={() => openSiteModal()}
                                >
                                    <FaPlus aria-hidden="true" />
                                    <span>Add Site</span>
                                </button>
                            )}
                        </div>

                        {sites.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {sites.map((site) => {
                                    const summary = reportSummaries.find((s) => s.siteId === site.id);
                                    const reportCount = summary ? summary.reportCount : 0;
                                    return (
                                        <div
                                            key={site.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1.25rem 1.5rem',
                                                borderRadius: '12px',
                                                background: 'var(--operations-surface-tertiary)',
                                                border: '1px solid var(--operations-border)',
                                                flexWrap: 'wrap',
                                                gap: '1rem'
                                            }}
                                        >
                                            <div style={{ flex: 1, minWidth: '200px' }}>
                                                <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                                                    {site.name}
                                                </div>
                                                {site.location && (
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--operations-text-muted)', marginBottom: '0.25rem' }}>
                                                        <FaMapMarkerAlt aria-hidden="true" style={{ marginRight: '0.35rem' }} />
                                                        {site.location}
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '0.85rem', color: 'var(--operations-text-muted)' }}>
                                                    {reportCount} {reportCount === 1 ? 'report' : 'reports'} submitted
                                                </div>
                                            </div>
                                            {hasPermission('PROJECT_UPDATE') && !project.isArchived && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="operations-btn operations-btn--green operations-btn--icon"
                                                        onClick={() => openSiteModal(site)}
                                                        title="Edit Site"
                                                    >
                                                        <FaEdit aria-hidden="true" />
                                                    </button>
                                                    {hasPermission('PROJECT_DELETE') && (
                                                        <button
                                                            className="operations-btn operations-btn--red operations-btn--icon"
                                                            onClick={() => confirmSiteDelete(site)}
                                                            title="Delete Site"
                                                        >
                                                            <FaTrash aria-hidden="true" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="operations-empty" style={{ padding: '3rem 2rem' }}>
                                <div className="operations-empty__icon" style={{ width: '60px', height: '60px', fontSize: '2rem' }}>
                                    <FaMapMarkerAlt aria-hidden="true" />
                                </div>
                                <h3 className="operations-empty__title" style={{ fontSize: '1.25rem' }}>No Sites</h3>
                                <p className="operations-empty__subtitle">
                                    No sites registered for this project yet.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Engineers Tab */}
                {activeTab === 'engineers' && (
                    <div className="operations-form-shell" style={{ padding: '2rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.35rem', fontWeight: '700' }}>
                            Assigned Engineers
                        </h3>

                        {assignedEngineers.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {assignedEngineers.map(eng => (
                                    <div
                                        key={eng.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '1.25rem 1.5rem',
                                            borderRadius: '12px',
                                            background: 'var(--operations-surface-tertiary)',
                                            border: '1px solid var(--operations-border)'
                                        }}
                                    >
                                        {eng.profilePictureUrl ? (
                                            <img
                                                src={`http://localhost:8080${eng.profilePictureUrl}`}
                                                alt={`${eng.firstName} ${eng.lastName}`}
                                                style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '2px solid var(--operations-border)'
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                background: 'var(--operations-surface-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid var(--operations-border)'
                                            }}>
                                                <FaUser size={24} style={{ color: 'var(--operations-text-muted)' }} />
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>
                                                {eng.firstName} {eng.lastName}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--operations-text-muted)' }}>
                                                {eng.role?.name || 'Field Engineer'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="operations-empty" style={{ padding: '3rem 2rem' }}>
                                <div className="operations-empty__icon" style={{ width: '60px', height: '60px', fontSize: '2rem' }}>
                                    <FaUsers aria-hidden="true" />
                                </div>
                                <h3 className="operations-empty__title" style={{ fontSize: '1.25rem' }}>No Engineers Assigned</h3>
                                <p className="operations-empty__subtitle">
                                    No engineers have been assigned to this project yet.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Site Modal */}
            {showSiteModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'var(--operations-overlay)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--operations-surface-primary)',
                        borderRadius: '16px',
                        maxWidth: '500px',
                        width: '100%',
                        border: '1px solid var(--operations-border)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div style={{
                            padding: '1.5rem 1.75rem',
                            borderBottom: '1px solid var(--operations-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '700' }}>
                                {editingSite ? 'Edit Site' : 'Add Site'}
                            </h3>
                            <button
                                onClick={() => closeSiteModal()}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    color: 'var(--operations-text-muted)'
                                }}
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSiteSubmit}>
                            <div style={{ padding: '1.75rem' }}>
                                <div className="operations-form-group" style={{ marginBottom: '1.25rem' }}>
                                    <label htmlFor="siteName">Site Name</label>
                                    <input
                                        id="siteName"
                                        name="name"
                                        className="operations-input"
                                        value={siteForm.name}
                                        onChange={handleSiteFormChange}
                                        required
                                        placeholder="e.g., Main Construction Area"
                                    />
                                </div>
                                <div className="operations-form-group">
                                    <label htmlFor="siteLocation">Location / Notes</label>
                                    <input
                                        id="siteLocation"
                                        name="location"
                                        className="operations-input"
                                        value={siteForm.location}
                                        onChange={handleSiteFormChange}
                                        placeholder="e.g., Plot 12, Kampala"
                                    />
                                </div>
                            </div>
                            <div style={{
                                padding: '1.25rem 1.75rem',
                                borderTop: '1px solid var(--operations-border)',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.75rem'
                            }}>
                                <button
                                    type="button"
                                    className="operations-btn operations-btn--blue"
                                    onClick={() => closeSiteModal()}
                                    disabled={siteSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`operations-btn ${editingSite ? 'operations-btn--green' : 'operations-btn--gold'}`}
                                    disabled={siteSubmitting}
                                >
                                    {siteSubmitting ? 'Saving...' : editingSite ? 'Update Site' : 'Create Site'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modals */}
            <FieldReportModal
                show={showReportModal}
                handleClose={() => setShowReportModal(false)}
                project={project}
                sites={sites}
                initialSiteId={selectedSiteFilter}
                onReportSubmit={fetchData}
            />

            <ReportViewModal
                show={selectedReport !== null}
                handleClose={() => setSelectedReport(null)}
                report={selectedReport}
            />

            <GalleryUploadModal
                show={showGalleryModal}
                handleClose={() => setShowGalleryModal(false)}
                project={project}
                onUploadSuccess={fetchData}
            />

            <ImageLightbox
                show={lightboxImage !== null}
                handleClose={() => setLightboxImage(null)}
                image={lightboxImage}
            />

            <ConfirmDialog
                open={dialogConfig.open}
                title={dialogConfig.title}
                message={dialogConfig.message}
                detail={dialogConfig.detail}
                tone={dialogConfig.tone}
                confirmLabel={dialogConfig.confirmLabel}
                cancelLabel={dialogConfig.cancelLabel}
                onConfirm={dialogConfig.onConfirm}
                onCancel={closeDialog}
            />
        </section>
    );
};

export default ProjectDetailsPage;
