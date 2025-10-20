import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import excavatorImg from '../assets/images/button.png';
import './NotFoundPage.css';

const NotFoundPage = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);

    useEffect(() => {
        // Parallax effect for background circles
        const handleMouseMove = (e) => {
            const circles = document.querySelectorAll('.bg-decoration');
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            circles.forEach((circle, index) => {
                const speed = (index + 1) * 20;
                const xMove = (x - 0.5) * speed;
                const yMove = (y - 0.5) * speed;
                circle.style.transform = `translate(${xMove}px, ${yMove}px)`;
            });
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleGoToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className="notfound-page" ref={containerRef}>
            {/* Background Decorations */}
            <div className="bg-decoration circle1"></div>
            <div className="bg-decoration circle2"></div>
            <div className="bg-decoration circle3"></div>

            {/* Main Content */}
            <div className="notfound-container">
                {/* Animated Icon */}
                <div className="notfound-icon-container">
                    <img 
                        src={excavatorImg} 
                        alt="404 Excavator" 
                        className="excavator-icon"
                    />
                </div>

                {/* Error Code */}
                <div className="notfound-error-code">404</div>

                {/* Text Content */}
                <h1 className="notfound-title">Page Under Construction</h1>
                <p className="notfound-message">
                    Oops! The page you're looking for seems to be under excavation. 
                    Our team is working hard to build something amazing
                    <span className="dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                    </span>
                </p>

                {/* Buttons */}
                <div className="notfound-button-group">
                    <button className="notfound-btn notfound-btn-primary" onClick={handleGoBack}>
                        <span>← Go Back</span>
                    </button>
                    <button className="notfound-btn notfound-btn-secondary" onClick={handleGoToDashboard}>
                        <span>🏠 Dashboard</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;