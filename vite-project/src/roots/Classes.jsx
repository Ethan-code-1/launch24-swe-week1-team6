import React from "react";
import { useEffect, useState } from "react";
import Table from "@mui/material/Table";
import Card from "@mui/material/Card";

import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import { db } from "../../firebase";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { query, where } from "firebase/firestore";
import "../styles/Students.css";

import {
  addDoc,
  getDocs,
  getDoc,
  doc,
  collection,
  updateDoc,
} from "firebase/firestore";

const Classes = () => {
  const [students, setStudents] = useState(null);
  const [thisClass, setClass] = useState(null);
  const [allClasses, setAllClasses] = useState([]);

  const [grade, setGrade] = useState();
  const [editGrade, setEditGrade] = useState(false);
  const [editGradeIndex, setEditGradeIndex] = useState(null);
  const [studentGrades, setStudentGrades] = useState({});

  const [teacherName, setTeacherName] = useState(null);
  const [teacherNames, setTeacherNames] = useState({});
  const [classSelected, setClassSelected] = useState(false);

  //Re renders the students when a grade is edited 
  useEffect(() => {
    if (thisClass) {
      const fetchUpdatedData = async () => {
        try {
          const gradebookQuery = query(
            collection(db, "Gradebook"),
            where("classId", "==", thisClass.id)
          );
  
          const querySnapshot = await getDocs(gradebookQuery);
          const updatedGrades = {};
  
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            updatedGrades[data.studentId] = data.grade;
          });
  
          setStudentGrades(updatedGrades);
  
          const studentsList = [];
  
          for (const doc of querySnapshot.docs) {
            const data = doc.data();
            const student_id = data.studentId;
  
            const studentIdentity = await fetchStudentById(student_id);
            const studentData = {
              id: student_id,
              grade: data.grade,
              First: studentIdentity ? studentIdentity.First : null,
              Last: studentIdentity ? studentIdentity.Last : null,
              studentId: data.studentId,
              classId: data.classId,
            };
  
            studentsList.push(studentData);
          }
  
          setStudents(studentsList);
        } catch (error) {
          console.error("Error fetching updated data: ", error);
        }
      };
  
      fetchUpdatedData();
    }
  }, [studentGrades, thisClass]);
  

  const fetchStudentById = async (studentId) => {
    try {
      const studentDocRef = doc(db, "Students", studentId);
      const studentDoc = await getDoc(studentDocRef);
  
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        const { First, Last } = studentData;
        return { id: studentDoc.id, First, Last };
      } else {
        console.log("No student document found with the provided ID!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching student data: ", error);
    }
  };
  
  const fetchStudents = async (classId) => {
    try {
      const gradebookQuery = query(
        collection(db, "Gradebook"),
        where("classId", "==", classId)
      );
  
      const querySnapshot = await getDocs(gradebookQuery);
      const studentsList = [];
  
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const student_id = data.studentId; 
        
        const studentIdentity = await fetchStudentById(student_id);
        console.log("ID : ", studentIdentity);
        console.log("grade" , data.grade);

        const studentData = {
          grade: data.grade,
          First: studentIdentity ? studentIdentity.First : null,
          Last: studentIdentity ? studentIdentity.Last : null,
          studentId: data.studentId,
          classId: data.classId,
        };
  
        studentsList.push(studentData);
      }
  
      //console.log("Students List: ", studentsList);
      setStudents(studentsList);
      console.log("final " ,studentsList)
      return studentsList;
    } catch (error) {
      console.error("Error fetching students: ", error);
    }
  };


  const fetchAllTeacherNames = async () => {
    const names = {};

    for (const eachClass of allClasses) {
      if (eachClass.Teacher) {
        const name = await fetchTeacherName(eachClass.Teacher);
        names[eachClass.Teacher] = name;
      }
    }
    setTeacherNames(names);
  };

  const fetchTeacherName = async (teacherRef) => {
    try {
      const teacherDoc = await getDoc(doc(db, "teachers", teacherRef));

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

  const fetchSelectedClass = async (classId) => {
    try {
      let querySnapshot = null;

      if (thisClass) {
        querySnapshot = await getDoc(doc(db, "Classes", classId));
      }

      if (querySnapshot != null) {
        const fetchedClass = querySnapshot.data();
        // setClass(fetchedClass);

        if (fetchedClass.Teacher) {
          // console.log(fetchedClass.Teacher)
          const teacherName = await fetchTeacherName(fetchedClass.Teacher);
          setTeacherName(teacherName);
        }
      } else {
        console.log("No class document!");
      }
    } catch (error) {
      console.error("Cannot load classes", error);
    }
  };

  const fetchStudentGrades = async (classId) => {
    try {
      // Create a query against the Gradebook collection where the Student field matches the studentId
      const gradebookQuery = query(
        collection(db, "Gradebook"),
        where("classId", "==", classId)
      );

      // Fetch the documents that match the query
      const gradebookSnapshot = await getDocs(gradebookQuery);

      const grades = {};

      // Iterate through each document in the query snapshot
      gradebookSnapshot.forEach((doc) => {
        const curGrade = doc.data();
        //console.log("   ", curGrade);
        grades[curGrade.studentId] = curGrade.grade;
      });

      // Set the student grades state
      setStudentGrades(grades);
      //console.log(grades);
    } catch (error) {
      console.error("Error fetching student grades: ", error);
    }
  };

  const fetchAllClasses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Classes"));
      if (querySnapshot != null) {
        const allClasses = querySnapshot.docs.map((doc, key) => ({
          id: doc.id,
          key,
          ...doc.data(),
        }));

        console.log("all classes" , allClasses); 

        setAllClasses(allClasses);
      } else {
        console.log("No classes document!");
      }
    } catch (error) {
      console.error("Cannot load all the classes", error);
    }
  };

  useEffect(() => {
    fetchAllClasses();
  }, []);

  useEffect(() => {
    fetchAllTeacherNames();
  }, [allClasses]);

  useEffect(() => {
    if (thisClass) {
      fetchStudents(thisClass.id);
      fetchSelectedClass(thisClass.id);
      fetchStudentGrades(thisClass.id);

      //console.log(students)
    }
  }, [thisClass]);

  

  const handleSubmit = async (e, studentId, classId) => {
    e.preventDefault();
  
    try {
      // Create a query to find the document where studentId and courseId match
      const gradebookQuery = query(
        collection(db, "Gradebook"),
        where("studentId", "==", studentId),
        where("classId", "==", classId)
      );

      console.log(studentId, classId);
  
      // Execute the query
      const querySnapshot = await getDocs(gradebookQuery);
  
      if (!querySnapshot.empty) {
        // Assuming there is only one document that matches the query
        const gradebookDoc = querySnapshot.docs[0];
        const gradebookDocRef = doc(db, "Gradebook", gradebookDoc.id);
  
        // Update the grade field in the matched document
        await updateDoc(gradebookDocRef, {
          grade: grade,
        });

        
  
        setGrade(0);
        console.log("Grade updated successfully");
      } else {
        console.log("No matching document found");
      }
    } catch (error) {
      console.error("Error updating grade: ", error);
    }
  };

  const handleGradeChange = (e) => {
    const newGrade = e.target.value;
    //console.log(newGrade);
    setGrade(newGrade);
  };

  const handleClassClick = async (selectedClass) => {
    //console.log(selectedClass)
    setClass(selectedClass);
    setClassSelected(true);
  };


  return (
    <>
      <div className="image-container">
        <img
          src="/homePageSchool.jpeg"
          alt="School Image"
          className="full-width-image"
        ></img>
        <div className="overlay"></div>
        <h1 className="homeScreenHeader">Classes</h1>
    </div>
    <hr></hr>
      <Card  sx={{paddingLeft: "50px", paddingRight : "50px", paddingTop: "30px", paddingBottom: "30px", marginTop: "5vh", boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)'}}>
      {!classSelected ? (
        <>
          <h1>Class roster</h1>
          <p> Select a class to view additional info! </p>
          {(allClasses && teacherNames) && (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 550 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Class Name</TableCell>
                    <TableCell align="left">Teacher</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allClasses &&
                    allClasses.map((eachClass) => (
                      <TableRow
                        key={eachClass.id}
                        onClick={() => handleClassClick(eachClass)}
                      >
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            "&.MuiTableCell-root:hover": {
                              color: "blue",
                              cursor: "pointer"
                            },
                          }}
                        >
                          {eachClass.Name}
                        </TableCell>
                        <TableCell align="left">
                          { teacherNames[eachClass.Teacher] || "Loading..."}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      ) : (
        <>
          <IconButton
            variant="filled"
            onClick={() => {
              setClassSelected(false);
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          {(thisClass) &&
             (
      </div>
      <hr></hr>
      <Card
        sx={{
          paddingLeft: "50px",
          paddingRight: "50px",
          paddingTop: "30px",
          paddingBottom: "30px",
          marginTop: "5vh",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
        }}
      >
        {!classSelected ? (
          <>
            <h1>Class roster</h1>
            <p> Select a class to view additional info! </p>
            {allClasses && teacherNames && (
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 550 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Class Name</b></TableCell>
                      <TableCell align="left"><b>Teacher</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allClasses &&
                      allClasses.map((eachClass) => (
                        <TableRow
                          key={eachClass.id}
                          onClick={() => handleClassClick(eachClass)}
                        >
                          <TableCell
                            component="th"
                            scope="row"
                            hover
                            sx={{
                              "&.MuiTableCell-root:hover": {
                                color: "blue",
                                cursor: "pointer",
                              },
                            }}
                          >
                            {eachClass.Name}
                          </TableCell>
                          <TableCell align="left">
                            {teacherNames[eachClass.Teacher] || "Loading..."}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        ) : (
          <>
            <IconButton
              variant="filled"
              onClick={() => {
                setClassSelected(false);
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            {thisClass && (
              <>
                <h1>{thisClass.Name} Class</h1>

                <div>
                  <h2>General Info</h2>
                  <p>Welcome students!</p>
                  <p>
                    <b>Start Time:</b> {thisClass.Start_time}
                    <br></br>
                    <b>End Time:</b> {thisClass.End_time}
                    <br></br>
                    <b>Teacher:</b>{" "}
                    {teacherNames[thisClass.Teacher] || "Loading..."}
                    <br></br>
                    <b>Average Grade:</b> {thisClass.Average_grade || "N/A"}
                  </p>
                </div>
              </>
            )}
            <div>
              <h2>Roster</h2>

            {students && (
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 550 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student First Name</TableCell>
                      <TableCell align="left">Student Last Name</TableCell>
                      <TableCell align="left">Grade</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students &&
                      students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell component="th" scope="row">
                            {student.First}
                          </TableCell>
                          <TableCell align="left">{student.Last}</TableCell>
                          <TableCell align="left">
                            {editGrade && editGradeIndex === student.id ? (
                              <>
                                <form onSubmit={(e) => handleSubmit(e, student.studentId, student.classId)}>
                                  <TextField
                                    type="text"
                                    defaultValue={studentGrades[student.id]}
                                    onChange={(e) => handleGradeChange(e)}
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                      style: { width: `80px` },
                                    }}
                                  ></TextField>
                                  <Button type="submit"> Submit</Button>
                                </form>
                              </>
                            ) : (
                              <>{student.grade}</>
                            )}

                            <IconButton
                              variant="filled"
                              onClick={() => {
                                setEditGrade(!editGrade);
                                setEditGradeIndex(student.id);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        </>
      )}
              {students && (
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 550 }} aria-label="simple table">
                    <TableHead>
                      <TableRow>
                        <TableCell><b>Student First Name</b></TableCell>
                        <TableCell align="left"><b>Student Last Name</b></TableCell>
                        <TableCell align="left"><b>Grade</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students &&
                        studentGrades &&
                        students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell component="th" scope="row">
                              {student.First}
                            </TableCell>
                            <TableCell align="left">{student.Last}</TableCell>
                            <TableCell align="left">
                              {editGrade && editGradeIndex === student.id ? (
                                <>
                                  <form
                                    onSubmit={(e) =>
                                      handleSubmit(e, student.id)
                                    }
                                  >
                                    <TextField
                                      type="text"
                                      defaultValue={studentGrades[student.id]}
                                      onChange={(e) => handleGradeChange(e)}
                                      variant="outlined"
                                      size="small"
                                      InputProps={{
                                        style: { width: `80px` },
                                      }}
                                    ></TextField>
                                    <Button type="submit"> Submit</Button>
                                    <IconButton
                                      variant="filled"
                                      onClick={() => {
                                        setEditGrade(!editGrade);
                                        setEditGradeIndex(student.id);
                                      }}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </form>
                                </>
                              ) : (
                                <>
                                  {studentGrades[student.id]}
                                  <IconButton
                                    variant="filled"
                                    onClick={() => {
                                      setEditGrade(!editGrade);
                                      setEditGradeIndex(student.id);
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </div>
          </>
        )}
      </Card>
    </>
  );
};

export default Classes;
