import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Row, Col, Form, Button, Spinner, Tabs, Tab, Image } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/api.js';
import { toast } from 'react-toastify';
import { FaUserCircle } from 'react-icons/fa';

const ProfilePage = () => {
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState({});
    const [uploading, setUploading] = useState(false);
    
    // Create a ref to the hidden file input element
    const fileInputRef = useRef(null);

    // Form state for editable profile fields
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', gender: '', dateOfBirth: '',
        phoneNumber: '', address: '', city: '', country: ''
    });

    // Form state for password change fields
    const [passwordData, setPasswordData] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await api.get('/profile/me');
                setProfileData(res.data);
                // Populate the editable form state
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
            } catch (error) {
                toast.error('Could not load profile data.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

        // Function to trigger the hidden file input
    const handlePictureButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Client-side validation
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File is too large! Maximum size is 2MB.");
            return;
        }
        if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
            toast.error("Invalid file type! Only JPG and PNG are allowed.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/profile/me/picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Update the profile data with the new URL from the backend
            setProfileData(prev => ({ ...prev, profilePictureUrl: res.data.profilePictureUrl }));
            toast.success("Profile picture updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to upload picture.");
        } finally {
            setUploading(false);
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/profile/me', formData);
            setProfileData(res.data); // Update the main data display
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile.');
        }
    };

    const handlePasswordFormChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };
    
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        // UPDATED: Read from the state object
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        try {
            // UPDATED: Create payload from the state object
            const payload = { 
                currentPassword: passwordData.currentPassword, 
                newPassword: passwordData.newPassword 
            };
            const res = await api.post('/profile/change-password', payload);
            toast.success(res.data);
            
            // UPDATED: Reset the state object
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password.');
        }
    };

    if (loading) return <Spinner animation="border" />;

    return (
        <Container>
            <Row>
                <Col md={4}>
                    <Card className="mb-3">
                        <Card.Body className="text-center position-relative">
                            {uploading && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10, borderRadius: '.375rem' }}>
                                    <Spinner animation="border" variant="light" />
                                </div>
                            )}

                            {profileData.profilePictureUrl ? (
                                <Image src={`http://localhost:8080${profileData.profilePictureUrl}`} roundedCircle fluid style={{ width: '150px', height: '150px', objectFit: 'cover' }} />
                            ) : (
                                <FaUserCircle size={150} className="text-muted" />
                            )}
                            
                            <h4 className="mt-3">{profileData.firstName} {profileData.lastName}</h4>
                            <p className="text-muted">{profileData.roleName}</p>
                            
                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept="image/png, image/jpeg"
                            />

                            {/* This button now triggers the hidden input */}
                            <Button variant="outline-primary" size="sm" onClick={handlePictureButtonClick} disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Change Photo'}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={8}>
                    <Card>
                        <Tabs defaultActiveKey="info" className="mb-3">
                            <Tab eventKey="info" title="Profile Information">
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
                                                <Form.Label>Email</Form.Label>
                                                <Form.Control type="email" value={profileData.email || ''} disabled />
                                            </Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3">
                                                <Form.Label>Phone Number</Form.Label>
                                                <Form.Control type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleFormChange} placeholder="+256700123456" />
                                            </Form.Group></Col>
                                        </Row>
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3">
                                                <Form.Label>Date of Birth</Form.Label>
                                                <Form.Control type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleFormChange} />
                                            </Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3">
                                                <Form.Label>Gender</Form.Label>
                                                <Form.Select name="gender" value={formData.gender} onChange={handleFormChange}>
                                                    <option value="">Select...</option>
                                                    <option value="MALE">Male</option>
                                                    <option value="FEMALE">Female</option>
                                                    <option value="OTHER">Other</option>
                                                </Form.Select>
                                            </Form.Group></Col>
                                        </Row>
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
                                    </Form>
                                </Card.Body>
                            </Tab>
                            <Tab eventKey="security" title="Security">
                                <Card.Body>
                                    <h5 className="card-title">Change Password</h5>
                                    <Form onSubmit={handlePasswordChange}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Current Password</Form.Label>
                                            <Form.Control 
                                                type="password" 
                                                name="currentPassword" 
                                                value={passwordData.currentPassword} 
                                                onChange={handlePasswordFormChange} 
                                                required 
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>New Password</Form.Label>
                                            <Form.Control 
                                                type="password" 
                                                name="newPassword" 
                                                value={passwordData.newPassword} 
                                                onChange={handlePasswordFormChange} 
                                                required 
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Confirm New Password</Form.Label>
                                            <Form.Control 
                                                type="password" 
                                                name="confirmPassword" 
                                                value={passwordData.confirmPassword} 
                                                onChange={handlePasswordFormChange} 
                                                required 
                                            />
                                        </Form.Group>
                                        <Button type="submit" variant="primary">Update Password</Button>
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

export default ProfilePage;