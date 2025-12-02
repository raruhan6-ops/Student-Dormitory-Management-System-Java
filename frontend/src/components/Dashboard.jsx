import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Grid, Paper, Typography, Box, CircularProgress, Card, CardContent } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import HotelIcon from '@mui/icons-material/Hotel';
import BuildIcon from '@mui/icons-material/Build';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';

const StatCard = ({ title, value, icon, color }) => (
    <Card elevation={3} sx={{ height: '100%' }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: `${color}.light`, color: `${color}.main`, mr: 2 }}>
                    {icon}
                </Box>
                <Typography variant="h6" color="text.secondary">
                    {title}
                </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                {value}
            </Typography>
        </CardContent>
    </Card>
);

const Dashboard = ({ showNotification }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            showNotification('Failed to load dashboard statistics.', 'error');
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

    if (!stats) return null;

    const occupancyRate = stats.totalBeds > 0 
        ? ((stats.occupiedBeds / stats.totalBeds) * 100).toFixed(1) 
        : 0;

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
                Manager Dashboard
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard 
                        title="Total Students" 
                        value={stats.totalStudents} 
                        icon={<PeopleIcon fontSize="large" />} 
                        color="primary" 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard 
                        title="Occupancy Rate" 
                        value={`${occupancyRate}%`} 
                        icon={<HotelIcon fontSize="large" />} 
                        color="success" 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard 
                        title="Pending Repairs" 
                        value={stats.pendingRepairs} 
                        icon={<BuildIcon fontSize="large" />} 
                        color="warning" 
                    />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard 
                        title="Total Buildings" 
                        value={stats.totalBuildings} 
                        icon={<ApartmentIcon fontSize="large" />} 
                        color="info" 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard 
                        title="Total Rooms" 
                        value={stats.totalRooms} 
                        icon={<MeetingRoomIcon fontSize="large" />} 
                        color="secondary" 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard 
                        title="Total Beds" 
                        value={stats.totalBeds} 
                        icon={<HotelIcon fontSize="large" />} 
                        color="success" 
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
