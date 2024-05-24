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
  updateDoc,
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

  // State variable to control the visibility of the right container
  const [showRightContainer, setShowRightContainer] = useState(true);

  // When adding a new student:
  const [First, setFirst] = useState("");
  const [Last, setLast] = useState("");
  const [Grade, setGrade] = useState("");
  const [Teacher, setTeacher] = useState("");

  //const [enrolledIn, setEnrolledIn] = useState(""); // assuming it's a string for now
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  // When fetching class names
  const [classNamesById, setClassNamesById] = useState({});
  const [selectedTeacherName, setSelectedTeacherName] = useState("");
  const [selectedClassNames, setSelectedClassNames] = useState([]);

  //New DB state variables after removing references
  const [studentGrades, setStudentGrades] = useState([]);
  const [enrolledIn, setEnrolledIn] = useState([]);

  // When editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState({});

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Students"));
      const studentsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllStudents(studentsList);
      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching student data: ", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "teachers"));
      const teachersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeachers(teachersList);
    } catch (error) {
      console.error("Error fetching teacher data: ", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Classes"));
      const classesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClasses(classesList);

      const classNamesMap = {};
      classesList.forEach((curClass) => {
        classNamesMap[curClass.id] = curClass.Name;
      });
      setClassNamesById(classNamesMap);
    } catch (error) {
      console.error("Error fetching classes data: ", error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim() === "") {
      fetchStudents();
    } else {
      const filteredStudents = allStudents.filter(
        (student) =>
          student.First.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.Last.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setStudents(filteredStudents.length > 0 ? filteredStudents : []);
    }
  };

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setEditedStudent(student);
    setIsEditing(false);
    await fetchStudentGrades(student.id);

    // Show the right container when a student is clicked
    setShowRightContainer(true);

    // Fetch the teacher's name by ID
    const teacherName = await getTeacherNameById(student.Teacher);
    setSelectedTeacherName(teacherName);

    // Fetch the class names
    const classNames = await fetchClassNames(student.enrolledIn);
    setSelectedClassNames(classNames);
  };

  // Getter function that converts the classIds into names
  const fetchClassNames = async (classIds) => {
    try {
      const classNames = await Promise.all(
        classIds.map(async (classId) => {
          const classDoc = await getDoc(doc(db, "Classes", classId));
          if (classDoc.exists()) {
            return classDoc.data().Name;
          } else {
            return "N/A";
          }
        })
      );
      return classNames;
    } catch (error) {
      console.error("Error fetching class names:", error);
      return [];
    }
  };

  const handleAddOption = () => {
    // Handle whether user wants to add a new student
    setIsAddingStudent((prevState) => !prevState);
  };

  const getTeacherNameById = async (teacherId) => {
    try {
      // Query Firestore to get the teacher's document by ID
      const teacherDoc = await getDoc(doc(db, "teachers", teacherId));

      if (teacherDoc.exists()) {
        const teacherData = teacherDoc.data();
        return `${teacherData.First} ${teacherData.Last}`;
      } else {
        console.error(`Teacher with ID ${teacherId} not found`);
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
      console.log(
        `Gradebook entry created for student ${studentId} in class ${classId}`
      );
    } catch (error) {
      console.error("Error adding Gradebook entry: ", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!First || !Last || !Grade || !Teacher || enrolledIn.length === 0) {
      alert("Please fill in all fields");
      return;
    }

    const newStudent = {
      First,
      Last,
      Grade,
      Teacher,
      enrolledIn, // Store class IDs directly
    };

    try {
      const docRef = await addDoc(collection(db, "Students"), newStudent);
      console.log("Document written with ID: ", docRef.id);
      fetchStudents();

      enrolledIn.forEach((classId) => {
        createGradebookEntry(docRef.id, classId);
      });

      // Clear form fields after submission for better user experience
      setFirst("");
      setLast("");
      setGrade("");
      setTeacher("");
      setEnrolledIn([]);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

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

  // Utilized from the Teachers.jsx file
  const handleEditClick = () => {
    setEditedStudent(selectedStudent); // Initialize editedStudent with selectedStudent data
    setIsEditing(true);
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

      console.log(updatedStudents);
      setStudents(updatedStudents);
      setAllStudents(updatedStudents);

      // Hide the right container after saving
      setShowRightContainer(false);
    } catch (error) {
      console.error("Error updating student data: ", error);
    }
  };

  // TODO: Handlers for the deletion of student from the list, reversing the way we worked with handleSubmit
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedStudent({ ...editedStudent, [name]: value });
  };

  const handleCheckboxChange = (event) => {
    const classId = event.target.value;
    setEnrolledIn((prev) => {
      if (prev.includes(classId)) {
        return prev.filter((id) => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

  useEffect(() => {
    fetchStudents();
    fetchTeachers();
    fetchClasses();
  }, []);

  // Helper function to edit the Academic Information section so that the information is saved
  useEffect(() => {
    if (selectedStudent && isEditing) {
      setEditedStudent(selectedStudent);
    }
  }, [selectedStudent, isEditing]);

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
            <Button
              sx={{
                background: "#147a7c",
                "&:hover": { backgroundColor: "#0f5f60" },
              }}
              onClick={handleSearch}
              variant="contained"
            >
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
                  {classes.map((curClass) => (
                    <FormControlLabel
                      key={curClass.id}
                      control={
                        <Checkbox
                          checked={enrolledIn.includes(curClass.id)}
                          onChange={handleCheckboxChange}
                          value={curClass.id} // Use class ID here
                        />
                      }
                      label={curClass.Name}
                    />
                  ))}
                </FormControl>
                <Button
                  sx={{
                    background: "#147a7c",
                    "&:hover": { backgroundColor: "#0f5f60" },
                  }}
                  type="submit"
                  variant="contained"
                  color="primary"
                >
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* We will only display the right container containing all information if user selects the student within the list on the left container*/}
        {showRightContainer && selectedStudent ? (
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
                    <FormControl fullWidth margin="normal">
                      <FormLabel>Enrolled In</FormLabel>
                      <Select
                        multiple
                        value={editedStudent.enrolledIn || []}
                        onChange={(e) =>
                          setEditedStudent({
                            ...editedStudent,
                            enrolledIn: e.target.value,
                          })
                        }
                        name="enrolledIn"
                      >
                        {classes.map((curClass, index) => (
                          <MenuItem key={index} value={curClass.id}>
                            {curClass.Name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <br />
                    <FormControl fullWidth margin="normal">
                      <FormLabel>Teacher</FormLabel>
                      <Select
                        value={
                          editedStudent.Teacher ? editedStudent.Teacher : ""
                        }
                        onChange={(e) =>
                          setEditedStudent({
                            ...editedStudent,
                            Teacher: e.target.value,
                          })
                        }
                      >
                        <MenuItem value="">Select a teacher</MenuItem>
                        {teachers.map((teacher, index) => (
                          <MenuItem key={index} value={teacher.id}>
                            {`${teacher.First} ${teacher.Last}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                ) : (
                  <div>
                    <p>
                      Enrolled In:{" "}
                      {selectedClassNames.length > 0
                        ? selectedClassNames.join(", ")
                        : "N/A"}
                    </p>
                    <p>Average Grade: {selectedStudent.Grade || "N/A"}</p>
                    <p>Teacher: {selectedTeacherName || "N/A"}</p>
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
                    <p> Parent: {selectedStudent.Parent || "N/A"}</p>
                    <p>
                      Legal Guardian Phone #:
                      {selectedStudent.LegalGuardianNumber || "N/A"}
                    </p>
                    <p> Email: {selectedStudent.Email || "N/A"}</p>
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
              <div className="personal-info">
                <h2> Grades</h2>
                {studentGrades.length > 0 ? (
                  studentGrades.map((grade, index) => (
                    <p key={index}>
                      {classNamesById[grade.classId] || "Unknown Class"}:{" "}
                      {grade.grade}
                    </p>
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
