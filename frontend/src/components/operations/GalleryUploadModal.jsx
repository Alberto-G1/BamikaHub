import React, { useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../api/api.js';

const GalleryUploadModal = ({ show, handleClose, project, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error("Please select an image file to upload.");
            return;
        }
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', description);

        try {
            await api.post(`/projects/${project.id}/gallery`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Image added to gallery successfully!");
            onUploadSuccess(); // Refresh the project details page
            handleClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to upload image.");
        } finally {
            setIsUploading(false);
        }
    };
    
    // Reset state when the modal closes
    const onExited = () => {
        setFile(null);
        setDescription('');
    };

    if (!project) return null;

    return (
        <Modal show={show} onHide={handleClose} onExited={onExited} centered>
            <Modal.Header closeButton>
                <Modal.Title>Add Image to Gallery</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Image File</Form.Label>
                        <Form.Control type="file" onChange={handleFileChange} required accept="image/*" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description (Optional)</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the image or the work shown..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={isUploading}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={isUploading}>
                        {isUploading ? <><Spinner as="span" animation="border" size="sm" /> Uploading...</> : 'Upload Image'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default GalleryUploadModal;