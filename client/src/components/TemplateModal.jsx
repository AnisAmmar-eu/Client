import React, { useState } from 'react';
import './MeetingDashboard.css';

const TemplateModal = ({ onSave, onCancel }) => {
    const [templateData, setTemplateData] = useState({
        name: '',
        description: '',
        agenda: '',
        objectives: '',
        nonObjectives: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTemplateData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(templateData);
    };

    return (
        <div className="md-modal-overlay">
            <div className="md-modal-content md-glassy-card">
                <h4>Créer un nouveau modèle</h4>
                <form onSubmit={handleSubmit}>
                    <div className="md-form-group">
                        <label htmlFor="templateName">Nom du modèle</label>
                        <input
                            type="text"
                            id="templateName"
                            name="name"
                            value={templateData.name}
                            onChange={handleChange}
                            placeholder="Ex: Modèle de réunion hebdomadaire"
                            required
                        />
                    </div>
                    <div className="md-form-group">
                        <label htmlFor="templateDescription">Description</label>
                        <textarea
                            id="templateDescription"
                            name="description"
                            value={templateData.description}
                            onChange={handleChange}
                            placeholder="Description du modèle"
                        />
                    </div>
                    <div className="md-form-group">
                        <label htmlFor="templateAgenda">Agenda</label>
                        <textarea
                            id="templateAgenda"
                            name="agenda"
                            value={templateData.agenda}
                            onChange={handleChange}
                            placeholder="Agenda du modèle"
                        />
                    </div>
                    <div className="md-form-group">
                        <label htmlFor="templateObjectives">Objectifs</label>
                        <textarea
                            id="templateObjectives"
                            name="objectives"
                            value={templateData.objectives}
                            onChange={handleChange}
                            placeholder="Objectifs du modèle"
                        />
                    </div>
                    <div className="md-form-group">
                        <label htmlFor="templateNonObjectives">Non-Objectifs</label>
                        <textarea
                            id="templateNonObjectives"
                            name="nonObjectives"
                            value={templateData.nonObjectives}
                            onChange={handleChange}
                            placeholder="Non-objectifs du modèle"
                        />
                    </div>
                    <div className="md-form-actions">
                        <button type="submit" className="md-glass-button">Créer le modèle</button>
                        <button type="button" className="md-glass-button md-cancel-button" onClick={onCancel}>Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TemplateModal;