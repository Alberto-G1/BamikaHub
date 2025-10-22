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
        <>
            <style>{`
                :root {
                    --color-bg: #ffffff;
                    --color-text: #1a202c;
                    --color-muted: #718096;
                    --color-primary: #f6b41a;
                    --color-secondary: #f39c12;
                }

                [data-theme="dark"] {
                    --color-bg: #1a202c;
                    --color-text: #ffffff;
                    --color-muted: #a0aec0;
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .notfound-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--color-bg);
                    transition: background 0.3s ease, color 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    padding: 1rem;
                }

                /* Animated mesh gradient overlay */
                .notfound-page::before {
                    content: '';
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: 
                        radial-gradient(circle at 20% 50%, rgba(246, 180, 26, 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(243, 156, 18, 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 40% 20%, rgba(246, 180, 26, 0.06) 0%, transparent 50%);
                    animation: meshMove 25s ease-in-out infinite;
                    pointer-events: none;
                }

                @keyframes meshMove {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                    33% { transform: translate(-3%, 3%) rotate(120deg); opacity: 0.8; }
                    66% { transform: translate(3%, -3%) rotate(240deg); opacity: 0.9; }
                }

                /* Enhanced floating circles */
                .bg-decoration {
                    position: absolute;
                    border-radius: 50%;
                    opacity: 0.12;
                    animation: float 20s infinite ease-in-out;
                    pointer-events: none;
                    backdrop-filter: blur(60px);
                    transition: transform 0.3s ease-out;
                }

                .circle1 {
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, var(--color-primary), transparent);
                    top: -150px;
                    left: -150px;
                    animation-delay: 0s;
                }

                .circle2 {
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, var(--color-secondary), transparent);
                    bottom: -100px;
                    right: -100px;
                    animation-delay: 5s;
                }

                .circle3 {
                    width: 250px;
                    height: 250px;
                    background: radial-gradient(circle, #10b981, transparent);
                    top: 40%;
                    right: 8%;
                    animation-delay: 10s;
                }

                @keyframes float {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(40px, -40px) scale(1.2);
                    }
                    66% {
                        transform: translate(-30px, 30px) scale(0.8);
                    }
                }

                /* Main Container - Full page layout */
                .notfound-container {
                    text-align: center;
                    padding: 60px 50px;
                    max-width: 650px;
                    z-index: 10;
                    position: relative;
                    animation: slideIn 0.8s ease-out;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Enhanced Icon Container */
                .notfound-icon-container {
                    position: relative;
                    width: 220px;
                    height: 220px;
                    margin: 0 auto 40px;
                    animation: iconFloat 0.6s ease-out;
                }

                @keyframes iconFloat {
                    from {
                        opacity: 0;
                        transform: translateY(-30px) scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .excavator-icon {
                    width: 100%;
                    height: 100%;
                    animation: excavate 4s infinite ease-in-out;
                    filter: drop-shadow(0 15px 35px rgba(246, 180, 26, 0.4));
                    transition: transform 0.3s ease;
                }

                .excavator-icon:hover {
                    transform: scale(1.08) rotate(2deg);
                }

                @keyframes excavate {
                    0%, 100% {
                        transform: rotate(-8deg) translateY(0);
                    }
                    25% {
                        transform: rotate(-2deg) translateY(-12px);
                    }
                    50% {
                        transform: rotate(8deg) translateY(-18px);
                    }
                    75% {
                        transform: rotate(-2deg) translateY(-12px);
                    }
                }

                /* Glowing Error Code with theme colors */
                .notfound-error-code {
                    font-size: 140px;
                    font-weight: 900;
                    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 50%, var(--color-primary) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    background-size: 200% auto;
                    margin-bottom: 25px;
                    animation: shine 3s linear infinite, errorPulse 2.5s infinite ease-in-out;
                    letter-spacing: -8px;
                    line-height: 1;
                    filter: drop-shadow(0 0 30px rgba(246, 180, 26, 0.3));
                    animation-delay: 0.2s;
                    animation-fill-mode: backwards;
                    opacity: 0;
                }

                @keyframes shine {
                    to {
                        background-position: 200% center;
                    }
                }

                @keyframes errorPulse {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.05);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                /* Enhanced Text */
                .notfound-title {
                    font-size: 42px;
                    margin-bottom: 18px;
                    color: var(--color-text);
                    font-weight: 700;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    animation: textSlide 0.8s ease-out 0.3s backwards;
                }

                @keyframes textSlide {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .notfound-message {
                    font-size: 19px;
                    color: var(--color-muted);
                    margin-bottom: 45px;
                    line-height: 1.7;
                    animation: textSlide 0.8s ease-out 0.4s backwards;
                }

                /* Enhanced dots */
                .dots {
                    display: inline-block;
                }

                .dots span {
                    animation: blink 1.4s infinite;
                    animation-fill-mode: both;
                    font-weight: bold;
                    color: var(--color-primary);
                }

                .dots span:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .dots span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes blink {
                    0%, 80%, 100% { opacity: 0; }
                    40% { opacity: 1; }
                }

                /* Button Group */
                .notfound-button-group {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    flex-wrap: wrap;
                    animation: textSlide 0.8s ease-out 0.5s backwards;
                }

                /* Enhanced Buttons */
                .notfound-btn {
                    padding: 16px 36px;
                    font-size: 17px;
                    font-weight: 600;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    text-decoration: none;
                    position: relative;
                    overflow: hidden;
                }

                .notfound-btn::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.4);
                    transform: translate(-50%, -50%);
                    transition: width 0.6s, height 0.6s;
                }

                .notfound-btn:hover::before {
                    width: 350px;
                    height: 350px;
                }

                .notfound-btn:active {
                    transform: scale(0.96);
                }

                .notfound-btn span {
                    position: relative;
                    z-index: 1;
                }

                /* Primary Button with theme colors */
                .notfound-btn-primary {
                    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
                    color: white;
                    box-shadow: 
                        0 8px 25px rgba(246, 180, 26, 0.35),
                        0 0 0 0 rgba(246, 180, 26, 0.4);
                    animation: glow 2.5s ease-in-out infinite alternate;
                }

                @keyframes glow {
                    from {
                        box-shadow: 
                            0 8px 25px rgba(246, 180, 26, 0.35),
                            0 0 0 0 rgba(246, 180, 26, 0.4);
                    }
                    to {
                        box-shadow: 
                            0 8px 30px rgba(246, 180, 26, 0.5),
                            0 0 25px 5px rgba(246, 180, 26, 0.25);
                    }
                }

                .notfound-btn-primary:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 
                        0 12px 35px rgba(246, 180, 26, 0.5),
                        0 0 30px 8px rgba(246, 180, 26, 0.3);
                }

                /* Secondary Button */
                .notfound-btn-secondary {
                    background: var(--color-bg);
                    color: var(--color-text);
                    border: 2px solid rgba(246, 180, 26, 0.3);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
                    backdrop-filter: blur(10px);
                }

                .notfound-btn-secondary:hover {
                    transform: translateY(-3px) scale(1.02);
                    background: rgba(246, 180, 26, 0.1);
                    border-color: var(--color-primary);
                    box-shadow: 0 12px 35px rgba(246, 180, 26, 0.2);
                }

                [data-theme="dark"] .notfound-btn-secondary {
                    border-color: rgba(246, 180, 26, 0.4);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                }

                [data-theme="dark"] .notfound-btn-secondary:hover {
                    background: rgba(246, 180, 26, 0.15);
                    border-color: var(--color-primary);
                    box-shadow: 0 12px 35px rgba(246, 180, 26, 0.3);
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .notfound-container {
                        padding: 50px 35px;
                    }

                    .notfound-error-code {
                        font-size: 100px;
                        letter-spacing: -5px;
                    }

                    .notfound-title {
                        font-size: 32px;
                    }

                    .notfound-message {
                        font-size: 17px;
                    }

                    .notfound-button-group {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .notfound-btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .notfound-icon-container {
                        width: 180px;
                        height: 180px;
                    }
                }

                @media (max-width: 480px) {
                    .notfound-container {
                        padding: 40px 25px;
                        border-radius: 20px;
                    }

                    .notfound-error-code {
                        font-size: 70px;
                        letter-spacing: -3px;
                    }

                    .notfound-icon-container {
                        width: 140px;
                        height: 140px;
                    }

                    .notfound-title {
                        font-size: 26px;
                    }

                    .notfound-message {
                        font-size: 15px;
                    }

                    .notfound-btn {
                        padding: 14px 28px;
                        font-size: 15px;
                    }

                    .circle1 {
                        width: 250px;
                        height: 250px;
                    }

                    .circle2 {
                        width: 200px;
                        height: 200px;
                    }

                    .circle3 {
                        width: 150px;
                        height: 150px;
                    }
                }

                /* Focus styles */
                .notfound-btn:focus-visible {
                    outline: 3px solid var(--color-primary);
                    outline-offset: 4px;
                }
            `}</style>

            <div className="notfound-page" ref={containerRef}>
                <div className="bg-decoration circle1"></div>
                <div className="bg-decoration circle2"></div>
                <div className="bg-decoration circle3"></div>

                <div className="notfound-container">
                    <div className="notfound-icon-container">
                        <img 
                            src="/src/assets/images/button.png"
                            alt="404 Excavator" 
                            className="excavator-icon"
                            onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cg fill='%23f6b41a'%3E%3Crect x='40' y='100' width='60' height='40' rx='5'/%3E%3Crect x='80' y='80' width='40' height='20' rx='3'/%3E%3Cpath d='M120 85 L160 70 L165 75 L125 90 Z'/%3E%3Ccircle cx='50' cy='150' r='15'/%3E%3Ccircle cx='90' cy='150' r='15'/%3E%3Cpath d='M20 140 L40 140 L40 155 L20 155 Z'/%3E%3C/g%3E%3C/svg%3E";
                            }}
                        />
                    </div>

                    <div className="notfound-error-code">404</div>

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
        </>
    );
};

export default NotFoundPage;