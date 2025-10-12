import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Container, Spinner, Row, Col, InputGroup, CloseButton } from 'react-bootstrap';
import api from '../api/api.js';
import { toast } from 'react-toastify';

const RequisitionForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState('');
    const [dateNeeded, setDateNeeded] = useState(new Date().toISOString().split('T')[0]);
    const [justification, setJustification] = useState('');
    const [items, setItems] = useState([
        { itemName: '', description: '', quantity: 1, unitOfMeasure: 'pieces', estimatedUnitCost: '' }
    ]);

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const res = await api.get('/projects');
                setProjects(res.data);
            } catch (error) {
                toast.error("Failed to load projects list.");
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const handleItemChange = (index, event) => {
        const values = [...items];
        values[index][event.target.name] = event.target.value;
        setItems(values);
    };

    const handleAddItem = () => {
        setItems([...items, { itemName: '', description: '', quantity: 1, unitOfMeasure: 'pieces', estimatedUnitCost: '' }]);
    };

    const handleRemoveItem = (index) => {
        const values = [...items];
        values.splice(index, 1);
        setItems(values);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { projectId, dateNeeded, justification, items };

        try {
            await api.post('/requisitions', payload);
            toast.success("Requisition submitted successfully!");
            navigate('/requisitions');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit requisition.");
        }
    };

    if (loading) return <Spinner animation="border" />;

    return (
        <Container>
            <Card className="shadow-sm">
                <Card.Header as="h3">Create New Requisition</Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={8}><Form.Group className="mb-3">
                                <Form.Label>For Project</Form.Label>
                                <Form.Select value={projectId} onChange={e => setProjectId(e.target.value)} required>
                                    <option value="">Select a Project...</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Form.Select>
                            </Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3">
                                <Form.Label>Date Needed</Form.Label>
                                <Form.Control type="date" value={dateNeeded} onChange={e => setDateNeeded(e.target.value)} required />
                            </Form.Group></Col>
                        </Row>
                        <Form.Group className="mb-4">
                            <Form.Label>Justification / Purpose</Form.Label>
                            <Form.Control as="textarea" rows={3} value={justification} onChange={e => setJustification(e.target.value)} required />
                        </Form.Group>

                        <h5>Items Requested</h5>
                        {items.map((item, index) => (
                            <Card key={index} className="mb-3 bg-light">
                                <Card.Body>
                                    <Row>
                                        <Col xs={11}>
                                            <Form.Group className="mb-2">
                                                <Form.Label>Item Name</Form.Label>
                                                <Form.Control type="text" name="itemName" value={item.itemName} onChange={e => handleItemChange(index, e)} required />
                                            </Form.Group>
                                            <Row>
                                                <Col md={4}><Form.Group className="mb-2">
                                                    <Form.Label>Quantity</Form.Label>
                                                    <Form.Control type="number" name="quantity" value={item.quantity} onChange={e => handleItemChange(index, e)} required min="0.1" step="0.01"/>
                                                </Form.Group></Col>
                                                <Col md={4}><Form.Group className="mb-2">
                                                    <Form.Label>Unit of Measure</Form.Label>
                                                    <Form.Control type="text" name="unitOfMeasure" value={item.unitOfMeasure} onChange={e => handleItemChange(index, e)} required />
                                                </Form.Group></Col>
                                                <Col md={4}><Form.Group className="mb-2">
                                                    <Form.Label>Est. Unit Cost (UGX)</Form.Label>
                                                    <Form.Control type="number" name="estimatedUnitCost" value={item.estimatedUnitCost} onChange={e => handleItemChange(index, e)} required min="0"/>
                                                </Form.Group></Col>
                                            </Row>
                                        </Col>
                                        <Col xs={1} className="d-flex align-items-center justify-content-center">
                                            {items.length > 1 && <CloseButton onClick={() => handleRemoveItem(index)} />}
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        ))}
                        <Button variant="outline-secondary" onClick={handleAddItem}>Add Another Item</Button>

                        <div className="mt-4">
                            <Button variant="primary" type="submit">Submit Requisition</Button>
                            <Button variant="secondary" className="ms-2" onClick={() => navigate('/requisitions')}>Cancel</Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default RequisitionForm;