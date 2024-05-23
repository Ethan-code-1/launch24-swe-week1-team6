import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "../styles/Teachers.css";

const Teachers = () => {
  const [allTeachers, setAllTeachers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTeacher, setEditedTeacher] = useState({});

  const fetchTeachers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'teachers'));
      const teachersList = querySnapshot.docs.map(doc => ({
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

  const handleSearch = (e) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);

    if (searchValue === '') {
      setTeachers(allTeachers);
    } else {
      const filteredTeachers = allTeachers.filter(teacher =>
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
      const teacherRef = doc(db, 'teachers', selectedTeacher.id);
      await updateDoc(teacherRef, editedTeacher);
      setSelectedTeacher(editedTeacher);
      setIsEditing(false);

      const updatedTeachers = teachers.map(teacher =>
        teacher.id === editedTeacher.id ? editedTeacher : teacher
      );
      setTeachers(updatedTeachers);
      setAllTeachers(updatedTeachers);
    } catch (error) {
      console.error("Error updating teacher data: ", error);
    }
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
      <hr></hr>
      <div className="main-wrapper">
        <div className="left-panel">
          <h1>All Teachers</h1>
          <p>Browse through the list of all teachers</p>

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
              <div className="teacher-item" key={teacher.id} onClick={() => handleTeacherClick(teacher)}>
                <div className="teacher-avatar"></div>
                <div className="teacher-info">
                  <p className="teacher-name">{teacher.First} {teacher.Last}</p>
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
              <div className="teacher-avatar-large"></div>
              <h3>{selectedTeacher.First} {selectedTeacher.Last}</h3>
              <div className="teacher-contact">
                <h4>Contact Information</h4>
                {isEditing ? (
                  <div>
                    <label>Office Tel: </label>
                    <input type="text" name="OfficeTel" value={editedTeacher.OfficeTel || ''} onChange={handleInputChange} /><br/>
                    <label>Mobile: </label>
                    <input type="text" name="Mobile" value={editedTeacher.Mobile || ''} onChange={handleInputChange} /><br/>
                    <label>Email: </label>
                    <input type="text" name="Email" value={editedTeacher.Email || ''} onChange={handleInputChange} />
                  </div>
                ) : (
                  <div>
                    <p>Office Tel: {selectedTeacher.OfficeTel || 'N/A'}</p>
                    <p>Mobile: {selectedTeacher.Mobile || 'N/A'}</p>
                    <p>Email: {selectedTeacher.Email || 'N/A'}</p>
                  </div>
                )}
              </div>
              <div className="teacher-work">
                <h4>Work Information</h4>
                {isEditing ? (
                  <div>
                    <label>Department: </label>
                    <input type="text" name="Subject" value={editedTeacher.Subject} onChange={handleInputChange} /><br/>
                    <label>Supervisor: </label>
                    <input type="text" name="Supervisor" value={editedTeacher.Supervisor || ''} onChange={handleInputChange} />
                  </div>
                ) : (
                  <div>
                    <p>Department: {selectedTeacher.Subject}</p>
                    <p>Supervisor: {selectedTeacher.Supervisor || 'N/A'}</p>
                  </div>
                )}
              </div>
              <div className="teacher-personal">
                <h4>Personal Information</h4>
                {isEditing ? (
                  <div>
                    <label>Pronouns: </label>
                    <input type="text" name="Pronouns" value={editedTeacher.Pronouns || ''} onChange={handleInputChange} /><br/>
                    <label>Birthday: </label>
                    <input type="text" name="Birthday" value={editedTeacher.Birthday || ''} onChange={handleInputChange} /><br/>
                    <label>City: </label>
                    <input type="text" name="City" value={editedTeacher.City || ''} onChange={handleInputChange} />
                  </div>
                ) : (
                  <div>
                    <p>Pronouns: {selectedTeacher.Pronouns || 'N/A'}</p>
                    <p>Birthday: {selectedTeacher.Birthday || 'N/A'}</p>
                    <p>City: {selectedTeacher.City || 'N/A'}</p>
                  </div>
                )}
              </div>
              {isEditing ? (
                <button onClick={handleSaveClick}>Save</button>
              ) : (
                <button onClick={handleEditClick}>Edit</button>
              )}
            </div>
          ) : (
            <p>Select a teacher to see more details</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Teachers;
