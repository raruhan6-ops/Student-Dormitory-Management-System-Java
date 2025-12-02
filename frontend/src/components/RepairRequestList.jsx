import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, 
    DialogActions, TextField, Chip, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';

const RepairRequestList = ({ showNotification, user }) => {
    const [requests, setRequests] = useState([]);
    const [filterStatus, setFilterStatus] = useState('All');
    const [openDialog, setOpenDialog] = useState(false);
    const [newRequest, setNewRequest] = useState({
        roomID: '',
        submitterStudentID: user?.relatedStudentID || '',
        description: ''
    });

    useEffect(() => {
        fetchRequests();
    }, [user]);

    const fetchRequests = async () => {
        try {
            let url = '/api/repairs';
            if (user && user.role === 'Student' && user.relatedStudentID) {
                url = `/api/repairs/student/${user.relatedStudentID}`;
            }
            const response = await axios.get(url);
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching repair requests:', error);
            showNotification('Failed to fetch repair requests.', 'error');
        }
    };

    const filteredRequests = requests.filter(req => {
        if (filterStatus === 'All') return true;
        return req.status === filterStatus;
    });

    const handleSubmit = async () => {
        if (!newRequest.roomID || !newRequest.submitterStudentID || !newRequest.description) {
            showNotification('Please fill in all fields.', 'warning');
            return;
        }
        try {
            await axios.post('/api/repairs', newRequest);
            showNotification('Repair request submitted successfully!', 'success');
            setOpenDialog(false);
            setNewRequest({ roomID: '', submitterStudentID: user?.relatedStudentID || '', description: '' });
            fetchRequests();
        } catch (error) {
            console.error('Error submitting request:', error);
            showNotification('Failed to submit request.', 'error');
        }
    };

    const handleComplete = async (id) => {
        try {
            await axios.put(`/api/repairs/${id}`, {
                status: 'Finished',
                handler: user?.username || 'Manager'
            });
            showNotification('Request marked as finished!', 'success');
            fetchRequests();
        } catch (error) {
            console.error('Error updating request:', error);
            showNotification('Failed to update request.', 'error');
        }
    };

    const handleOpenDialog = () => {
        setNewRequest({
            ...newRequest,
            submitterStudentID: user?.relatedStudentID || ''
        });
        setOpenDialog(true);
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="div">
                    报修管理 (Repair Requests)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filterStatus}
                            label="Status"
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value="All">All</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Finished">Finished</MenuItem>
                        </Select>
                    </FormControl>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />} 
                        onClick={handleOpenDialog}
                    >
                        Submit Request
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="repair requests table">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'primary.light' }}>
                            <TableCell sx={{ color: 'white' }}>ID</TableCell>
                            <TableCell sx={{ color: 'white' }}>Room ID</TableCell>
                            <TableCell sx={{ color: 'white' }}>Student ID</TableCell>
                            <TableCell sx={{ color: 'white' }}>Description</TableCell>
                            <TableCell sx={{ color: 'white' }}>Submit Time</TableCell>
                            <TableCell sx={{ color: 'white' }}>Status</TableCell>
                            <TableCell sx={{ color: 'white' }}>Handler</TableCell>
                            <TableCell sx={{ color: 'white' }}>Finish Time</TableCell>
                            <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRequests.map((row) => (
                            <TableRow key={row.repairID}>
                                <TableCell>{row.repairID}</TableCell>
                                <TableCell>{row.roomID}</TableCell>
                                <TableCell>{row.submitterStudentID}</TableCell>
                                <TableCell>{row.description}</TableCell>
                                <TableCell>{new Date(row.submitTime).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={row.status} 
                                        color={row.status === 'Finished' ? 'success' : 'warning'} 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell>{row.handler || '-'}</TableCell>
                                <TableCell>{row.finishTime ? new Date(row.finishTime).toLocaleString() : '-'}</TableCell>
                                <TableCell>
                                    {row.status === 'Pending' && user?.role !== 'Student' && (
                                        <Tooltip title="Mark as Finished">
                                            <IconButton color="success" onClick={() => handleComplete(row.repairID)}>
                                                <CheckCircleIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {requests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    No repair requests found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Submit Repair Request</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Room ID"
                        type="number"
                        fullWidth
                        value={newRequest.roomID}
                        onChange={(e) => setNewRequest({ ...newRequest, roomID: e.target.value })}
                        helperText="Enter the internal Room ID (e.g., 1, 2...)"
                    />
                    <TextField
                        margin="dense"
                        label="Student ID"
                        fullWidth
                        value={newRequest.submitterStudentID}
                        onChange={(e) => setNewRequest({ ...newRequest, submitterStudentID: e.target.value })}
                        disabled={user?.role === 'Student'}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={4}
                        value={newRequest.description}
                        onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">Submit</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RepairRequestList;
