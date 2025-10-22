import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Spinner, Tabs, Tab, Badge, Table, ListGroup, Image, Alert, Form, Modal } from 'react-bootstrap';
import { FaArrowLeft, FaPlus, FaUser, FaEdit, FaImage, FaArchive, FaTrash, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import FieldReportModal from '../../components/operations/FieldReportModal.jsx';
import ReportViewModal from '../../components/operations/ReportViewModal.jsx';
import GalleryUploadModal from '../../components/operations/GalleryUploadModal.jsx';
import ImageLightbox from '../../components/operations/ImageLightbox.jsx';

const getStatusBadge = (status) => {
    switch (status) {
        case 'IN_PROGRESS': return <Badge bg="primary">In Progress</Badge>;
        case 'COMPLETED': return <Badge bg="success">Completed</Badge>;
        case 'PLANNING': return <Badge bg="info">Planning</Badge>;
        case 'ON_HOLD': return <Badge bg="warning" text="dark">On Hold</Badge>;
        case 'CANCELLED': return <Badge bg="danger">Cancelled</Badge>;
        default: return <Badge bg="secondary">{status}</Badge>;
    }
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

    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [showSiteModal, setShowSiteModal] = useState(false);
    const [editingSite, setEditingSite] = useState(null);
    const [siteForm, setSiteForm] = useState({ name: '', location: '' });
    const [siteSubmitting, setSiteSubmitting] = useState(false);

        
    const [lightboxImage, setLightboxImage] = useState(null);

    const loadReports = async (siteId) => {
        setReportsLoading(true);
        try {
            const params = {};
            if (siteId) {
                params.siteId = siteId;
            }
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
            // In future we can add date range filters here

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
                await api.put(`/sites/${editingSite.id}`, {
                    ...siteForm,
                    projectId: project.id
                });
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
    const handleSiteDelete = async (site) => {
        if (!project) return;
        if (project.isArchived) {
            toast.error('This project is archived; sites cannot be modified.');
            return;
        }
        const confirm = window.confirm(`Delete site "${site.name}"? This action cannot be undone.`);
        if (!confirm) {
            return;
        }

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


    const handleImageDelete = async (imageId, event) => {
        event.stopPropagation(); // Prevent the lightbox from opening
        
        const toastId = toast.error(
            <div><p>Delete this image from the gallery?</p>
                <Button variant="danger" size="sm" onClick={async () => {
                    try {
                        await api.delete(`/projects/${project.id}/gallery/${imageId}`);
                        toast.success("Image deleted successfully.");
                        fetchData(); // Refresh to see the change
                    } catch (error) { toast.error("Failed to delete image."); }
                    toast.dismiss(toastId);
                }}>Confirm Delete</Button>
            </div> // ... (simplified toast)
        );
    };

    if (loading) return <Spinner animation="border" />;
    if (!project) return <p>Project not found.</p>;

    const galleryImages = project.galleryImages || []; 
    const assignedEngineers = project.assignedEngineers || [];

    return (
        <>
            <Container>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/projects')}>
                        <FaArrowLeft className="me-2" /> Back to Projects
                    </Button>
                    <div>
                        {/* THE FIX: Hide buttons if project is archived */}
                        {hasPermission('PROJECT_UPDATE') && !project.isArchived && (
                            <Button variant="outline-warning" className="me-2" onClick={() => navigate(`/projects/edit/${id}`)}>
                                <FaEdit className="me-2" /> Edit Project
                            </Button>
                        )}
                        {hasPermission('FIELD_REPORT_SUBMIT') && !project.isArchived && (
                            <Button variant="primary" onClick={() => setShowReportModal(true)}>
                                <FaPlus className="me-2" /> Submit Daily Report
                            </Button>
                        )}
                    </div>
                </div>

                {/* THE FIX: Show a prominent banner if the project is archived */}
                {project.isArchived && (
                    <Alert variant="secondary" className="d-flex align-items-center">
                        <FaArchive className="me-3" size={24}/>
                        <div>
                            <Alert.Heading>This Project is Archived</Alert.Heading>
                            <p className="mb-0">This is a read-only historical record. No further modifications are allowed.</p>
                        </div>
                    </Alert>
                )}
                
                <Card className="shadow-sm mb-4">
                    <Card.Header as="h2" className="d-flex justify-content-between align-items-center">
                        {project.name}
                        {getStatusBadge(project.status)}
                    </Card.Header>
                    <Card.Body>
                        <p><strong>Client:</strong> {project.clientName}</p>
                        <p>{project.description}</p>
                    </Card.Body>
                </Card>

                <Tabs defaultActiveKey="reports" id="project-details-tabs" className="mb-3">
                    <Tab eventKey="reports" title={`Daily Reports (${reports.length})`}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
                                    <div className="d-flex align-items-center">
                                        <span className="me-2 fw-semibold">Filter by site:</span>
                                        <Form.Select
                                            value={selectedSiteFilter}
                                            onChange={handleSiteFilterChange}
                                            style={{ minWidth: '220px' }}
                                            disabled={sites.length === 0}
                                        >
                                            <option value="">All sites</option>
                                            {sites.map((site) => (
                                                <option key={site.id} value={site.id}>
                                                    {site.name}{site.location ? ` - ${site.location}` : ''}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </div>
                                    <div className="d-flex align-items-center mt-3 mt-md-0">
                                        {reportsLoading && <Spinner animation="border" size="sm" className="me-3" />}
                                        <Button
                                            variant="outline-success"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => handleExport('excel')}
                                            disabled={downloadingFormat !== null}
                                        >
                                            {downloadingFormat === 'excel' ? 'Exporting…' : <><FaFileExcel className="me-2"/>Export Excel</>}
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleExport('pdf')}
                                            disabled={downloadingFormat !== null}
                                        >
                                            {downloadingFormat === 'pdf' ? 'Exporting…' : <><FaFilePdf className="me-2"/>Export PDF</>}
                                        </Button>
                                    </div>
                                </div>
                                {reports.length > 0 ? (
                                    <Table striped bordered hover responsive size="sm">
                                        <thead>
                                            <tr><th>Report Date</th><th>Site</th><th>Submitted By</th><th>Update Summary</th><th>Attachment</th></tr>
                                        </thead>
                                        <tbody>
                                            {reports.map(report => (
                                                <tr key={report.id} onClick={() => setSelectedReport(report)} style={{ cursor: 'pointer' }}>
                                                    <td>{new Date(report.reportDate).toLocaleDateString()}</td>
                                                    <td>
                                                        {report.site ? (
                                                            <>
                                                                <div>{report.site.name}</div>
                                                                {report.site.location && <div className="text-muted small">{report.site.location}</div>}
                                                            </>
                                                        ) : (
                                                            <span className="text-muted">Whole project</span>
                                                        )}
                                                    </td>
                                                    <td>{report.submittedBy.username}</td>
                                                    <td>{report.workProgressUpdate.substring(0, 100)}{report.workProgressUpdate.length > 100 ? '...' : ''}</td>
                                                    <td>{report.reportFileUrl ? 'Yes' : 'No'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <p className="text-muted">No daily reports have been submitted for this project yet.</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>
                    <Tab eventKey="gallery" title="Project Gallery">
                        <Card className="shadow-sm">
                             <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5>Image Gallery</h5>
                                {hasPermission('PROJECT_UPDATE') && !project.isArchived && (
                                    <Button variant="outline-primary" size="sm" onClick={() => setShowGalleryModal(true)}>
                                        <FaImage className="me-2" /> Add Image
                                    </Button>
                                )}
                             </Card.Header>
                             <Card.Body>
                                {galleryImages.length > 0 ? (
                                    <Row xs={2} md={3} lg={4} className="g-3">
                                        {galleryImages.map(img => (
                                            <Col key={img.id}>
                                                <div className="gallery-image-container" onClick={() => setLightboxImage(img)}>
                                                    <Image src={`http://localhost:8080${img.imageUrl}`} thumbnail />
                                                    {hasPermission('PROJECT_DELETE') && !project.isArchived && (
                                                        <div className="gallery-image-overlay">
                                                            <button className="delete-icon-btn" title="Delete Image" onClick={(e) => handleImageDelete(img.id, e)}>
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <small className="text-muted d-block mt-1">{img.description}</small>
                                            </Col>
                                        ))}
                                    </Row>
                                 ) : (
                                    <p className="text-muted">No images have been added to the gallery yet.</p>
                                )}
                             </Card.Body>
                        </Card>
                    </Tab>
                    <Tab eventKey="sites" title={`Sites (${sites.length})`}>
                        <Card className="shadow-sm">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Project Sites</h5>
                                {hasPermission('PROJECT_UPDATE') && !project.isArchived && (
                                    <Button variant="outline-primary" size="sm" onClick={() => openSiteModal()}>
                                        <FaPlus className="me-2" /> Add Site
                                    </Button>
                                )}
                            </Card.Header>
                            <Card.Body>
                                {sites.length > 0 ? (
                                    <ListGroup variant="flush">
                                        {sites.map((site) => {
                                            const summary = reportSummaries.find((s) => s.siteId === site.id);
                                            const reportCount = summary ? summary.reportCount : 0;
                                            return (
                                                <ListGroup.Item key={site.id} className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                                                    <div>
                                                        <div className="fw-semibold">{site.name}</div>
                                                        {site.location && <div className="text-muted small">{site.location}</div>}
                                                        <div className="text-muted small">{reportCount} {reportCount === 1 ? 'report' : 'reports'} submitted</div>
                                                    </div>
                                                {hasPermission('PROJECT_UPDATE') && !project.isArchived && (
                                                    <div className="mt-3 mt-md-0">
                                                        <Button
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={() => openSiteModal(site)}
                                                        >
                                                            <FaEdit className="me-1" /> Edit
                                                        </Button>
                                                        {hasPermission('PROJECT_DELETE') && (
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleSiteDelete(site)}
                                                            >
                                                                <FaTrash className="me-1" /> Delete
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                                </ListGroup.Item>
                                            );
                                        })}
                                    </ListGroup>
                                ) : (
                                    <p className="text-muted mb-0">No sites registered for this project yet.</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>
                    <Tab eventKey="engineers" title={`Assigned Engineers (${assignedEngineers.length})`}>
                        <Card className="shadow-sm">
                            <ListGroup variant="flush">
                                {assignedEngineers.map(eng => (
                                    <ListGroup.Item key={eng.id} className="d-flex align-items-center">
                                        {eng.profilePictureUrl ? (
                                             <Image src={`http://localhost:8080${eng.profilePictureUrl}`} roundedCircle width={30} height={30} className="me-2" style={{objectFit: 'cover'}}/>
                                        ) : (
                                            <FaUser size={30} className="me-2 text-secondary"/>
                                        )}
                                        {eng.firstName} {eng.lastName}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card>
                    </Tab>
                </Tabs>
            </Container>

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

            <Modal show={showSiteModal} onHide={closeSiteModal} centered>
                <Form onSubmit={handleSiteSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingSite ? 'Edit Site' : 'Add Site'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Site Name</Form.Label>
                            <Form.Control
                                name="name"
                                value={siteForm.name}
                                onChange={handleSiteFormChange}
                                required
                                placeholder="e.g., Main Construction Area"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Location / Notes</Form.Label>
                            <Form.Control
                                name="location"
                                value={siteForm.location}
                                onChange={handleSiteFormChange}
                                placeholder="e.g., Plot 12, Kampala"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeSiteModal} disabled={siteSubmitting}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={siteSubmitting}>
                            {siteSubmitting ? 'Saving...' : editingSite ? 'Update Site' : 'Create Site'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default ProjectDetailsPage;