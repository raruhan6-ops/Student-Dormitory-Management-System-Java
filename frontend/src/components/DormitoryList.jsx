import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Grid, Paper, Typography, List, ListItemButton, ListItemText, 
    ListItemAvatar, Avatar, Chip, Divider, Box, Alert, CircularProgress, 
    TextField, InputAdornment, IconButton, Button, Dialog, DialogTitle, 
    DialogContent, DialogActions 
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import HotelIcon from '@mui/icons-material/Hotel';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

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

    // Dialog States
    const [openBuildingDialog, setOpenBuildingDialog] = useState(false);
    const [newBuilding, setNewBuilding] = useState({ buildingName: '', location: '', managerName: '', managerPhone: '' });

    const [openRoomDialog, setOpenRoomDialog] = useState(false);
    const [newRoom, setNewRoom] = useState({ roomNumber: '', capacity: 4, roomType: 'Standard' });

    // Check-In/Out States
    const [openCheckInDialog, setOpenCheckInDialog] = useState(false);
    const [checkInStudentId, setCheckInStudentId] = useState('');
    const [selectedBedForAction, setSelectedBedForAction] = useState(null);

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

    // --- Building Management ---
    const handleAddBuilding = async () => {
        try {
            await axios.post('/api/dormitories', newBuilding);
            showNotification('Building added successfully!', 'success');
            setOpenBuildingDialog(false);
            setNewBuilding({ buildingName: '', location: '', managerName: '', managerPhone: '' });
            fetchBuildings();
        } catch (error) {
            console.error('Error adding building:', error);
            showNotification('Failed to add building.', 'error');
        }
    };

    // --- Room Management ---
    const handleAddRoom = async () => {
        if (!selectedBuilding) return;
        try {
            await axios.post(`/api/dormitories/${selectedBuilding.buildingID}/rooms`, newRoom);
            showNotification('Room added successfully!', 'success');
            setOpenRoomDialog(false);
            setNewRoom({ roomNumber: '', capacity: 4, roomType: 'Standard' });
            // Refresh rooms
            handleBuildingClick(selectedBuilding);
        } catch (error) {
            console.error('Error adding room:', error);
            showNotification('Failed to add room.', 'error');
        }
    };

    // --- Check-In / Check-Out ---
    const handleOpenCheckIn = (bed) => {
        setSelectedBedForAction(bed);
        setCheckInStudentId('');
        setOpenCheckInDialog(true);
    };

    const handleCheckIn = async () => {
        if (!checkInStudentId || !selectedBedForAction) return;
        try {
            await axios.post('/api/dormitories/check-in', {
                studentID: checkInStudentId,
                bedID: selectedBedForAction.bedID
            });
            showNotification('Check-in successful!', 'success');
            setOpenCheckInDialog(false);
            // Refresh beds
            handleRoomClick(selectedRoom);
        } catch (error) {
            console.error('Error checking in:', error);
            showNotification(error.response?.data || 'Failed to check in.', 'error');
        }
    };

    const handleCheckOut = async (bed) => {
        if (!window.confirm(`Are you sure you want to check out ${bed.studentName}?`)) return;
        try {
            await axios.post(`/api/dormitories/check-out/${bed.studentID}`);
            showNotification('Check-out successful!', 'success');
            // Refresh beds
            handleRoomClick(selectedRoom);
        } catch (error) {
            console.error('Error checking out:', error);
            showNotification(error.response?.data || 'Failed to check out.', 'error');
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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">宿舍楼 (Buildings)</Typography>
                                <IconButton size="small" sx={{ color: 'white' }} onClick={() => setOpenBuildingDialog(true)}>
                                    <AddIcon />
                                </IconButton>
                            </Box>
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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">房间 (Rooms)</Typography>
                                {selectedBuilding && (
                                    <IconButton size="small" sx={{ color: 'white' }} onClick={() => setOpenRoomDialog(true)}>
                                        <AddIcon />
                                    </IconButton>
                                )}
                            </Box>
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
                                                    sx={{ mr: 1 }}
                                                />
                                                {bed.status === 'Available' ? (
                                                    <Button size="small" variant="outlined" onClick={() => handleOpenCheckIn(bed)}>
                                                        Check In
                                                    </Button>
                                                ) : (
                                                    <Button size="small" variant="outlined" color="error" onClick={() => handleCheckOut(bed)}>
                                                        Check Out
                                                    </Button>
                                                )}
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

            {/* Add Building Dialog */}
            <Dialog open={openBuildingDialog} onClose={() => setOpenBuildingDialog(false)}>
                <DialogTitle>Add New Building</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Building Name"
                        fullWidth
                        value={newBuilding.buildingName}
                        onChange={(e) => setNewBuilding({ ...newBuilding, buildingName: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Location"
                        fullWidth
                        value={newBuilding.location}
                        onChange={(e) => setNewBuilding({ ...newBuilding, location: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Manager Name"
                        fullWidth
                        value={newBuilding.managerName}
                        onChange={(e) => setNewBuilding({ ...newBuilding, managerName: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Manager Phone"
                        fullWidth
                        value={newBuilding.managerPhone}
                        onChange={(e) => setNewBuilding({ ...newBuilding, managerPhone: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBuildingDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddBuilding} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>

            {/* Add Room Dialog */}
            <Dialog open={openRoomDialog} onClose={() => setOpenRoomDialog(false)}>
                <DialogTitle>Add New Room</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Room Number"
                        fullWidth
                        value={newRoom.roomNumber}
                        onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Capacity"
                        type="number"
                        fullWidth
                        value={newRoom.capacity}
                        onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Room Type"
                        fullWidth
                        value={newRoom.roomType}
                        onChange={(e) => setNewRoom({ ...newRoom, roomType: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRoomDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddRoom} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>

            {/* Check-In Dialog */}
            <Dialog open={openCheckInDialog} onClose={() => setOpenCheckInDialog(false)}>
                <DialogTitle>Check In Student</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Student ID"
                        fullWidth
                        value={checkInStudentId}
                        onChange={(e) => setCheckInStudentId(e.target.value)}
                        helperText="Enter the ID of the student to assign to this bed."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCheckInDialog(false)}>Cancel</Button>
                    <Button onClick={handleCheckIn} variant="contained" color="primary">Check In</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DormitoryList;
