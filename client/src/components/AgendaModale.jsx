import React, { useState, useRef, useEffect } from 'react';
import './DescriptionModel.css';
import { Plus, X } from 'lucide-react';

const AgendaModal = ({ agenda = [], onSave, onCancel }) => {
    const modalRef = useRef(null);

    const [rows, setRows] = useState(agenda.length ? agenda : [
        { title: '', start: '', duration: '', finish: '' },
    ]);

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

    const handleChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const handleAddRow = () => {
        setRows([...rows, { title: '', start: '', duration: '', finish: '' }]);
    };

    const handleSave = () => {
        onSave(rows);
    };

    return (
        <div className="md-modal-overlay" tabIndex="0">
            <div className="md-modal-content glass-effect" ref={modalRef}>
                <div className="md-modal-header">
                    <h3>Modifier l'Agenda</h3>
      <Plus 
        className="md-icon-button" 
        onClick={handleAddRow} 
        style={{ marginTop: '10px' }}
    />
    <X className="md-icon-button" onClick={onCancel} />
                </div>
<div className="md-agenda-table scrollable-table">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Titre</th>
                                <th>Début</th>
                                <th>Durée</th>
                                <th>Fin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <input
                                            type="text"
                                            value={row.title}
                                            onChange={(e) => handleChange(index, 'title', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="time"
                                            value={row.start}
                                            onChange={(e) => handleChange(index, 'start', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={row.duration}
                                            onChange={(e) => handleChange(index, 'duration', e.target.value)}
                                            placeholder="00:15"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="time"
                                            value={row.finish}
                                            onChange={(e) => handleChange(index, 'finish', e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
                <div className="md-modal-actions">
                    <button onClick={handleSave} className="md-glass-button md-button-primary">Enregistrer</button>
                    <button onClick={onCancel} className="md-glass-button md-button-secondary">Annuler</button>
                </div>
            </div>
        </div>
    );
};

export default AgendaModal;
