import React, { useState } from 'react';

const ObjectivesCard = ({ initialObjectives = [], onSaveObjectives }) => {
    const [objectiveItems, setObjectiveItems] = useState(initialObjectives);
    const [newObjectiveText, setNewObjectiveText] = useState('');
    const [newObjectiveType, setNewObjectiveType] = useState('objective'); // 'objective' or 'non-objective'

    const handleAddItem = () => {
        if (newObjectiveText.trim() !== '') {
            const updatedObjectives = [
                ...objectiveItems,
                { id: Date.now(), text: newObjectiveText.trim(), type: newObjectiveType }
            ];
            setObjectiveItems(updatedObjectives);
            setNewObjectiveText('');
            onSaveObjectives(updatedObjectives);
        }
    };

    const handleDeleteItem = (id) => {
        const updatedObjectives = objectiveItems.filter(item => item.id !== id);
        setObjectiveItems(updatedObjectives);
        onSaveObjectives(updatedObjectives);
    };

    const filteredObjectives = objectiveItems.filter(item => item.type === 'objective');
    const filteredNonObjectives = objectiveItems.filter(item => item.type === 'non-objective');

    return (
        <div className="md-glassy-card md-objectives-card">
            <h4>Objectifs et Non-Objectifs</h4>
            <div className="md-objective-input-group">
                <input
                    type="text"
                    value={newObjectiveText}
                    onChange={(e) => setNewObjectiveText(e.target.value)}
                    placeholder="Ajouter un objectif ou non-objectif"
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleAddItem();
                        }
                    }}
                />
                <select
                    value={newObjectiveType}
                    onChange={(e) => setNewObjectiveType(e.target.value)}
                >
                    <option value="objective">Objectif</option>
                    <option value="non-objective">Non-Objectif</option>
                </select>
                <button type="button" onClick={handleAddItem} className="md-add-item-button">
                    Ajouter
                </button>
            </div>

            <h5>Objectifs</h5>
            {filteredObjectives.length > 0 ? (
                <table className="md-items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredObjectives.map((item) => (
                            <tr key={item.id}>
                                <td>{item.text}</td>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="md-delete-item-button"
                                        title="Supprimer"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="md-no-items-message">Aucun objectif ajouté.</p>
            )}

            <h5>Non-Objectifs</h5>
            {filteredNonObjectives.length > 0 ? (
                <table className="md-items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredNonObjectives.map((item) => (
                            <tr key={item.id}>
                                <td>{item.text}</td>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="md-delete-item-button"
                                        title="Supprimer"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="md-no-items-message">Aucun non-objectif ajouté.</p>
            )}
        </div>
    );
};

export default ObjectivesCard;