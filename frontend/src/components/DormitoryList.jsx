import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Grid, Paper, Typography, List, ListItemButton, ListItemText, 
    ListItemAvatar, Avatar, Chip, Divider, Box, Alert 
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import HotelIcon from '@mui/icons-material/Hotel';

const DormitoryList = () => {
    const [buildings, setBuildings] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [beds, setBeds] = useState([]);

    useEffect(() => {
        fetchBuildings();
    }, []);

    const fetchBuildings = async () => {
        try {
            const response = await axios.get('/api/dormitories');
            setBuildings(response.data);
        } catch (error) {
            console.error('Error fetching buildings:', error);
        }
    };

    const handleBuildingClick = async (building) => {
        setSelectedBuilding(building);
        setSelectedRoom(null);
        setBeds([]);
        try {
            const response = await axios.get(`/api/dormitories/${building.buildingID}/rooms`);
            setRooms(response.data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const handleRoomClick = async (room) => {
        setSelectedRoom(room);
        try {
            const response = await axios.get(`/api/dormitories/rooms/${room.roomID}/beds`);
            setBeds(response.data);
        } catch (error) {
            console.error('Error fetching beds:', error);
        }
    };

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
                        </Box>
                        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                            {buildings.map(building => (
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
                    </Paper>
                </Grid>

                {/* Rooms List */}
                <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, bgcolor: 'secondary.main', color: 'white' }}>
                            <Typography variant="h6">房间 (Rooms)</Typography>
                        </Box>
                        {selectedBuilding ? (
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
