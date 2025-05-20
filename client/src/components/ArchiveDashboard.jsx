import React, { useState, useEffect } from 'react';
import './ArchiveDashboard.css';

const ArchiveDashboard = () => {
  const [archivedMeetings, setArchivedMeetings] = useState([]);
  const [selectedArchivedMeeting, setSelectedArchivedMeeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArchivedMeetings();
  }, []);

  const fetchArchivedMeetings = async () => {
    setLoading(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const dummyArchivedMeetings = [
        {
          id: 'archived_meet_1',
          title: '2nd Controlling Workshop',
          date: '2018-11-18T09:00:00Z',
          archivedDate: '2019-03-10T10:30:00Z',
          initialDate: '2018-02-03T16:26:00Z',
          finishDate: '2018-02-04T02:26:00Z',
          durationHours: 10,
          invitedBy: 'Christian Lackner',
          type: 'Project Planning',
          location: 'HQ-6-04',
          documents: [
            { name: 'Meeting Prof_16.pdf', url: '#' },
            { name: 'Meeting Einl_8.pdf', url: '#' }
          ],
          entries: [
            { id: 1, text: 'Clarify potential risks and penetration testing need for HB Web 2.0', responsible: 'Christian Lackner', startDate: '2018-02-03', dueDate: null, notes: 'No attachments assigned' },
            { id: 2, text: 'Add workpackage for monitoring to plan in PHB', responsible: 'Christian Lackner', startDate: '2018-03-02', dueDate: '2018-03-04', notes: 'No attachments assigned' },
            { id: 3, text: 'Update Web 2.0 project management plan', responsible: 'Christian Lackner', startDate: '2018-03-02', dueDate: '2018-03-04', notes: 'No attachments assigned' },
            { id: 4, text: 'Initiate Start Workshop 03.02.2018', responsible: 'Christian Lackner', startDate: '2018-03-02', dueDate: '2018-03-04', notes: 'No attachments assigned' },
            { id: 5, text: 'Initiate review for project schedule', responsible: 'Christian Lackner', startDate: '2018-02-06', dueDate: '2018-02-08', notes: 'No attachments assigned' },
            { id: 6, text: 'Release OQZ check list', responsible: 'Christian Lackner', startDate: '2018-02-03', dueDate: '2018-02-14', notes: 'No attachments assigned' }
          ],
          linkedMeetings: [
            { id: 'initial_start', title: 'Initial Start Workshop', agendaItem: 'No Agenda-item as...' },
            { id: 'team_meeting', title: 'Team Meeting', agendaItem: 'No Agenda-items a...' }
          ],
          attachments: []
        },
        {
          id: 'archived_meet_2',
          title: 'Initial Start Workshop',
          date: '2018-02-03T16:26:00Z',
          archivedDate: '2019-02-05T06:58:00Z',
          initialDate: '2018-02-03T16:26:00Z',
          finishDate: '2018-02-04T02:26:00Z',
          durationHours: 10,
          invitedBy: 'Christian Lackner',
          type: 'Project Kick-off',
          location: 'Main Conference Room',
          documents: [],
          entries: [
            { id: 1, text: 'Define project scope', responsible: 'Alice', startDate: '2018-02-03', dueDate: null, notes: 'Initial scope definition' },
            { id: 2, text: 'Assign initial tasks', responsible: 'Bob', startDate: '2018-02-03', dueDate: null, notes: 'Tasks for first week' }
          ],
          linkedMeetings: [],
          attachments: []
        }
      ];

      setArchivedMeetings(dummyArchivedMeetings);
      if (dummyArchivedMeetings.length > 0) {
        setSelectedArchivedMeeting(dummyArchivedMeetings[0]);
      }
    } catch (err) {
      setError('Erreur réseau ou du serveur lors de la récupération des archives.');
      console.error('Fetch archived meetings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).replace(',', '');
  };

  const formatSimpleDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  };

  return (
    <div className="archive-dashboard-container">
      <div className="top-bar">
        <div className="menu-tabs">
          <button className="tab-button">Initiate</button>
          <button className="tab-button">Meetings</button>
          <button className="tab-button">Tasks</button>
          <button className="tab-button active">Archive</button>
          <button className="tab-button add-tab">+</button>
        </div>
        <div className="user-settings">
          <button className="icon-button"><i className="fas fa-search"></i></button>
          <button className="icon-button"><i className="fas fa-cog"></i></button>
          <button className="icon-button"><i className="fas fa-question-circle"></i></button>
        </div>
      </div>

      <div className="main-content">
        <div className="left-panel">
          {loading && <p className="loading-message">Chargement...</p>}
          {error && <div className="error-message">{error}</div>}

          <h3>Réunions archivées</h3>
          <ul className="archived-list">
            {archivedMeetings.length === 0 && !loading && !error && <p className="no-items-message">Aucun élément archivé.</p>}
            {archivedMeetings.map(item => (
              <li
                key={item.id}
                className={selectedArchivedMeeting?.id === item.id ? 'active' : ''}
                onClick={() => setSelectedArchivedMeeting(item)}
              >
                <strong>{item.title}</strong>
                <span className="archive-date">{formatSimpleDate(item.date)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="right-panel">
          {selectedArchivedMeeting ? (
            <div className="archive-details-section section">
              <h4 className="archive-title">{selectedArchivedMeeting.title}</h4>

              <div className="detail-group">
                <div className="detail-row">
                  <span className="detail-label">Initial Date:</span>
                  <span className="detail-value">{formatDate(selectedArchivedMeeting.initialDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Finish Date:</span>
                  <span className="detail-value">{formatDate(selectedArchivedMeeting.finishDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-value">{selectedArchivedMeeting.durationHours} Hours</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Archived:</span>
                  <span className="detail-value">{formatDate(selectedArchivedMeeting.archivedDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Invited by:</span>
                  <span className="detail-value">{selectedArchivedMeeting.invitedBy}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{selectedArchivedMeeting.type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{selectedArchivedMeeting.location}</span>
                </div>
              </div>

              {selectedArchivedMeeting.documents.length > 0 && (
                <div className="documents-section detail-block">
                  <h5>Documents</h5>
                  <ul className="document-list">
                    {selectedArchivedMeeting.documents.map((doc, index) => (
                      <li key={index}>
                        <i className="fas fa-file-pdf pdf-icon"></i>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.name}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedArchivedMeeting.entries.length > 0 && (
                <div className="entries-section detail-block">
                  <h5>Entries</h5>
                  <ul className="entries-list">
                    {selectedArchivedMeeting.entries.map(entry => (
                      <li key={entry.id} className="entry-item">
                        <span className="entry-id">{entry.id}</span>
                        <span className="entry-text">{entry.text}</span>
                        <span className="entry-responsible">{entry.responsible}</span>
                        <span className="entry-start-date">Start Date: {formatSimpleDate(entry.startDate)}</span>
                        {entry.dueDate && <span className="entry-due-date">Due Date: {formatSimpleDate(entry.dueDate)}</span>}
                        {entry.notes && <span className="entry-notes">Notes: {entry.notes}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedArchivedMeeting.linkedMeetings.length > 0 && (
                <div className="linked-meetings-section detail-block">
                  <h5>Meeting-Links</h5>
                  <ul className="linked-list">
                    {selectedArchivedMeeting.linkedMeetings.map((link, index) => (
                      <li key={index}>
                        <a href="#">{link.title}</a> - {link.agendaItem}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedArchivedMeeting.attachments.length > 0 && (
                <div className="attachments-section detail-block">
                  <h5>Attachments</h5>
                  <p>No attachments.</p>
                </div>
              )}
            </div>
          ) : (
            <p className="no-items-message">Sélectionnez un élément archivé dans le panneau de gauche pour voir les détails.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveDashboard;
