import {React, useState, useEffect} from 'react';
import {Button, Dialog, DialogContent, DialogTitle, TextField, Typography, Grid, Card} from '@mui/material';
import { db } from "../../firebase";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import {collection, doc, getDocs, updateDoc, setDoc, deleteDoc} from "firebase/firestore";
import ClearIcon from '@mui/icons-material/Clear';

const Calendar = () => {

    const [ModeladdOpen, setModeladdOpen] = useState(false);
    const [ModelDelOpen, setModelDelOpen] = useState(false);
    const [ModelEditOpen, setModelEditOpen] = useState(false);
    const [events, setEvents] = useState([]);
    const [inputTitle, setInputTitle] = useState('');
    const [inputDate, setInputDate] = useState('');

    const handleaddOpen = () => {
        setModeladdOpen(true);
    };
    const handleaddClose = () => {
        setModeladdOpen(false);
    };
    const handleDelOpen = () => {
        setModelDelOpen(true);
    };
    const handleDelClose = () => {
        setModelDelOpen(false);
    };
    const handleEditOpen = () => {
        setModelEditOpen(true);
    };
    const handleEditClose = () => {
        setModelEditOpen(false);
    };

    const showEvents = async () => {
        const documents = await getDocs(collection(db, "Events"));
        let list = [];
        documents.forEach((event) => list.push({ id: event.id, title: event.data().Name, start: event.data().Date }));
        setEvents(list);
        console.log(list);
    };

    useEffect(() => {
        showEvents();
    }, []);

    const addEvent = async () => {
        const eventDocRef = doc(db, "Events", inputTitle);
        await setDoc(eventDocRef, {
            Date: inputDate,
            Name: inputTitle
        });
        setEvents([...events, { id: inputTitle, title: inputTitle, start: inputDate }]);
        handleaddClose();
    };

    const deleteEvent = async (id) => {
        await deleteDoc(doc(db, "Events", id));
        setEvents(events.filter(event => event.id !== id));
        handleDelClose();
    };

    return (
        <>
            <div className="image-container">
                <img src="/homePageSchool.jpeg" alt="School Image" className="full-width-image"></img>
                <div className="overlay"></div>
                <h1 className="homeScreenHeader">School Calendar</h1>
            </div>
            <hr className = "homePageHr"></hr>

            <Card  sx={{paddingLeft: "50px", paddingRight : "50px", paddingTop: "30px", paddingBottom: "30px", marginTop: "5vh", boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)'}}>
            <Typography variant="body1" color="text.secondary" id = "homePageCardDesc">
              Add or remove events from your school's calendar below!
            </Typography>
            <Grid container direction="row" alignItems="center" justifyContent="center" spacing={1}>
                <Grid item xs={1.5}>
                    <Button variant="contained" onClick={handleaddOpen} sx={{background: '#147a7c', '&:hover': {backgroundColor: '#0f5f60',},}}>Add Event</Button>
                </Grid>
                <Grid item xs={1.5}>
                    <Button color="error" variant="contained" onClick={handleDelOpen}>Delete Event</Button>
                </Grid>
            </Grid>
            <Dialog open={ModeladdOpen}>
                <Grid item marginTop={2} marginLeft={28}>
                    <ClearIcon onClick={handleaddClose}></ClearIcon>
                </Grid>
                <DialogTitle>Add Event</DialogTitle>
                <DialogContent>
                    <Typography variant="h6">Title</Typography>
                    <TextField onChange={(e) => { setInputTitle(e.target.value); }} placeholder='Title'>Title</TextField>
                    <Typography variant="h6">Date</Typography>
                    <TextField onChange={(e) => { setInputDate(e.target.value); }} placeholder='YYYY-MM-DD'>Date</TextField>
                    <Grid item marginTop={2}>
                        <div className='addButton'><Button variant="contained" justifycontent="center" onClick={addEvent}>Add Event</Button></div>
                    </Grid>
                </DialogContent>
            </Dialog>
            <Dialog open={ModelDelOpen}>
                <Grid item marginTop={3} marginLeft={38}>
                    <ClearIcon onClick={handleDelClose}></ClearIcon>
                </Grid>
                <DialogTitle>List of Events</DialogTitle>
                <DialogContent>
                    {events.map((event) => (
                        <div key={event.id}>
                            <p><b>Name:</b> {event.title} | <b>Date:</b> {event.start} <Button onClick={() => deleteEvent(event.id)}>Delete</Button></p>
                        </div>
                    ))}
                </DialogContent>
            </Dialog>
            <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={events} />
            </Card>
        </>
    );
};

export default Calendar;
