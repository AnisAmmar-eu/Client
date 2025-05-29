import React, { useState } from 'react';

const AgendaCard = ({ initialAgenda = [], onSaveAgenda }) => {
    const [agendaItems, setAgendaItems] = useState(initialAgenda);
    const [newItem, setNewItem] = useState('');

    const handleAddItem = () => {
        if (newItem.trim() !== '') {
            const updatedAgenda = [...agendaItems, { id: Date.now(), text: newItem.trim() }];
            setAgendaItems(updatedAgenda);
            setNewItem('');
            onSaveAgenda(updatedAgenda); // Propagate changes up
        }
    };

    const handleDeleteItem = (id) => {
        const updatedAgenda = agendaItems.filter(item => item.id !== id);
        setAgendaItems(updatedAgenda);
        onSaveAgenda(updatedAgenda); // Propagate changes up
    };

    return (
        <div className="md-glassy-card md-agenda-card">
            <h4>Agenda</h4>
            <div className="md-agenda-input-group">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Ajouter un point à l'ordre du jour"
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleAddItem();
                        }
                    }}
                />
                <button type="button" onClick={handleAddItem} className="md-add-item-button">
                    Ajouter
                </button>
            </div>
            {agendaItems.length > 0 ? (
                <table className="md-items-table">
                    <thead>
                        <tr>
                            <th>Point</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agendaItems.map((item) => (
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
                <p className="md-no-items-message">Aucun point à l'ordre du jour ajouté.</p>
            )}
        </div>
    );
};

export default AgendaCard;