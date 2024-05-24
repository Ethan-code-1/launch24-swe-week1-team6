import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  RadioGroup, Radio, Select, MenuItem, FormControl, TextField, FormLabel, FormControlLabel, Checkbox
} from "@mui/material";



import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc, 
  query,
  where,
} from "firebase/firestore";

import "../styles/Students.css";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // When adding a new student:
  const [First, setFirst] = useState("");
  const [Last, setLast] = useState("");
  const [Grade, setGrade] = useState("");
  const [Teacher, setTeacher] = useState("");
  //const [enrolledIn, setEnrolledIn] = useState(""); // assuming it's a string for now

  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedTeacherName, setSelectedTeacherName] = useState("");

  //New DB state variables after removing references 
  const [studentGrades, setStudentGrades] = useState([]);
  const [enrolledIn, setEnrolledIn] = useState([]);




  const fetchStudents = async () => {
    try {
      //Get all student records 
      const grabInformation = await getDocs(collection(db, "Students"));
      const studentsList = [];
  
      // From internet, user to handle nested async awaits 
      for (const doc of grabInformation.docs) {
        const data = doc.data();
        let enrolledInList = [];
  
        studentsList.push({
          id: doc.id,
          First: data.First,
          Last: data.Last,
          Grade: data.Grade,
          enrolledIn: data.enrolledIn,
          Teacher: data.Teacher,
        });
      }
  
      setStudents(studentsList);
      console.log(studentsList);
    } catch (error) {
      console.error("Error fetching student data: ", error);
    }
  };
  

  const handleSearch = () => {
    if (searchQuery.trim() === "") {
      // If search query is empty, fetch all students again
      fetchStudents();
    } else {
      // Filter students based on the search query
      const filteredStudents = students.filter(
        (student) =>
          student.First.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.Last.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredStudents.length === 0) {
        // If no matching students found, set an empty array
        setStudents([]);
      } else {
        // Set filtered students
        setStudents(filteredStudents);
      }
    }
  };

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    await fetchStudentGrades(student.id);
  };


  const handleAddOption = () => {
    // Handle whether user wants to add a new student
    setIsAddingStudent((prevState) => !prevState);
  };








  const getTeacherIdByName = async (firstName, lastName) => {
    try {
      // Query Firestore to get the teacher's ID
      const q = query(collection(db, "teachers"), where("First", "==", firstName), where("Last", "==", lastName));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        console.error("Selected teacher not found");
        return null;
      }
  
      let selectedTeacherId = null;
      querySnapshot.forEach((doc) => {
        selectedTeacherId = doc.id;
      });
  
      return selectedTeacherId;
    } catch (error) {
      console.error("Error fetching teacher ID: ", error);
      return null;
    }
  };

  const getClassRefByName = async (className) => {
    try {
      const q = query(collection(db, "Classes"), where("Name", "==", className));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        console.error(`Class with name ${className} not found`);
        return null;
      }
  
      let classRef = null;
      querySnapshot.forEach((doc) => {
        classRef = doc.ref;
      });
  
      return classRef;
    } catch (error) {
      console.error("Error fetching class reference: ", error);
      return null;
    }
  };
  
  const fetchTeacherName = async (teacherRef) => {
    try {
      const teacherDoc = await getDoc(teacherRef);
      console.log(teacherDoc); 
      if (teacherDoc.exists()) {
        const teacherData = teacherDoc.data();
        return `${teacherData.First} ${teacherData.Last}`;
      } else {
        //console.error("Teacher document not found");
        return "N/A";
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
      return "N/A";
    }
  };
  





  const createGradebookEntry = async (studentId, classId) => {
    try {
      await addDoc(collection(db, "Gradebook"), {
        studentId,
        classId,
        grade: 0,
      });
      console.log(`Gradebook entry created for student ${studentId} in class ${classId}`);
    } catch (error) {
      console.error("Error adding Gradebook entry: ", error);
    }
  };




  const handleSubmit = async (e) => {
    e.preventDefault();

    // Do not allow information to pass if user has not answered the entire form
    if (!First || !Last || !Grade || !Teacher || !enrolledIn) {
      alert("Please fill in all fields");
      return;
    }
    
    const newStudent = {
      First,
      Last,
      Grade,
      Teacher,
      enrolledIn,
    };
    
    
    try {
      const docRef = await addDoc(collection(db, "Students"), newStudent);
      console.log("Document written with ID: ", docRef.id);
      fetchStudents();
      
      //Now create gradebook enteries for the courses students were enrolled in
      enrolledIn.forEach((classId) => {
        createGradebookEntry(docRef.id, classId);
      });

      // Clear form fields after submission for better user experience
      setFirst("");
      setLast("");
      setGrade("");
      setTeacher("");
      setEnrolledIn("");
    } catch (error) {
      console.error("Error adding document: ", error);
    }

    
  };

  // TODO: Handlers for the deletion of student from the list, reversing the way we worked with handleSubmit
  const handleDelete = async () => {
    if (selectedStudent) {
      const studentid = selectedStudent.id;

      if (selectedStudent) {
        const studentId = selectedStudent.id;
    
        try {
          // Delete the student document
          const studentRef = doc(db, "Students", studentId);
          await deleteDoc(studentRef);
          console.log("Student document successfully deleted!");
    
          // Query Gradebook for all entries with the matching studentId
          const gradebookQuery = query(
            collection(db, "Gradebook"),
            where("studentId", "==", studentId)
          );
          const querySnapshot = await getDocs(gradebookQuery);
    
          // Delete each document in the Gradebook that matches the studentId
          const deletePromises = [];
          querySnapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
          });
    
          // Wait for all deletions to complete
          await Promise.all(deletePromises);
          console.log("Gradebook entries successfully deleted!");
    

          fetchStudents();
        } catch (error) {
          console.error("Error deleting documents: ", error);
        }
      }
      
      try {
        const studentRef = doc(db, "Students", selectedStudent.id);
        await deleteDoc(studentRef);
        console.log("Document successfully deleted!");
        fetchStudents();
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
    window.location.reload();

  };

  const handleEdit = async () => {
    if (selectedStudent) {
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  //

  const handleCheckboxChange = (event) => {
    const value = event.target.value;
    setEnrolledIn((prev) => {
      if (prev.includes(value)) {
        return prev.filter((classId) => classId !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const grabInformation = await getDocs(collection(db, "teachers"));
        const teachersList = [];
        grabInformation.forEach((doc) => {
          const data = doc.data();
          data.id = doc.id; 
          teachersList.push(data);
        });
        setTeachers(teachersList);
      } catch (error) {
        console.error("Error fetching teachers:", error);
      }
    };

    fetchTeachers();
  }, []);


  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const grabInformation = await getDocs(collection(db, "Classes"));
        const classesList = [];
        grabInformation.forEach((doc) => {
          const data = doc.data();
          data.id = doc.id; 
          classesList.push(data);
        });
        setClasses(classesList);
        //console.log("classes" , classes);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    fetchClasses();
  }, []);






  const fetchStudentGrades = async (studentId) => {
    try {
      // Create a query against the Gradebook collection where the Student field matches the studentId
      const gradebookQuery = query(
        collection(db, "Gradebook"),
        where("studentId", "==", studentId)
      );

      //console.log("F" + studentId + "F");
  
      // Fetch the documents that match the query
      const gradebookSnapshot = await getDocs(gradebookQuery);
  
      const grades = [];
  
      // Iterate through each document in the query snapshot
      gradebookSnapshot.forEach((doc) => {
        const curGrade = doc.data();
        console.log("   ", curGrade);
        grades.push(curGrade);
      });
  
      // Set the student grades state
      setStudentGrades(grades);
      console.log(grades);
    } catch (error) {
      console.error("Error fetching student grades: ", error);
    }
  };
  
  
  


  //
  return (
    <div>
      <div className="image-container">
        <img src="/homePageSchool.jpeg" alt="School Image" className="full-width-image"></img>
        <div className="overlay"></div>
        <h1 className="homeScreenHeader">Student Directory</h1>
    </div>
    <hr className = "homePageHr"></hr>
      <Card className="main-wrapper" sx={{boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)'}}>
        <div className="left-container">
          <h1> All Students</h1>
          <p> Browse through the list of all Students</p>
          <div className="search">
            {/* onChange to update the changes that user inputted so that the list only display only the students that match the search query*/}
            <input
              type="text"
              placeholder="Filter by name"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button sx={{background: '#147a7c', '&:hover': {backgroundColor: '#0f5f60',},}} onClick={handleSearch} variant="contained">
              Search
            </Button>
          </div>

          {/* Provide an option where we can add students */}
          <div className="addStudent-option">
      <figcaption onClick={handleAddOption}>
        Can't find your student? {isAddingStudent ? "▲" : "▼"}
      </figcaption>
      <br />
      {isAddingStudent && (
        <form onSubmit={handleSubmit}>
          <TextField
            label="First Name"
            value={First}
            onChange={(e) => setFirst(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Last Name"
            value={Last}
            onChange={(e) => setLast(e.target.value)}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <FormLabel>Grade</FormLabel>
            <Select
              value={Grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <MenuItem value="">Select a grade</MenuItem>
              <MenuItem value="Kindergarten">Kindergarten</MenuItem>
              <MenuItem value="1st">1st</MenuItem>
              <MenuItem value="2nd">2nd</MenuItem>
              <MenuItem value="3rd">3rd</MenuItem>
              <MenuItem value="4th">4th</MenuItem>
              <MenuItem value="5th">5th</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
          <FormLabel>Teacher</FormLabel>
          <Select
            value={Teacher}
            onChange={(e) => setTeacher(e.target.value)}
          >
            <MenuItem value="">Select a teacher</MenuItem>
            {teachers.map((teacher, index) => (
              <MenuItem key={index} value={teacher.id}>
                {teacher.First} {teacher.Last}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl component="fieldset" fullWidth margin="normal">
      <FormLabel component="legend">Enrolled In</FormLabel>
      {classes.map((curClass, index) => (
        <FormControlLabel
          key={index}
          control={
            <Checkbox
              checked={enrolledIn.includes(curClass.id)}
              onChange={handleCheckboxChange}
              value={curClass.id}
            />
          }
          label={curClass.Name}
        />
      ))}
    </FormControl>
          <Button sx={{background: '#147a7c', '&:hover': {backgroundColor: '#0f5f60',},}} type="submit" variant="contained" color="primary">Add Student</Button>
        </form>
      )}
    </div>

          {/* Setting up how we would display student information through gridding */}
          <table className="student-list">
            <thead>
              <tr className="student-header">
                <th className="student-photo"> Photo </th>
                <th className="student-name">Name</th>
                <th className="student-grade">Grade</th>
                <th className="student-teacher">Teacher</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  className="student-row"
                  key={student.id}
                  onClick={() => handleStudentClick(student)}
                >
                  <td className="student-photo">
                    <EmojiEmotionsIcon />
                  </td>
                  <td className="student-name">
                    {`${student.First} ${student.Last}`}
                  </td>
                  <td className="student-grade">{student.Grade}</td>
                  <td className="student-teacher">{student.Teacher}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* We will only display the right container containing all information if user selects the student within the list on the left container*/}
        {selectedStudent ? (
          <div className="right-container">
            <h1> Student Information </h1>

            <div className="student-profile-desc">
              {/* Display student card*/}
              <Card className = "studentCard" sx={{ maxWidth: 500 }}>
                <CardMedia
                  component="img"
                  height="200"
                  image="/assets/profile-picture.jpeg"
                  alt="profile-picture"
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {selectedStudent.First} {selectedStudent.Last}
                  </Typography>
                  <figcaption variant="body2" color="text.secondary">
                    Student
                  </figcaption>
                </CardContent>
              </Card>
            </div>

            <div className="student-specifics">
              <div className="student-info-containers"></div>
              <div className="academic-info">
                <h2>Academic Information </h2>
                <p> Enrolled In: {selectedStudent.enrolledIn ? selectedStudent.enrolledIn.join(', ') : "N/A"}</p>
                <p> Grade Level: {selectedStudent.Grade || "N/A"}</p>
                <p>Teacher: {selectedStudent.Teacher || "N/A"}</p>
              </div>
              <div className="contact-info">
                <h2> Contact Information </h2>
                <p> Parent: {selectedStudent.parent || "N/A"}</p>
                <p>
                  Legal Guardian Phone #:
                  {selectedStudent.guardianPhone || "N/A"}
                </p>
                <p> Email: {selectedStudent.email || "N/A"}</p>
              </div>
              <div className="personal-info">
                <h2> Personal Information</h2>
                <p> Pronouns: {selectedStudent.Pronouns || "N/A"}</p>
                <p> Birthday: {selectedStudent.Birthday || "N/A"}</p>
                <p> Residence: {selectedStudent.Residence || "N/A"}</p>
              </div>
              <div className="personal-info">
                <h2> Grades</h2>
                {studentGrades.length > 0 ? (
                  studentGrades.map((grade, index) => (
                    <p key={index}>{grade.classId}: {grade.grade}</p>
                  ))
                ) : (
                  <p>No grades available</p>
                )}
              </div>

              <div className="update-student">
                <h2> Edit/Update Student</h2>
                {/* TODO: Must provide an option where we can remove/edit/update the student through a button */}
                <div className="update-buttons">
                  <Button
                    onClick={handleDelete}
                    variant="contained"
                    color="secondary"
                  >
                    Remove Student
                  </Button>
                  <br />
                  <Button
                    onClick={handleEdit}
                    variant="contained"
                    color="primary"
                    sx={{background: '#147a7c', '&:hover': {backgroundColor: '#0f5f60',},}}
                  >
                    Edit Information
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p>Select a student to see more details</p>
        )}
      </Card>
    </div>
  );
};

export default Students;
