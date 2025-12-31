import React from 'react';
import { 
    FaInfoCircle, 
    FaBuilding, 
    FaUsers, 
    FaShieldAlt, 
    FaChartLine,
    FaTools,
    FaLightbulb,
    FaBullseye,
    FaEnvelope,
    FaPhone,
    FaCode,
    FaQuestionCircle,
    FaHandshake,
    FaCrown,
    FaStar
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext.jsx';
import './AboutPage.css';

const AboutPage = () => {
    const { user } = useAuth();

    // Check if user has permissions to see detailed information
    const hasDetailedAccess = user && (
        user.role === 'ADMIN' || 
        user.role === 'SUPER_ADMIN' ||
        user.permissions?.includes('VIEW_SYSTEM_DETAILS')
    );

    const systemVersion = "0.0.1-SNAPSHOT";
    const releaseDate = "December 2025";
    const deploymentEnv = "Development";

    return (
        <div className="about-container">
            {/* Page Header */}
            <div className="about-header">
                <div className="about-header-content">
                    <div className="about-header-icon">
                        <FaInfoCircle size={42} />
                    </div>
                    <div className="about-header-text">
                        <h1 className="about-title">About BamikaHub</h1>
                        <p className="about-subtitle">Comprehensive Engineering Operations Management Platform</p>
                    </div>
                    {hasDetailedAccess && (
                        <div className="about-admin-badge">
                            <FaShieldAlt /> Admin Access
                        </div>
                    )}
                </div>
                <div className="about-header-actions">
                    <div className="about-version-info">
                        <span className="version-label">Version:</span>
                        <span className="version-value">{systemVersion}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="about-content">
                {/* System Overview Card */}
                <div className="about-card about-card-primary">
                    <div className="about-card-header">
                        <div className="about-card-icon">
                            <FaInfoCircle />
                        </div>
                        <h2>System Overview</h2>
                    </div>
                    <div className="about-card-body">
                        <p>
                            BamikaHub is a comprehensive enterprise resource management platform specifically designed for 
                            Bamika Engineering Operations. It integrates inventory control, project management, financial tracking, 
                            support ticketing, team assignments, and real-time communication into a unified system. The platform 
                            provides end-to-end visibility across all engineering operations while maintaining strict security, 
                            role-based access control, and complete audit trails for compliance and accountability.
                        </p>
                    </div>
                </div>

                {/* Purpose & Mission */}
                <div className="about-grid">
                    <div className="about-card about-card-highlight">
                        <div className="about-card-header">
                            <div className="about-card-icon">
                                <FaBullseye />
                            </div>
                            <h2>Purpose</h2>
                        </div>
                        <div className="about-card-body">
                            <p>
                                BamikaHub was developed to address critical operational challenges across multiple engineering departments. 
                                It eliminates manual tracking errors, reduces stock shortages, prevents budget overruns, streamlines 
                                project workflows, and provides real-time visibility across all operations.
                            </p>
                        </div>
                    </div>

                    <div className="about-card about-card-mission">
                        <div className="about-card-header">
                            <div className="about-card-icon">
                                <FaStar />
                            </div>
                            <h2>Our Mission</h2>
                        </div>
                        <div className="about-card-body">
                            <p>
                                To revolutionize engineering operations management by providing an integrated, intelligent platform 
                                that empowers Bamika Engineering to achieve operational excellence across inventory, projects, 
                                finance, and support.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scope Section */}
                <div className="about-card">
                    <div className="about-card-header">
                        <div className="about-card-icon">
                            <FaTools />
                        </div>
                        <h2>Scope of the System</h2>
                    </div>
                    <div className="about-card-body">
                        <p>BamikaHub covers comprehensive operational areas across the organization:</p>
                        <div className="about-scope-grid">
                            <div className="scope-item">
                                <div className="scope-icon">📦</div>
                                <div className="scope-content">
                                    <h4>Inventory Management</h4>
                                    <p>Engineering tools, equipment, raw materials, consumables, and safety gear</p>
                                </div>
                            </div>
                            <div className="scope-item">
                                <div className="scope-icon">🏗️</div>
                                <div className="scope-content">
                                    <h4>Operations & Projects</h4>
                                    <p>Project lifecycle management, site tracking, field reports, and performance monitoring</p>
                                </div>
                            </div>
                            <div className="scope-item">
                                <div className="scope-icon">💰</div>
                                <div className="scope-content">
                                    <h4>Finance Management</h4>
                                    <p>Requisitions, budget tracking, approvals, and expenditure analysis</p>
                                </div>
                            </div>
                            <div className="scope-item">
                                <div className="scope-icon">🎫</div>
                                <div className="scope-content">
                                    <h4>Support Ticketing</h4>
                                    <p>Internal and guest portal ticket management with SLA compliance tracking</p>
                                </div>
                            </div>
                            <div className="scope-item">
                                <div className="scope-icon">👥</div>
                                <div className="scope-content">
                                    <h4>Team Assignments</h4>
                                    <p>Task delegation, activity tracking, and deadline management</p>
                                </div>
                            </div>
                            <div className="scope-item">
                                <div className="scope-icon">👤</div>
                                <div className="scope-content">
                                    <h4>User Management</h4>
                                    <p>Role-based access control, permissions, and user profiles</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Features */}
                <div className="about-card about-card-features">
                    <div className="about-card-header">
                        <div className="about-card-icon">
                            <FaLightbulb />
                        </div>
                        <h2>Key Features & Functionalities</h2>
                    </div>
                    <div className="about-card-body">
                        <div className="features-grid">
                            <div className="feature-item">
                                <div className="feature-icon">📊</div>
                                <h4>Real-Time Inventory Tracking</h4>
                                <p>Monitor stock levels, track transactions, manage categories and suppliers with live updates</p>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">📋</div>
                                <h4>Project Management</h4>
                                <p>Complete project lifecycle management with sites, field reports, and performance tracking</p>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">💰</div>
                                <h4>Financial Controls</h4>
                                <p>Requisition workflows with approval chains, budget tracking, and expenditure analytics</p>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🎫</div>
                                <h4>Support Ticketing System</h4>
                                <p>Internal ticketing with guest portal, magic link authentication, and SLA compliance tracking</p>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">💬</div>
                                <h4>Real-Time Communication</h4>
                                <p>WebSocket-based instant messaging, notifications, and email system with templates</p>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">👥</div>
                                <h4>Team Assignments</h4>
                                <p>Task delegation with activity tracking, evidence uploads, and deadline monitoring</p>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">📈</div>
                                <h4>Advanced Reporting</h4>
                                <p>Inventory valuation, project performance, budget vs actual, completion trends, and custom reports</p>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🔒</div>
                                <h4>Complete Audit Trail</h4>
                                <p>System-wide activity logging with user tracking and compliance documentation</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users & Roles */}
                <div className="about-card">
                    <div className="about-card-header">
                        <div className="about-card-icon">
                            <FaUsers />
                        </div>
                        <h2>Users & Roles</h2>
                    </div>
                    <div className="about-card-body">
                        <div className="roles-grid">
                            <div className="role-card role-admin">
                                <div className="role-header">
                                    <FaCrown className="role-icon" />
                                    <h4>Admin</h4>
                                </div>
                                <p>Full system access including user management, role configuration, system-wide reporting, and all operational modules</p>
                            </div>
                            <div className="role-card role-finance">
                                <div className="role-header">
                                    <div className="role-icon">💰</div>
                                    <h4>Finance Manager</h4>
                                </div>
                                <p>Financial tracking, requisition approval workflows, budget monitoring, and expenditure analysis</p>
                            </div>
                            <div className="role-card role-ops">
                                <div className="role-header">
                                    <div className="role-icon">🏗️</div>
                                    <h4>Operations Manager</h4>
                                </div>
                                <p>Complete inventory control, supplier management, project oversight, field report access, and assignment management</p>
                            </div>
                            <div className="role-card role-field">
                                <div className="role-header">
                                    <div className="role-icon">👷</div>
                                    <h4>Field Engineer</h4>
                                </div>
                                <p>Field report submission, inventory viewing, requisition creation, and assignment tracking for on-site operations</p>
                            </div>
                            <div className="role-card role-support">
                                <div className="role-header">
                                    <div className="role-icon">🛠️</div>
                                    <h4>Technical Support</h4>
                                </div>
                                <p>Support ticket management, guest portal oversight, user account viewing, and IT assignment coordination</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Business Value */}
                <div className="about-card about-card-success">
                    <div className="about-card-header">
                        <div className="about-card-icon">
                            <FaChartLine />
                        </div>
                        <h2>Business Value & Benefits</h2>
                    </div>
                    <div className="about-card-body">
                        <div className="benefits-list">
                            <div className="benefit-item">
                                <span className="benefit-icon">💸</span>
                                <div>
                                    <h4>Cost Reduction</h4>
                                    <p>Minimize wastage, overstocking, emergency purchases, and budget overruns through automated tracking</p>
                                </div>
                            </div>
                            <div className="benefit-item">
                                <span className="benefit-icon">⚡</span>
                                <div>
                                    <h4>Operational Efficiency</h4>
                                    <p>Automated workflows eliminate manual paperwork, reduce processing time, and improve resource utilization</p>
                                </div>
                            </div>
                            <div className="benefit-item">
                                <span className="benefit-icon">📊</span>
                                <div>
                                    <h4>Better Decision Making</h4>
                                    <p>Real-time dashboards and comprehensive reports provide data-driven insights for strategic planning</p>
                                </div>
                            </div>
                            <div className="benefit-item">
                                <span className="benefit-icon">✅</span>
                                <div>
                                    <h4>Improved Compliance</h4>
                                    <p>Complete audit trails, automated approval workflows, and documentation meet regulatory requirements</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin-Only Sections */}
                {hasDetailedAccess && (
                    <>
                        {/* Data Security */}
                        <div className="about-card about-card-restricted">
                            <div className="about-card-header">
                                <div className="about-card-icon">
                                    <FaShieldAlt />
                                </div>
                                <h2>Data Accuracy & Security</h2>
                                <span className="restricted-badge">
                                    <FaShieldAlt /> Admin Only
                                </span>
                            </div>
                            <div className="about-card-body">
                                <div className="security-grid">
                                    <div className="security-item">
                                        <h4>Data Integrity</h4>
                                        <p>Backend validation rules, DTOs, and JPA entity constraints ensure accurate data entry</p>
                                    </div>
                                    <div className="security-item">
                                        <h4>Access Control</h4>
                                        <p>JWT-based authentication with fine-grained permission system using Spring Security</p>
                                    </div>
                                    <div className="security-item">
                                        <h4>Audit Logging</h4>
                                        <p>Comprehensive system activity tracking with user identification and timestamp records</p>
                                    </div>
                                    <div className="security-item">
                                        <h4>Database Security</h4>
                                        <p>MySQL with credential protection and connection security</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Information */}
                        <div className="about-card">
                            <div className="about-card-header">
                                <div className="about-card-icon">
                                    <FaCode />
                                </div>
                                <h2>System Information</h2>
                            </div>
                            <div className="about-card-body">
                                <div className="system-info-grid">
                                    <div className="info-item">
                                        <span className="info-label">System Version:</span>
                                        <span className="info-value">{systemVersion}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Release Date:</span>
                                        <span className="info-value">{releaseDate}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Environment:</span>
                                        <span className="info-value">{deploymentEnv}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Technology Stack:</span>
                                        <span className="info-value">React 19 + Vite, Spring Boot 3.5.6, MySQL 8</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Contact & Support */}
                <div className="about-card">
                    <div className="about-card-header">
                        <div className="about-card-icon">
                            <FaPhone />
                        </div>
                        <h2>Contact & Support</h2>
                    </div>
                    <div className="about-card-body">
                        <div className="contact-grid">
                            <div className="contact-item">
                                <FaEnvelope className="contact-icon" />
                                <div>
                                    <h4>Email Support</h4>
                                    <p>support@ggt.com</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <FaPhone className="contact-icon" />
                                <div>
                                    <h4>Support Portal</h4>
                                    <p>Create tickets via internal or guest portal</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <FaQuestionCircle className="contact-icon" />
                                <div>
                                    <h4>Help Center</h4>
                                    <p>Available in-app navigation</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Company Overview */}
                <div className="about-card about-card-company">
                    <div className="about-card-header">
                        <div className="about-card-icon">
                            <FaBuilding />
                        </div>
                        <h2>System Developer</h2>
                    </div>
                    <div className="about-card-body">
                        <div className="company-header">
                            <h3 className="company-name">GGT (Grand Grande Technologies)</h3>
                            <span className="company-tag">Technology Partner</span>
                        </div>
                        
                        <div className="company-section">
                            <h4>Area of Expertise</h4>
                            <p>
                                Grand Grande Technologies (GGT) is a technology solutions company specializing in 
                                the development of custom software systems, websites, mobile applications, and embedded 
                                solutions. The company delivers end-to-end digital and hardware-integrated solutions, 
                                including system automation, device integration, and smart technology solutions tailored 
                                to meet diverse organizational and industrial needs.
                            </p>
                        </div>

                        <div className="company-section">
                            <h4>Role in System Development</h4>
                            <p>
                                GGT was responsible for the complete lifecycle development of the Inventory Management System, 
                                including requirements analysis, system design, implementation, testing, and deployment. The 
                                company ensured seamless alignment with engineering workflows and supported integration with 
                                related digital and operational systems.
                            </p>
                        </div>

                        <div className="company-section">
                            <h4>Ongoing Support and Enhancement Responsibilities</h4>
                            <p>
                                GGT provides continuous system support, maintenance, and enhancement services, including 
                                issue resolution, performance optimization, feature expansion, and system upgrades. The 
                                company also supports future scalability and integration with additional software platforms 
                                and embedded hardware solutions as business needs evolve.
                            </p>
                        </div>

                        <div className="company-contact">
                            <div className="contact-links">
                                <a href="https://nuwarindaalbertgrandeportfolio.vercel.app/" target="_blank" rel="noopener noreferrer" className="website-link">
                                    🌐 Visit Website
                                </a>
                                <a href="mailto:nuwarindaalbertgrande@gmail.com" className="email-link">
                                    ✉️ Email Contact
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="about-footer">
                <p className="footer-text">
                    © {new Date().getFullYear()} Grand Grande Technologies. All rights reserved.
                </p>
                <p className="footer-subtext">
                    BamikaHub - Engineering Operations Management System
                </p>
            </div>
        </div>
    );
};

export default AboutPage;