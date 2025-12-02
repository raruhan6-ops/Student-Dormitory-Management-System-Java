import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Paper, Typography } from '@mui/material';

const columns = [
  { field: 'studentID', headerName: '学号 (ID)', width: 130 },
  { field: 'name', headerName: '姓名 (Name)', width: 130 },
  { field: 'gender', headerName: '性别 (Gender)', width: 90 },
  { field: 'major', headerName: '专业 (Major)', width: 150 },
  { field: 'studentClass', headerName: '班级 (Class)', width: 120 },
  { field: 'enrollmentYear', headerName: '入学年份 (Year)', width: 130, type: 'number' },
  { field: 'phone', headerName: '手机号 (Phone)', width: 150 },
  { field: 'dormBuilding', headerName: '宿舍楼 (Building)', width: 150 },
  { field: 'roomNumber', headerName: '房间 (Room)', width: 100 },
  { field: 'bedNumber', headerName: '床位 (Bed)', width: 100 },
];

const StudentList = () => {
    const [students, setStudents] = useState([]);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await axios.get('/api/students');
            // DataGrid needs a unique 'id' property. We can use studentID as id.
            const studentsWithId = response.data.map(s => ({ ...s, id: s.studentID }));
            setStudents(studentsWithId);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, height: 650, width: '100%' }}>
            <Typography variant="h5" gutterBottom component="div" sx={{ mb: 2 }}>
                学生列表 (Student List)
            </Typography>
            <DataGrid
                rows={students}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                }}
                pageSizeOptions={[5, 10, 25, 50]}
                checkboxSelection
                slots={{ toolbar: GridToolbar }}
                disableRowSelectionOnClick
            />
        </Paper>
    );
};

export default StudentList;
