import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, CircularProgress, Alert, Card, CardContent, Grid } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DormitoryList from './DormitoryList';

const MyDorm = ({ user, showNotification }) => {
    const [studentInfo, setStudentInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.relatedStudentID) {
            fetchStudentInfo();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchStudentInfo = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/students/${user.relatedStudentID}`);
            setStudentInfo(response.data);
        } catch (error) {
            console.error('Error fetching student info:', error);
            showNotification('Failed to fetch your dormitory information.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user || !user.relatedStudentID) {
        return <Alert severity="warning">Student information not found. Please contact administrator.</Alert>;
    }

    // Check if student has a bed assigned
    const hasRoom = studentInfo && studentInfo.bedNumber;

    if (hasRoom) {
        return (
            <Box sx={{ mt: 3 }}>
                <Typography variant="h5" gutterBottom>
                    My Dormitory
                </Typography>
                <Card elevation={3} sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <HomeIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" gutterBottom>
                            {studentInfo.dormBuilding}
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={6}>
                                <Typography variant="subtitle1" color="text.secondary">
                                    Room Number
                                </Typography>
                                <Typography variant="h6">
                                    {studentInfo.roomNumber}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle1" color="text.secondary">
                                    Bed Number
                                </Typography>
                                <Typography variant="h6">
                                    {studentInfo.bedNumber}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
                You have not booked a room yet. Please select a bed below to book.
            </Alert>
            <DormitoryList 
                showNotification={showNotification} 
                studentMode={true} 
                currentUser={user}
                onBookingSuccess={fetchStudentInfo}
            />
        </Box>
    );
};

export default MyDorm;
