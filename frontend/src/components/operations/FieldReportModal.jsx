import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../api/api.js';

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

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setReportFile(e.target.files[0]);
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
            workProgressUpdate: '', materialsUsed: '', challengesFaced: '', weatherConditions: ''
        });
        setReportFile(null);
    };

    useEffect(() => {
        if (show) {
            setFormData((prev) => ({
                ...prev,
                siteId: initialSiteId || ''
            }));
        }
    }, [show, initialSiteId]);

    if (!project) return null;

    return (
        <Modal show={show} onHide={handleClose} onExited={onExit} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Submit Daily Report for: {project.name}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {/* General Information Fields (always visible) */}
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Report Date</Form.Label>
                                <Form.Control type="date" name="reportDate" value={formData.reportDate} onChange={handleFormChange} required />
                            </Form.Group>
                        </Col>
                         <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Weather Conditions</Form.Label>
                                <Form.Control type="text" name="weatherConditions" value={formData.weatherConditions} onChange={handleFormChange} placeholder="e.g., Sunny, Overcast, Rainy"/>
                            </Form.Group>
                         </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Site (optional)</Form.Label>
                        <Form.Select name="siteId" value={formData.siteId} onChange={handleFormChange} disabled={sites.length === 0}>
                            <option value="">Whole project / unspecified site</option>
                            {sites.map((site) => (
                                <option key={site.id} value={site.id}>
                                    {site.name}{site.location ? ` - ${site.location}` : ''}
                                </option>
                            ))}
                        </Form.Select>
                        {sites.length === 0 && (
                            <Form.Text className="text-muted">
                                No sites defined for this project yet.
                            </Form.Text>
                        )}
                    </Form.Group>
                    <hr />

                    {/* Submission Type Toggle */}
                    <Form.Group className="mb-3 text-center">
                        <Form.Label className="me-3">Submission Type:</Form.Label>
                        <Form.Check
                            inline
                            type="radio"
                            label="Fill Form"
                            name="submissionType"
                            id="type-form"
                            checked={submissionType === 'form'}
                            onChange={() => setSubmissionType('form')}
                        />
                        <Form.Check
                            inline
                            type="radio"
                            label="Upload File"
                            name="submissionType"
                            id="type-file"
                            checked={submissionType === 'file'}
                            onChange={() => setSubmissionType('file')}
                        />
                    </Form.Group>
                    
                    {/* Conditional Fields based on Toggle */}
                    {submissionType === 'form' ? (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>Work Progress Update</Form.Label>
                                <Form.Control as="textarea" rows={4} name="workProgressUpdate" value={formData.workProgressUpdate} onChange={handleFormChange} required placeholder="Describe the work completed today..."/>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Materials Used</Form.Label>
                                <Form.Control as="textarea" rows={3} name="materialsUsed" value={formData.materialsUsed} onChange={handleFormChange} placeholder="List materials and quantities used..."/>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Challenges or Blockers</Form.Label>
                                <Form.Control as="textarea" rows={2} name="challengesFaced" value={formData.challengesFaced} onChange={handleFormChange} placeholder="Describe any issues faced..."/>
                            </Form.Group>
                        </>
                    ) : (
                        <Form.Group className="mb-3">
                            <Form.Label>Upload Report Document</Form.Label>
                            <Form.Control type="file" onChange={handleFileChange} required accept=".pdf,.doc,.docx,image/*"/>
                            <Form.Text className="text-muted">
                                Please upload a PDF, Word document, or image file containing your report.
                            </Form.Text>
                        </Form.Group>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default FieldReportModal;