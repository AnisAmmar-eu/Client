import React, { useState, useEffect, useRef } from 'react';
import './DescriptionModel.css'; 

const ObjectivesModal = ({ currentObjectives, onSave, onCancel }) => {
    const [inputValue, setInputValue] = useState(currentObjectives || '');
    const modalRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onCancel();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onCancel]);

    const handleSave = () => {
        onSave(inputValue);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className="md-modal-overlay" onKeyDown={handleKeyDown} tabIndex="0">
            <div className="md-modal-content glass-effect" ref={modalRef}>
                <div className="md-modal-header">
                    <h3>Modifier les Objectifs et Non-Objectifs</h3>
                    <button className="md-close-button" onClick={onCancel}>&times;</button>
                </div>
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    rows="10"
                    placeholder="Entrez les objectifs et non-objectifs de la réunion ici (un par ligne, par exemple: Objectif: ..., Non-objectif: ...)..."
                    className="md-glass-textarea"
                ></textarea>
                <div className="md-modal-actions">
                    <button onClick={handleSave} className="md-glass-button md-button-primary">Enregistrer</button>
                    <button onClick={onCancel} className="md-glass-button md-button-secondary">Annuler</button>
                </div>
            </div>
        </div>
    );
};

export default ObjectivesModal;