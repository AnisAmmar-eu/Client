import React from 'react';
import './IntroPanel.css'; // Styles spécifiques à l'intro
import '../App.css'; // Styles glassy globaux (pour les variables CSS si elles sont utilisées là)

const IntroPanel = ({ title, subtitle, imageUrl, buttonText, onButtonClick }) => {
    return (
        <div className="intro-panel">
            <div className="intro-content">
                {/* Réintégration du titre et du sous-titre */}
                {title && <h1 className="intro-title">{title}</h1>}
                {subtitle && <p className="intro-subtitle">{subtitle}</p>}

                {imageUrl && (
                    <div className="intro-image-container">
                        {/* L'image aura la classe pour la rotation 3D */}
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

export default IntroPanel;