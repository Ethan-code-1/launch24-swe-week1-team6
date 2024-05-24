import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import "../styles/Teachers.css";
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

const Teachers = () => {
  const [allTeachers, setAllTeachers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTeacher, setEditedTeacher] = useState({});

  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [First, setFirst] = useState("");
  const [Last, setLast] = useState("");
  const [Subject, setSubject] = useState("");
  const [allClasses, setAllClasses] = useState(null);
  const [noTeacherClasses, setNoTeacherClasses] = useState([]);
  const [Age, setAge] = useState("");

  const fetchTeachers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "teachers"));
      const teachersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllTeachers(teachersList);
      setTeachers(teachersList);
    } catch (error) {
      console.error("Error fetching teacher data: ", error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

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

  const fetchNoTeacherClasses = (allClasses) => {
    if(allClasses) {
      console.log("all classes in no teacher function", allClasses)
      const noTeacherClassObject = allClasses.filter(eachClass => 
        eachClass.Teacher === "")
      console.log("classes w no teachers object", noTeacherClassObject)
      
      const noTeacherClassesNames = []
      if(noTeacherClassObject) {
        noTeacherClassObject.forEach((eachClass) => noTeacherClassesNames.push(eachClass.Name))
      }
      console.log("list of class w no teachers", noTeacherClassesNames)

      setNoTeacherClasses(noTeacherClassesNames);
    }
  }

  useEffect(() => {
    fetchNoTeacherClasses(allClasses);
  }, [allClasses]);

  const handleSearch = (e) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);

    if (searchValue === "") {
      setTeachers(allTeachers);
    } else {
      const filteredTeachers = allTeachers.filter(
        (teacher) =>
          teacher.First.toLowerCase().includes(searchValue.toLowerCase()) ||
          teacher.Last.toLowerCase().includes(searchValue.toLowerCase())
      );
      setTeachers(filteredTeachers);
    }
  };

  const handleTeacherClick = (teacher) => {
    setSelectedTeacher(teacher);
    setEditedTeacher(teacher);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedTeacher({ ...editedTeacher, [name]: value });
  };

  const handleSaveClick = async () => {
    try {
      const teacherRef = doc(db, "teachers", selectedTeacher.id);
      await updateDoc(teacherRef, editedTeacher);
      setSelectedTeacher(editedTeacher);
      setIsEditing(false);

      const updatedTeachers = teachers.map((teacher) =>
        teacher.id === editedTeacher.id ? editedTeacher : teacher
      );
      setTeachers(updatedTeachers);
      setAllTeachers(updatedTeachers);
    } catch (error) {
      console.error("Error updating teacher data: ", error);
    }
  };

  const handleAddOption = () => {
    // Handle whether user wants to add a new student
    setIsAddingTeacher((prevState) => !prevState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!First || !Last || !Subject || !Age) {
      alert("Please fill in all fields");
      return;
    }

    const newTeacher = {
      First,
      Last,
      Subject,
      Age,
    };


    try {
      // ADD NEW TEACHER
      const docRef = await addDoc(collection(db, "teachers"), newTeacher);
      //console.log("Document written with ID: ", docRef.id);
      fetchTeachers();

      // Clear form fields after submission for better user experience
      setFirst("");
      setLast("");
      setSubject("");
      setAge("");
    } catch (error) {
      console.error("Error adding document: ", error);

      // UPDATE CLASS DATABASE
      // update corresponding class to new teacher
      const classesQuery = query(
        collection(db, "Classes"),
        where("Name", "==", Subject)
      );

      console.log(Subject);
  
      // Execute the query
      const querySnapshot = await getDocs(classesQuery);
  
      if (!querySnapshot.empty) {
        // Assuming there is only one document that matches the query
        const classesDoc = querySnapshot.docs[0];
        const classDocRef = doc(db, "Classes", classesDoc.id);
  
        // Update the grade field in the matched document
        await updateDoc(classDocRef, {
          Teacher: `${First} ${Last}`,
        });
      }
    }

    return;
  };

  return (
    <div>
      <div className="image-container">
        <img
          src="/homePageSchool.jpeg"
          alt="School Image"
          className="full-width-image"
        />
        <div className="overlay"></div>
        <h1 className="teacherScreenHeader">Teacher Directory</h1>
      </div>
      <hr className="homePageHr"></hr>
      <Card
        className="main-wrapper"
        sx={{ boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)" }}
      >
        <div className="left-panel">
          <h1>All Teachers</h1>
          <p>Browse through the list of all teachers</p>

          <div className="addTeacher-option" style={{ marginBottom: "40px" }}>
            <figcaption onClick={handleAddOption}>
              Can't find your teacher? {isAddingTeacher ? "▲" : "▼"}
            </figcaption>
            <br />
            {isAddingTeacher && (
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
                  <FormLabel>Subject</FormLabel>
                  <Select
                    value={Subject}
                    onChange={(e) => { setSubject(e.target.value) } }
                  >
                    <MenuItem value="">Select a Subject</MenuItem>
                    {noTeacherClasses.map((eachClass, index) => (
                      <MenuItem key={index} >
                        {eachClass}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Age"
                  value={Age}
                  onChange={(e) => setAge(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <Button
                  sx={{
                    background: "#147a7c",
                    "&:hover": { backgroundColor: "#0f5f60" },
                  }}
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  Add Teacher
                </Button>
              </form>
            )}
          </div>

          <div className="search">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="teacher-list">
            {teachers.map((teacher) => (
              <div
                className="teacher-item"
                key={teacher.id}
                onClick={() => handleTeacherClick(teacher)}
              >
                <img
                  src={teacher.photoURL || "/defaultAvatar.png"}
                  alt={`${teacher.First} ${teacher.Last}`}
                  className="teacher-avatar"
                />
                <div className="teacher-info">
                  <p className="teacher-name">
                    {teacher.First} {teacher.Last}
                  </p>
                  <p className="teacher-department">{teacher.Subject}</p>
                  <p className="teacher-phone">Age: {teacher.Age}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="right-panel">
          {selectedTeacher ? (
            <div className="teacher-detail">
              <img
                src={selectedTeacher.photoURL || "/defaultAvatar.png"}
                alt={`${selectedTeacher.First} ${selectedTeacher.Last}`}
                className="teacher-avatar-large"
              />
              <h3>
                {selectedTeacher.First} {selectedTeacher.Last}
              </h3>
              <div className="teacher-contact">
                <h4>Contact Information</h4>
                {isEditing ? (
                  <div>
                    <label>Office Tel: </label>
                    <input
                      type="text"
                      name="OfficeTel"
                      value={editedTeacher.OfficeTel || ""}
                      onChange={handleInputChange}
                    />
                    <br />
                    <label>Mobile: </label>
                    <input
                      type="text"
                      name="Mobile"
                      value={editedTeacher.Mobile || ""}
                      onChange={handleInputChange}
                    />
                    <br />
                    <label>Email: </label>
                    <input
                      type="text"
                      name="Email"
                      value={editedTeacher.Email || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <div>
                    <p>Office Tel: {selectedTeacher.OfficeTel || "N/A"}</p>
                    <p>Mobile: {selectedTeacher.Mobile || "N/A"}</p>
                    <p>Email: {selectedTeacher.Email || "N/A"}</p>
                  </div>
                )}
              </div>
              <div className="teacher-work">
                <h4>Work Information</h4>
                {isEditing ? (
                  <div>
                    <label>Department: </label>
                    <input
                      type="text"
                      name="Subject"
                      value={editedTeacher.Subject}
                      onChange={handleInputChange}
                    />
                    <br />
                    <label>Supervisor: </label>
                    <input
                      type="text"
                      name="Supervisor"
                      value={editedTeacher.Supervisor || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <div>
                    <p>Department: {selectedTeacher.Subject}</p>
                    <p>Supervisor: {selectedTeacher.Supervisor || "N/A"}</p>
                  </div>
                )}
              </div>
              <div className="teacher-personal">
                <h4>Personal Information</h4>
                {isEditing ? (
                  <div>
                    <label>Pronouns: </label>
                    <input
                      type="text"
                      name="Pronouns"
                      value={editedTeacher.Pronouns || ""}
                      onChange={handleInputChange}
                    />
                    <br />
                    <label>Birthday: </label>
                    <input
                      type="text"
                      name="Birthday"
                      value={editedTeacher.Birthday || ""}
                      onChange={handleInputChange}
                    />
                    <br />
                    <label>City: </label>
                    <input
                      type="text"
                      name="City"
                      value={editedTeacher.City || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <div>
                    <p>Pronouns: {selectedTeacher.Pronouns || "N/A"}</p>
                    <p>Birthday: {selectedTeacher.Birthday || "N/A"}</p>
                    <p>City: {selectedTeacher.City || "N/A"}</p>
                  </div>
                )}
              </div>
              {isEditing ? (
                <Button
                  sx={{
                    background: "#147a7c",
                    "&:hover": { backgroundColor: "#0f5f60" },
                  }}
                  onClick={handleSaveClick}
                  variant="contained"
                >
                  Save
                </Button>
              ) : (
                <Button
                  sx={{
                    background: "#147a7c",
                    "&:hover": { backgroundColor: "#0f5f60" },
                  }}
                  onClick={handleEditClick}
                  variant="contained"
                >
                  Edit
                </Button>
              )}
            </div>
          ) : (
            <p>Select a teacher to see more details</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Teachers;
