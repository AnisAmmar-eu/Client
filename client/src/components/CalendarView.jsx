import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/fr';
import './CalendarView.css';

moment.locale('fr');
const localizer = momentLocalizer(moment);

const EventComponent = ({ event }) => {
    const link = event.resource.meetingLink || null;
    return (
        <div className="calendar-event">
            <span className="calendar-event-title">{event.title}</span>
            <div className="calendar-event-link">
                {link ? (
                    <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="calendar-link"
                    >
                        Rejoindre via Jitsi Meet
                    </a>
                ) : (
                    <span>Aucun lien disponible</span>
                )}
            </div>
        </div>
    );
};

const CalendarView = () => {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchMeetings() {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('Aucun token d\'authentification.');
                }

                const response = await fetch('https://localhost:7212/api/Meeting/my-meetings', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Session expirée. Veuillez vous reconnecter.');
                    }
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }

                const meetings = await response.json();
                const meetingList = meetings.$values || meetings;

                const events = meetingList.map(meeting => ({
                    id: meeting.id,
                    title: meeting.title || 'Réunion sans titre',
                    start: new Date(meeting.date),
                    end: new Date(meeting.date), // Même date si pas d'endDate
                    allDay: false,
                    resource: {
                        type: 'meeting',
                        description: meeting.description || 'Aucune description',
                        meetingLink: meeting.meetingLink || null
                    }
                }));

                setEvents(events);
                setError(null);
            } catch (error) {
                console.error('Erreur lors de la récupération des réunions:', error);
                setError(error.message || 'Impossible de charger les réunions.');
            }
        }

        fetchMeetings();
    }, []);

    const eventPropGetter = (event) => ({
        style: {
            backgroundColor: '#1B263B',
            borderRadius: '5px',
            opacity: 0.9,
            color: '#ffffff',
            border: '0px',
            display: 'block',
            padding: '5px'
        }
    });

    const messages = {
        allDay: 'Toute la journée',
        previous: 'Précédent',
        next: 'Suivant',
        today: "Aujourd'hui",
        month: 'Mois',
        week: 'Semaine',
        day: 'Jour',
        agenda: 'Agenda',
        date: 'Date',
        time: 'Heure',
        event: 'Événement',
        noEventsInRange: 'Aucune réunion dans cette plage.',
        showMore: total => `+ ${total} plus`
    };

    return (
        <div className="calendar-container card glass-effect">
            <h2 className="calendar-title"><i className="fas fa-calendar-alt"></i> Mes Réunions</h2>
            {error && <div className="error-message">{error}</div>}
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 700 }}
                messages={messages}
                eventPropGetter={eventPropGetter}
                defaultView="month"
                views={['month', 'week', 'day', 'agenda']}
                components={{ event: EventComponent }}
            />
        </div>
    );
};

export default CalendarView;