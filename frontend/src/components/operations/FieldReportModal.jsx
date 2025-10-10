import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../api/api.js';

const FieldReportModal = ({ show, handleClose, project, onReportSubmit }) => {
    const [formData, setFormData] = useState({
        reportDate: new Date().toISOString().split('T')[0], // Defaults to today
        workProgressUpdate: '', materialsUsed: '', challengesFaced: '', weatherConditions: ''
    });

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            projectId: project.id,
            siteId: null // We can add a site selector here in the future
        };

        try {
            await api.post('/reports/field-daily', payload);
            toast.success('Daily report submitted successfully!');
            onReportSubmit(); // Refresh the parent page's data
            handleClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit report.');
        }
    };
    
    if (!project) return null;

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Submit Daily Report for: {project.name}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3">
                            <Form.Label>Report Date</Form.Label>
                            <Form.Control type="date" name="reportDate" value={formData.reportDate} onChange={handleFormChange} required />
                        </Form.Group></Col>
                         <Col md={6}><Form.Group className="mb-3">
                            <Form.Label>Weather Conditions</Form.Label>
                            <Form.Control type="text" name="weatherConditions" value={formData.weatherConditions} onChange={handleFormChange} placeholder="e.g., Sunny, Overcast, Rainy"/>
                        </Form.Group></Col>
                    </Row>
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
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                    <Button variant="primary" type="submit">Submit Report</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default FieldReportModal;