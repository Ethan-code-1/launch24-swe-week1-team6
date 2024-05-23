import {useState, useEffect} from 'react';

import "../styles/Home.css";
import { Card, CardContent, Typography, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import ClassIcon from '@mui/icons-material/Class';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SchoolIcon from '@mui/icons-material/School';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import Class from '@mui/icons-material/Class';

import { db } from "../../firebase";
import { addDoc, collection, getDocs, doc } from "firebase/firestore";

const Home = () => {

    const navigate = useNavigate();

  const handleClasses = () => {
    navigate('/classes');
  };

  const handleCalendar = () => {
    navigate('/calendar');
  };

  const handleStudent = () => {
    navigate('/students');
  };

  const handleTeacher = () => {
    navigate('/teachers');
  };


  //database functions
  const [numberClasses, setNumberClasses] = useState(0);
  const [numberEvents, setNumberEvents] = useState(0);
  const [numberStudents, setNumberStudents] = useState(0);
  const [numberTeachers, setNumberTeachers] = useState(0);


  const fetchResponses = async () => {
    try {
        const myCollections = ['Classes', 'Events', 'Students', 'teachers'];
        let counts = [0, 0, 0, 0]; 
        for(let i = 0; i < myCollections.length; i++){
          const snapshot = await getDocs(collection(db, myCollections[i]));
          counts[i] = snapshot.size; 
        }

        setNumberClasses(counts[0]);
        setNumberEvents(counts[1]);
        setNumberStudents(counts[2]);
        setNumberTeachers(counts[3]); 

    } catch (error) {
        console.error("Error fetching documents: ", error);
    }
};

useEffect(() => {
    fetchResponses();
}, []);


  return (
    <div>
      <div className="image-container">
        <img src="/homePageSchool.jpeg" alt="School Image" className="full-width-image"></img>
        <div className="overlay"></div>
        <h1 className="homeScreenHeader">Welcome</h1>
    </div>
    <hr className = "homePageHr"></hr>
    <Grid container spacing={2} style={{ padding: '20px' }}>
    <Grid item xs={12} md={6}>
    <Card id = "homePageCard">
          <CardContent id ="homePageCardContent">
            <Typography variant="h4" component="div" id = "homePageCardHeader">
              View Classes <ClassIcon></ClassIcon>
            </Typography>
            <Typography variant="body1" color="text.secondary" id = "homePageCardDesc">
              View and edit information on <span className = "spanHome" style={{ fontWeight: 'bold' }}>{numberClasses}</span> classes offered
            </Typography>
            <Button variant = "contained" color = "primary" id = "homePageCardBtn" onClick = {handleClasses} sx={{background: '#147a7c', '&:hover': {backgroundColor: '#0f5f60',},}}>View Classes</Button>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card id = "homePageCard">
          <CardContent id ="homePageCardContent">
            <Typography variant="h4" component="div" id = "homePageCardHeader">
              View Events Calendar <CalendarMonthIcon></CalendarMonthIcon>
            </Typography>
            <Typography variant="body1" color="text.secondary" id = "homePageCardDesc">
              See <span className = "spanHome" style={{ fontWeight: 'bold' }}>{numberEvents}</span> upcoming events and add new ones
            </Typography>
            <Button sx={{background: '#147a7c', '&:hover': {backgroundColor: '#0f5f60',},}} variant = "contained" color = "primary" id = "homePageCardBtn" onClick = {handleCalendar}>View Calendar</Button>

          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card id = "homePageCard">
          <CardContent id ="homePageCardContent">
            <Typography variant="h4" component="div" id = "homePageCardHeader">
              View Student Directory <SchoolIcon></SchoolIcon>
            </Typography>
            <Typography variant="body1" color="text.secondary" id = "homePageCardDesc">
              View information associated with <span className = "spanHome" style={{ fontWeight: 'bold' }}>{numberStudents}</span> students
            </Typography>
            <Button sx={{background: '#147a7c', '&:hover': {backgroundColor: '#0f5f60',},}} variant = "contained" color = "primary" id = "homePageCardBtn" onClick = {handleStudent}>Student Directory</Button>

          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card id = "homePageCard">
          <CardContent id ="homePageCardContent">
            <Typography variant="h4" component="div" id = "homePageCardHeader">
              View Teacher Directory <SupervisorAccountIcon></SupervisorAccountIcon>
            </Typography>
            <Typography variant="body1" color="text.secondary" id = "homePageCardDesc">
              View information associated with <span className = "spanHome" style={{ fontWeight: 'bold' }}>{numberTeachers}</span> teachers
            </Typography>
            <Button sx={{background: '#147a7c', '&:hover': {backgroundColor: '#0f5f60',},}} variant = "contained" color = "primary" id = "homePageCardBtn" onClick = {handleTeacher}>Teacher Directory</Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
    </div>
  );
};

export default Home;
