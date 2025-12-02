import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DataGrid, GridToolbar, GridActionsCellItem } from '@mui/x-data-grid';
import { 
    Paper, Typography, Box, TextField, InputAdornment, Button, 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    FormControl, InputLabel, Select, MenuItem, Grid 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const StudentList = ({ showNotification }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentStudent, setCurrentStudent] = useState({
        studentID: '', name: '', gender: '', major: '', studentClass: '',
        enrollmentYear: new Date().getFullYear(), phone: '', 
        dormBuilding: '', roomNumber: '', bedNumber: ''
    });

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
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => handleOpenEdit(params.row)}
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => handleDelete(params.id)}
                />,
            ],
        },
    ];

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/students');
            const studentsWithId = response.data.map(s => ({ ...s, id: s.studentID }));
            setStudents(studentsWithId);
        } catch (error) {
            console.error('Error fetching students:', error);
            showNotification('Failed to fetch students.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setIsEdit(false);
        setCurrentStudent({
            studentID: '', name: '', gender: '', major: '', studentClass: '',
            enrollmentYear: new Date().getFullYear(), phone: '', 
            dormBuilding: '', roomNumber: '', bedNumber: ''
        });
        setOpenDialog(true);
    };

    const handleOpenEdit = (student) => {
        setIsEdit(true);
        setCurrentStudent(student);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentStudent({ ...currentStudent, [name]: value });
    };

    const handleSave = async () => {
        try {
            if (isEdit) {
                await axios.put(`/api/students/${currentStudent.studentID}`, currentStudent);
                showNotification('Student updated successfully!', 'success');
            } else {
                await axios.post('/api/students', currentStudent);
                showNotification('Student added successfully!', 'success');
            }
            fetchStudents();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving student:', error);
            showNotification('Failed to save student.', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await axios.delete(`/api/students/${id}`);
                showNotification('Student deleted successfully!', 'success');
                fetchStudents();
            } catch (error) {
                console.error('Error deleting student:', error);
                showNotification('Failed to delete student.', 'error');
            }
        }
    };

    const filteredStudents = students.filter(student => {
        const term = searchTerm.toLowerCase();
        const idMatch = student.studentID ? student.studentID.toString().toLowerCase().includes(term) : false;
        const nameMatch = student.name ? student.name.toLowerCase().includes(term) : false;
        const classMatch = student.studentClass ? student.studentClass.toLowerCase().includes(term) : false;
        const majorMatch = student.major ? student.major.toLowerCase().includes(term) : false;
        const phoneMatch = student.phone ? student.phone.toString().toLowerCase().includes(term) : false;
        return idMatch || nameMatch || classMatch || majorMatch || phoneMatch;
    });

    return (
        <Paper elevation={3} sx={{ p: 3, height: 650, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="div">
                    学生列表 (Student List)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField 
                        variant="outlined" 
                        size="small" 
                        placeholder="Search by ID, Name, Class..." 
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
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
                        Add Student
                    </Button>
                </Box>
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

            {/* Add/Edit Student Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{isEdit ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <TextField
                                name="studentID"
                                label="Student ID"
                                fullWidth
                                value={currentStudent.studentID}
                                onChange={handleInputChange}
                                disabled={isEdit} // ID cannot be changed when editing
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="name"
                                label="Name"
                                fullWidth
                                value={currentStudent.name}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Gender</InputLabel>
                                <Select
                                    name="gender"
                                    value={currentStudent.gender}
                                    label="Gender"
                                    onChange={handleInputChange}
                                >
                                    <MenuItem value="Male">Male</MenuItem>
                                    <MenuItem value="Female">Female</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="major"
                                label="Major"
                                fullWidth
                                value={currentStudent.major}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="studentClass"
                                label="Class"
                                fullWidth
                                value={currentStudent.studentClass}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="enrollmentYear"
                                label="Enrollment Year"
                                type="number"
                                fullWidth
                                value={currentStudent.enrollmentYear}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="phone"
                                label="Phone"
                                fullWidth
                                value={currentStudent.phone}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Dormitory Info (Optional)</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                name="dormBuilding"
                                label="Building"
                                fullWidth
                                value={currentStudent.dormBuilding}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                name="roomNumber"
                                label="Room"
                                fullWidth
                                value={currentStudent.roomNumber}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                name="bedNumber"
                                label="Bed"
                                fullWidth
                                value={currentStudent.bedNumber}
                                onChange={handleInputChange}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default StudentList;
