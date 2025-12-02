import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentList = () => {
    const [students, setStudents] = useState([]);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await axios.get('/api/students');
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    return (
        <div>
            <h2>Student List</h2>
            <table>
                <thead>
                    <tr>
                        <th>学号</th>
                        <th>姓名</th>
                        <th>性别</th>
                        <th>专业</th>
                        <th>班级</th>
                        <th>入学年份</th>
                        <th>手机号</th>
                        <th>宿舍楼</th>
                        <th>房间号</th>
                        <th>床位号</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => (
                        <tr key={student.studentID}>
                            <td>{student.studentID}</td>
                            <td>{student.name}</td>
                            <td>{student.gender}</td>
                            <td>{student.major}</td>
                            <td>{student.studentClass}</td>
                            <td>{student.enrollmentYear}</td>
                            <td>{student.phone}</td>
                            <td>{student.dormBuilding}</td>
                            <td>{student.roomNumber}</td>
                            <td>{student.bedNumber}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StudentList;
