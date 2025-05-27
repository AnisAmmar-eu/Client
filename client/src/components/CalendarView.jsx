import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/fr';
import './CalendarView.css';

moment.locale('fr');
const localizer = momentLocalizer(moment);

const CalendarView = ({ userId }) => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        async function fetchProjects() {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.error('Aucun token d\'authentification trouvé');
                    return;
                }

                const response = await fetch(`https://localhost:7212/api/Project/by-user/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des projets');
                }

                const projects = await response.json();
                const projectList = projects.$values || projects;

                const events = projectList.map(project => ({
                    id: project.id,
                    title: project.name || 'Projet sans nom',
                    start: new Date(project.createdAt || project.CreatedAt), 
                    end: new Date(project.createdAt || project.CreatedAt),
                    allDay: true, 
                    resource: {
                        type: 'project',
                        description: project.description || 'Aucune description',
                    },
                    color: '#1B263B' 
                }));

                setEvents(events);
            } catch (error) {
                console.error('Erreur lors de la récupération des projets:', error);
            }
        }

        if (userId) {
            fetchProjects();
        }
    }, [userId]);

    const eventPropGetter = (event) => ({
        style: {
            backgroundColor: event.color,
            borderRadius: '5px',
            opacity: 0.9,
            color: 'white',
            border: '0px',
            display: 'block',
            padding: '5px',
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
        noEventsInRange: 'Aucun projet dans cette plage.',
        showMore: total => `+ ${total} plus`,
    };

    return (
        <div className="calendar-container card glass-effect">
            <h2 className="calendar-title"><i className="fas fa-calendar-alt"></i> Mes Projets par Date de Création</h2>
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
            />
        </div>
    );
};

export default CalendarView;