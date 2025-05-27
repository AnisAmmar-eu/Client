import React from 'react';
import './IntroPanel.css'; 
import '../App.css';

const DashboardHome = ({ title, subtitle, imageUrl, buttonText, onButtonClick }) => {
    return (
        <div className="intro-panel">
            <div className="intro-content">
                {title && <h1 className="intro-title">{title}</h1>}
                {subtitle && <p className="intro-subtitle">{subtitle}</p>}

                {imageUrl && (
                    <div className="intro-image-container">
                        <img src={imageUrl} alt={title} className="intro-image" />
                    </div>
                )}
                {buttonText && onButtonClick && (
                    <button onClick={onButtonClick} className="intro-button">
                        {buttonText}
                    </button>
                )}
            </div>
        </div>
    );
};

export default DashboardHome;