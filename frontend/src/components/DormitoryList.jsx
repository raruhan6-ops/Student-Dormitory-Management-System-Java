import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Grid, Paper, Typography, List, ListItemButton, ListItemText, 
    ListItemAvatar, Avatar, Chip, Divider, Box, Alert, CircularProgress, TextField, InputAdornment
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import HotelIcon from '@mui/icons-material/Hotel';
import SearchIcon from '@mui/icons-material/Search';

const DormitoryList = ({ showNotification }) => {
    const [buildings, setBuildings] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [beds, setBeds] = useState([]);
    
    const [loadingBuildings, setLoadingBuildings] = useState(false);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [loadingBeds, setLoadingBeds] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBuildings();
    }, []);

    const fetchBuildings = async () => {
        setLoadingBuildings(true);
        try {
            const response = await axios.get('/api/dormitories');
            setBuildings(response.data);
        } catch (error) {
            console.error('Error fetching buildings:', error);
            showNotification('Failed to fetch buildings.', 'error');
        } finally {
            setLoadingBuildings(false);
        }
    };

    const handleBuildingClick = async (building) => {
        setSelectedBuilding(building);
        setSelectedRoom(null);
        setBeds([]);
        setLoadingRooms(true);
        try {
            const response = await axios.get(`/api/dormitories/${building.buildingID}/rooms`);
            setRooms(response.data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
            showNotification('Failed to fetch rooms.', 'error');
        } finally {
            setLoadingRooms(false);
        }
    };

    const handleRoomClick = async (room) => {
        setSelectedRoom(room);
        setLoadingBeds(true);
        try {
            const response = await axios.get(`/api/dormitories/rooms/${room.roomID}/beds`);
            setBeds(response.data);
        } catch (error) {
            console.error('Error fetching beds:', error);
            showNotification('Failed to fetch beds.', 'error');
        } finally {
            setLoadingBeds(false);
        }
    };

    const filteredBuildings = buildings.filter(building => 
        building.buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        building.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" gutterBottom component="div" sx={{ mb: 3 }}>
                宿舍楼管理 (Dormitory Management)
            </Typography>
            <Grid container spacing={3} sx={{ height: '70vh' }}>
                {/* Buildings List */}
                <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                            <Typography variant="h6">宿舍楼 (Buildings)</Typography>
                            <TextField 
                                fullWidth 
                                variant="outlined" 
                                size="small" 
                                placeholder="Search buildings..." 
                                sx={{ mt: 1, bgcolor: 'white', borderRadius: 1 }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                        {loadingBuildings ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                                {filteredBuildings.map(building => (
                                    <React.Fragment key={building.buildingID}>
                                        <ListItemButton 
                                            selected={selectedBuilding?.buildingID === building.buildingID}
                                            onClick={() => handleBuildingClick(building)}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'primary.light' }}>
                                                    <ApartmentIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText 
                                                primary={building.buildingName} 
                                                secondary={building.location} 
                                            />
                                        </ListItemButton>
                                        <Divider variant="inset" component="li" />
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>

                {/* Rooms List */}
                <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, bgcolor: 'secondary.main', color: 'white' }}>
                            <Typography variant="h6">房间 (Rooms)</Typography>
                        </Box>
                        {selectedBuilding ? (
                            loadingRooms ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress color="secondary" />
                                </Box>
                            ) : (
                                <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                                    {rooms.map(room => (
                                        <React.Fragment key={room.roomID}>
                                            <ListItemButton 
                                                selected={selectedRoom?.roomID === room.roomID}
                                                onClick={() => handleRoomClick(room)}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: 'secondary.light' }}>
                                                        <MeetingRoomIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText 
                                                    primary={`Room ${room.roomNumber}`} 
                                                    secondary={`Occupancy: ${room.currentOccupancy}/${room.capacity}`} 
                                                />
                                                <Chip 
                                                    label={room.roomType} 
                                                    size="small" 
                                                    variant="outlined" 
                                                    color="default" 
                                                />
                                            </ListItemButton>
                                            <Divider variant="inset" component="li" />
                                        </React.Fragment>
                                    ))}
                                </List>
                            )
                        ) : (
                            <Box sx={{ p: 3 }}>
                                <Alert severity="info">Please select a building to view rooms.</Alert>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Beds List */}
                <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, bgcolor: 'success.main', color: 'white' }}>
                            <Typography variant="h6">床位 (Beds)</Typography>
                        </Box>
                        {selectedRoom ? (
                            loadingBeds ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress color="success" />
                                </Box>
                            ) : (
                                <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                                    {beds.map(bed => (
                                        <React.Fragment key={bed.bedID}>
                                            <ListItemButton>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: bed.status === 'Occupied' ? 'error.light' : 'success.light' }}>
                                                        <HotelIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText 
                                                    primary={`Bed ${bed.bedNumber}`} 
                                                    secondary={
                                                        bed.status === 'Occupied' 
                                                        ? `Occupied by: ${bed.studentName || 'Unknown'} (${bed.studentID || 'N/A'})`
                                                        : 'Available'
                                                    }
                                                />
                                                <Chip 
                                                    label={bed.status} 
                                                    color={bed.status === 'Occupied' ? 'error' : 'success'} 
                                                    size="small" 
                                                />
                                            </ListItemButton>
                                            <Divider variant="inset" component="li" />
                                        </React.Fragment>
                                    ))}
                                </List>
                            )
                        ) : (
                            <Box sx={{ p: 3 }}>
                                <Alert severity="info">Please select a room to view beds.</Alert>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DormitoryList;
