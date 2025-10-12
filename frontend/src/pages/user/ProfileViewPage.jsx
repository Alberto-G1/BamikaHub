import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Image, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaUserCircle } from 'react-icons/fa';
import api from '../../api/api.js';
import { toast } from 'react-toastify';

const ProfileViewPage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await api.get('/profile/me');
                setProfile(res.data);
            } catch (error) {
                toast.error('Could not load profile data.');
                navigate('/dashboard'); // Redirect if profile can't be loaded
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    if (!profile) {
        return <p>Could not load profile.</p>;
    }

    return (
        <Container>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>My Profile</h2>
                <Button variant="primary" onClick={() => navigate('/profile/edit')}>
                    <FaEdit className="me-2" /> Edit Profile
                </Button>
            </div>
            <Row>
                <Col md={4}>
                    <Card className="mb-3">
                        <Card.Body className="text-center">
                            {profile.profilePictureUrl ? (
                                <Image 
                                    src={`http://localhost:8080${profile.profilePictureUrl}`} 
                                    roundedCircle 
                                    fluid 
                                    style={{ width: '150px', height: '150px', objectFit: 'cover' }} 
                                />
                            ) : (
                                <FaUserCircle size={150} className="text-muted" />
                            )}
                            <h4 className="mt-3">{profile.firstName} {profile.lastName}</h4>
                            <p className="text-muted mb-1">{profile.roleName}</p>
                            <p className="text-muted">{profile.email}</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={8}>
                    <Card>
                        <Card.Header as="h5">Profile Details</Card.Header>
                        <ListGroup variant="flush">
                            <ListGroup.Item>
                                <strong>Full Name:</strong> {profile.firstName} {profile.lastName}
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <strong>Username:</strong> {profile.username}
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <strong>Phone Number:</strong> {profile.phoneNumber || 'Not Provided'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <strong>Address:</strong> {profile.address || 'Not Provided'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <strong>City:</strong> {profile.city || 'Not Provided'}
                            </ListGroup.Item>
                             <ListGroup.Item>
                                <strong>Country:</strong> {profile.country || 'Not Provided'}
                            </ListGroup.Item>
                             <ListGroup.Item>
                                <strong>Date of Birth:</strong> {profile.dateOfBirth || 'Not Provided'}
                            </ListGroup.Item>
                             <ListGroup.Item>
                                <strong>Gender:</strong> {profile.gender || 'Not Provided'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <strong>Account Status:</strong> <span className="text-success">{profile.statusName}</span>
                            </ListGroup.Item>
                             <ListGroup.Item>
                                <strong>Joined On:</strong> {new Date(profile.joinedOn).toLocaleDateString()}
                            </ListGroup.Item>
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ProfileViewPage;