import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Row, Col, Form, Button, Spinner, Tabs, Tab, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';

const ProfileEditPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [profilePictureUrl, setProfilePictureUrl] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', gender: '', dateOfBirth: '',
        phoneNumber: '', address: '', city: '', country: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });

    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await api.get('/profile/me');
                setFormData({
                    firstName: res.data.firstName || '',
                    lastName: res.data.lastName || '',
                    gender: res.data.gender || '',
                    dateOfBirth: res.data.dateOfBirth || '',
                    phoneNumber: res.data.phoneNumber || '',
                    address: res.data.address || '',
                    city: res.data.city || '',
                    country: res.data.country || '',
                });
                setProfilePictureUrl(res.data.profilePictureUrl);
            } catch (error) {
                toast.error('Could not load profile data for editing.');
                navigate('/profile'); // Redirect back if data fails to load
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put('/profile/me', formData);
            toast.success('Profile updated successfully!');
            navigate('/profile');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile.');
        }
    };

    const handlePasswordFormChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        try {
            const payload = { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword };
            const res = await api.post('/profile/change-password', payload);
            toast.success(res.data);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password.');
        }
    };

    const handlePictureButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File is too large! Maximum size is 2MB.");
            return;
        }
        if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
            toast.error("Invalid file type! Only JPG and PNG are allowed.");
            return;
        }

        const apiFormData = new FormData();
        apiFormData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/profile/me/picture', apiFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfilePictureUrl(res.data.profilePictureUrl);
            toast.success("Profile picture updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to upload picture.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <Spinner animation="border" />;

    return (
        <Container>
            <Row>
                <Col md={4}>
                    <Card className="mb-3 shadow-sm">
                        <Card.Header as="h5">Profile Picture</Card.Header>
                        <Card.Body className="text-center position-relative">
                            {uploading && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10, borderRadius: '.375rem' }}>
                                    <Spinner animation="border" variant="light" />
                                </div>
                            )}
                            {profilePictureUrl ? (
                                <Image src={`http://localhost:8080${profilePictureUrl}`} roundedCircle fluid style={{ width: '150px', height: '150px', objectFit: 'cover' }} />
                            ) : (
                                <FaUserCircle size={150} className="text-muted" />
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/png, image/jpeg" />
                            <Button variant="outline-primary" size="sm" className="mt-3" onClick={handlePictureButtonClick} disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Change Photo'}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={8}>
                    <Card className="shadow-sm">
                        <Tabs defaultActiveKey="info" id="profile-edit-tabs" className="mb-3">
                            <Tab eventKey="info" title="Personal Information">
                                <Card.Body>
                                    <Form onSubmit={handleProfileUpdate}>
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3">
                                                <Form.Label>First Name</Form.Label>
                                                <Form.Control type="text" name="firstName" value={formData.firstName} onChange={handleFormChange} required />
                                            </Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3">
                                                <Form.Label>Last Name</Form.Label>
                                                <Form.Control type="text" name="lastName" value={formData.lastName} onChange={handleFormChange} required />
                                            </Form.Group></Col>
                                        </Row>
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3">
                                                <Form.Label>Phone Number</Form.Label>
                                                <Form.Control type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleFormChange} placeholder="+256700123456" />
                                            </Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3">
                                                <Form.Label>Date of Birth</Form.Label>
                                                <Form.Control type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleFormChange} />
                                            </Form.Group></Col>
                                        </Row>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Gender</Form.Label>
                                            <Form.Select name="gender" value={formData.gender} onChange={handleFormChange}>
                                                <option value="">Select...</option>
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                                <option value="OTHER">Other</option>
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Address</Form.Label>
                                            <Form.Control type="text" name="address" value={formData.address} onChange={handleFormChange} />
                                        </Form.Group>
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3">
                                                <Form.Label>City</Form.Label>
                                                <Form.Control type="text" name="city" value={formData.city} onChange={handleFormChange} />
                                            </Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3">
                                                <Form.Label>Country</Form.Label>
                                                <Form.Control type="text" name="country" value={formData.country} onChange={handleFormChange} />
                                            </Form.Group></Col>
                                        </Row>
                                        <Button type="submit" variant="primary">Save Changes</Button>
                                        <Button variant="secondary" className="ms-2" onClick={() => navigate('/profile')}>Cancel</Button>
                                    </Form>
                                </Card.Body>
                            </Tab>
                            <Tab eventKey="security" title="Security">
                                <Card.Body>
                                    <h5 className="card-title">Change Password</h5>
                                    <Form onSubmit={handlePasswordChange}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Current Password</Form.Label>
                                            <Form.Control type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordFormChange} required />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>New Password</Form.Label>
                                            <Form.Control type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordFormChange} required />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Confirm New Password</Form.Label>
                                            <Form.Control type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordFormChange} required />
                                        </Form.Group>
                                        <Button type="submit" variant="primary">Update Password</Button>
                                        <Button variant="secondary" className="ms-2" onClick={() => navigate('/profile')}>Cancel</Button>
                                    </Form>
                                </Card.Body>
                            </Tab>
                        </Tabs>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ProfileEditPage;