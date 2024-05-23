import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  RadioGroup,
  Radio,
  Select,
  MenuItem,
  FormControl,
  TextField,
  FormLabel,
  FormControlLabel,
  Checkbox,
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
  const [allStudents, setAllStudents] = useState([]);
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
  const [enrolledIn, setEnrolledIn] = useState([]);
  const [selectedTeacherName, setSelectedTeacherName] = useState("");

  // When editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState({});

  const fetchStudents = async () => {
    try {
      //Get all student records
      const grabInformation = await getDocs(collection(db, "Students"));
      const studentsList = [];

      // From internet, user to handle nested async awaits
      for (const doc of grabInformation.docs) {
        const data = doc.data();
        let enrolledInList = [];

        // Check if student is enrolled in any classes
        if (data.enrolledIn && data.enrolledIn.length > 0) {
          // Loop through each class and fetch class names
          for (const classRef of data.enrolledIn) {
            try {
              //Get the data for each class the student is enrolled in
              const classDoc = await getDoc(classRef);
              if (classDoc.exists) {
                const classData = classDoc.data();
                enrolledInList.push(classData.Name);
              } else {
                console.log("Class document not found");
              }
            } catch (error) {
              console.error("Error fetching class data:", error);
            }
          }
        } else {
          console.log("N/A");
        }

        // Fetch teacher name
        let teacherName = "N/A";
        if (data.Teacher) {
          try {
            const teacherDoc = await getDoc(data.Teacher);
            if (teacherDoc.exists) {
              const teacherData = teacherDoc.data();
              teacherName = `${teacherData.First} ${teacherData.Last}`;
            }
          } catch (error) {
            console.error("Error fetching teacher data:", error);
          }
        }

        studentsList.push({
          id: doc.id,
          First: data.First,
          Last: data.Last,
          Grade: data.Grade,
          enrolledIn: enrolledInList,
          Teacher: teacherName,
        });
      }

      setStudents(studentsList);
      console.log(studentsList);
    } catch (error) {
      console.error("Error fetching student data: ", error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

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
    setEditedStudent(student);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedStudent({ ...editedStudent, [name]: value });
  };

  const handleSaveClick = async () => {
    try {
      const studentRef = doc(db, "Students", selectedStudent.id);
      const studentSnapshot = await getDoc(studentRef);
      const studentData = studentSnapshot.data();

      const updatedStudent = { ...studentData, ...editedStudent };

      await updateDoc(studentRef, updatedStudent);
      setSelectedStudent(updatedStudent);
      setIsEditing(false);

      const updatedStudents = students.map((student) =>
        student.id === updatedStudent.id ? updatedStudent : student
      );
      setStudents(updatedStudents);
      setAllStudents(updatedStudents);
    } catch (error) {
      console.error("Error updating student data: ", error);
    }
  };

  const handleAddOption = () => {
    // Handle whether user wants to add a new student
    setIsAddingStudent((prevState) => !prevState);
  };

  const getTeacherIdByName = async (firstName, lastName) => {
    try {
      // Query Firestore to get the teacher's ID
      const q = query(
        collection(db, "teachers"),
        where("First", "==", firstName),
        where("Last", "==", lastName)
      );
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
      const q = query(
        collection(db, "Classes"),
        where("Name", "==", className)
      );
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Do not allow information to pass if user has not answered the entire form
    if (!First || !Last || !Grade || !Teacher || !enrolledIn) {
      alert("Please fill in all fields");
      return;
    }

    let teacher_id = await getTeacherIdByName(Teacher.First, Teacher.Last);
    const teacherRef = doc(db, "teachers", teacher_id);
    //console.log(enrolledIn);

    const enrolledInRefs = await Promise.all(
      enrolledIn.map(async (className) => await getClassRefByName(className))
    );

    const newStudent = {
      First,
      Last,
      Grade,
      Teacher: teacherRef,
      enrolledIn: enrolledInRefs,
    };

    // Log the newStudent object before adding it to Firestore
    console.log("Submitting new student: ", newStudent);

    try {
      const docRef = await addDoc(collection(db, "Students"), newStudent);
      console.log("Document written with ID: ", docRef.id);
      fetchStudents();

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
      try {
        const studentRef = doc(db, "Students", selectedStudent.id);
        await deleteDoc(studentRef);
        console.log("Document successfully deleted!");
        fetchStudents();
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  };

  const handleEdit = async () => {
    if (selectedStudent) {
    }
  };

  const handleCheckboxChange = (event) => {
    //From internet
    const value = event.target.value;
    setEnrolledIn((prev) => {
      if (prev.includes(value)) {
        return prev.filter((className) => className !== value);
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
          classesList.push(data);
        });
        setClasses(classesList);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    fetchClasses();
  }, []);

  //
  return (
    <div>
      <div className="image-container">
        <img
          src="/homePageSchool.jpeg"
          alt="School Image"
          className="full-width-image"
        ></img>
        <div className="overlay"></div>
        <h1 className="studentScreenHeader">Student Directory</h1>
      </div>
      <hr className="homePageHr"></hr>
      <Card className="main-wrapper">
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
            <Button onClick={handleSearch} variant="contained">
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
                      <MenuItem key={index} value={teacher}>
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
                          checked={enrolledIn.includes(curClass.Name)}
                          onChange={handleCheckboxChange}
                          value={curClass.Name}
                        />
                      }
                      label={curClass.Name}
                    />
                  ))}
                </FormControl>
                <Button type="submit" variant="contained" color="primary">
                  Add Student
                </Button>
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
              <Card className="studentCard" sx={{ maxWidth: 500 }}>
                <CardMedia
                  component="img"
                  height="200"
                  image="/profile-picture.jpeg"
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
                <h2>Academic Information</h2>
                {isEditing ? (
                  <div>
                    <label>Enrolled In: </label>
                    <input
                      type="text"
                      name="EnrolledIn"
                      value={editedStudent.EnrolledIn || ""}
                      onChange={handleInputChange}
                    />
                    <br />
                    <label>Average Grade: </label>
                    <input
                      type="text"
                      name="Grade"
                      value={editedStudent.Grade || ""}
                      onChange={handleInputChange}
                    />
                    <br />
                    <label>Teacher: </label>
                    <input
                      type="text"
                      name="Teacher"
                      value={editedStudent.Teacher || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <div>
                    <p>
                      Enrolled In:{" "}
                      {selectedStudent.enrolledIn
                        ? selectedStudent.enrolledIn.join(", ")
                        : "N/A"}
                    </p>
                    <p>Average Grade: {selectedStudent.Grade || "N/A"}</p>
                    <p>Teacher: {selectedStudent.Teacher || "N/A"}</p>
                  </div>
                )}
              </div>
              <div className="contact-info">
                <h2> Contact Information </h2>
                {isEditing ? (
                  <div>
                    <label> Parent: </label>
                    <input
                      type="text"
                      name="Parent"
                      value={editedStudent.Parent || ""}
                      onChange={handleInputChange}
                    />
                    <br />
                    <label> Legal Guardian #: </label>
                    <input
                      type="text"
                      name="LegalGuardianNumber"
                      value={editedStudent.LegalGuardianNumber || ""}
                      onChange={handleInputChange}
                    />
                    <br />
                    <label>Email: </label>
                    <input
                      type="text"
                      name="Email"
                      value={editedStudent.Email || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <div>
                    <p> Parent: {selectedStudent.parent || "N/A"}</p>
                    <p>
                      Legal Guardian Phone #:
                      {selectedStudent.guardianPhone || "N/A"}
                    </p>
                    <p> Email: {selectedStudent.email || "N/A"}</p>
                  </div>
                )}
              </div>
              <div className="personal-info">
                <h2> Personal Information</h2>
                {isEditing ? (
                  <div>
                    <label>Pronouns: </label>
                    <input
                      type="text"
                      name="Pronouns"
                      value={editedStudent.Pronouns || ""}
                      onChange={handleInputChange}
                    />
                    <br />
                    <label>Birthday: </label>
                    <input
                      type="text"
                      name="Birthday"
                      value={editedStudent.Birthday || ""}
                      onChange={handleInputChange}
                    />
                    <br />
                    <label>Residence: </label>
                    <input
                      type="text"
                      name="Residence"
                      value={editedStudent.Residence || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <div>
                    <p> Pronouns: {selectedStudent.Pronouns || "N/A"}</p>
                    <p> Birthday: {selectedStudent.Birthday || "N/A"}</p>
                    <p> Residence: {selectedStudent.Residence || "N/A"}</p>
                  </div>
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
                  {isEditing ? (
                    <button onClick={handleSaveClick}>Save</button>
                  ) : (
                    <button onClick={handleEditClick}>Edit</button>
                  )}
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
