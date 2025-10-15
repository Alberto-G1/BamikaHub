import React from 'react';
import { Modal, Image } from 'react-bootstrap';

const ImageLightbox = ({ show, handleClose, image }) => {
    if (!image) return null;

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>Image Preview</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center bg-dark">
                <Image src={`http://localhost:8080${image.imageUrl}`} fluid style={{ maxHeight: '80vh' }} />
            </Modal.Body>
            {image.description && (
                <Modal.Footer>
                    <p className="text-muted mb-0">{image.description}</p>
                </Modal.Footer>
            )}
        </Modal>
    );
};

export default ImageLightbox;