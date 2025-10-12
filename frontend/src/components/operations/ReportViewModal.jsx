import React from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';
import { FaDownload, FaFileAlt } from 'react-icons/fa';

const ReportViewModal = ({ show, handleClose, report }) => {
    if (!report) return null;

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Report Details - {new Date(report.reportDate).toLocaleDateString()}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h5>Submitted by: {report.submittedBy.username}</h5>
                <p><strong>Weather:</strong> {report.weatherConditions || 'N/A'}</p>
                
                <hr />
                <h6>Work Progress Update</h6>
                <p style={{ whiteSpace: 'pre-wrap' }}>{report.workProgressUpdate}</p>
                
                <h6>Materials Used</h6>
                <p style={{ whiteSpace: 'pre-wrap' }}>{report.materialsUsed || 'None listed.'}</p>

                <h6>Challenges Faced</h6>
                <p style={{ whiteSpace: 'pre-wrap' }}>{report.challengesFaced || 'None listed.'}</p>
                
                {report.reportFileUrl && (
                    <>
                        <hr />
                        <h6>Attached File</h6>
                        <a href={`http://localhost:8080${report.reportFileUrl}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline-primary">
                                <FaDownload className="me-2" /> Download/View Attachment
                            </Button>
                        </a>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ReportViewModal;