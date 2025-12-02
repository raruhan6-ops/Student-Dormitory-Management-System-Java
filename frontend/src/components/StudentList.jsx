import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Paper, Typography, Box, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

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

const StudentList = ({ showNotification }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/students');
            // DataGrid needs a unique 'id' property. We can use studentID as id.
            const studentsWithId = response.data.map(s => ({ ...s, id: s.studentID }));
            setStudents(studentsWithId);
        } catch (error) {
            console.error('Error fetching students:', error);
            showNotification('Failed to fetch students. Please try again later.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student => {
        const term = searchTerm.toLowerCase();
        const idMatch = student.studentID ? student.studentID.toString().toLowerCase().includes(term) : false;
        const phoneMatch = student.phone ? student.phone.toString().toLowerCase().includes(term) : false;
        return idMatch || phoneMatch;
    });

    return (
        <Paper elevation={3} sx={{ p: 3, height: 650, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="div">
                    学生列表 (Student List)
                </Typography>
                <TextField 
                    variant="outlined" 
                    size="small" 
                    placeholder="Search by ID or Phone..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: 300 }}
                />
            </Box>
            <DataGrid
                rows={filteredStudents}
                columns={columns}
                loading={loading}
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
