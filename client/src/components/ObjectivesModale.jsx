import React, { useState, useRef, useEffect } from 'react';
import './DescriptionModel.css';
import { Plus, X } from 'lucide-react';

const ObjectivesNonObjectivesModal = ({ objectives = [], onSave, onCancel }) => {
  const modalRef = useRef(null);
  // Ensure objectives is an array; fallback to a single empty row if not
  const initialRows = Array.isArray(objectives) && objectives.length ? objectives : [{ objective: '', nonObjective: '' }];
  const [rows, setRows] = useState(initialRows);

  // Log objectives to debug
  useEffect(() => {
    console.log('Objectives prop received:', objectives);
  }, [objectives]);

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
    setRows([...rows, { objective: '', nonObjective: '' }]);
  };

  const handleSave = () => {
    onSave(rows);
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
          <div>
            <Plus className="md-icon-button" onClick={handleAddRow} style={{ marginRight: '10px' }} />
            <X className="md-icon-button" onClick={onCancel} />
          </div>
        </div>
        <div className="md-agenda-table scrollable-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Objectif</th>
                <th>Non-Objectif</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      type="text"
                      value={row.objective}
                      onChange={(e) => handleChange(index, 'objective', e.target.value)}
                      placeholder="Entrez l'objectif"
                      className="md-glass-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.nonObjective}
                      onChange={(e) => handleChange(index, 'nonObjective', e.target.value)}
                      placeholder="Entrez le non-objectif"
                      className="md-glass-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md-modal-actions">
          <button onClick={handleSave} className="md-glass-button md-button-primary">
            Enregistrer
          </button>
          <button onClick={onCancel} className="md-glass-button md-button-secondary">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObjectivesNonObjectivesModal;