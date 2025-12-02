import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, 
    DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LockResetIcon from '@mui/icons-material/LockReset';

const UserManagement = ({ showNotification }) => {
    const [users, setUsers] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'DormManager' });
    
    // Reset Password State
    const [openResetDialog, setOpenResetDialog] = useState(false);
    const [resetUser, setResetUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/auth/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            showNotification('Failed to fetch users.', 'error');
        }
    };

    const handleAddUser = async () => {
        if (!newUser.username || !newUser.password) {
            showNotification('Username and Password are required.', 'warning');
            return;
        }
        try {
            // We use the register endpoint but send the raw password which the backend hashes
            await axios.post('/api/auth/register', {
                username: newUser.username,
                passwordHash: newUser.password, // Backend expects raw password in this field for registration
                role: newUser.role
            });
            showNotification('User created successfully!', 'success');
            setOpenDialog(false);
            setNewUser({ username: '', password: '', role: 'DormManager' });
            fetchUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            showNotification(error.response?.data || 'Failed to create user.', 'error');
        }
    };

    const handleOpenReset = (user) => {
        setResetUser(user);
        setNewPassword('');
        setOpenResetDialog(true);
    };

    const handleResetPassword = async () => {
        if (!newPassword) {
            showNotification('Please enter a new password.', 'warning');
            return;
        }
        try {
            await axios.post('/api/auth/admin/reset-password', {
                username: resetUser.username,
                newPassword: newPassword
            });
            showNotification('Password reset successfully!', 'success');
            setOpenResetDialog(false);
        } catch (error) {
            console.error('Error resetting password:', error);
            showNotification('Failed to reset password.', 'error');
        }
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="div">
                    User Management (Admin)
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={() => setOpenDialog(true)}
                >
                    Create User
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="user table">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'primary.light' }}>
                            <TableCell sx={{ color: 'white' }}>ID</TableCell>
                            <TableCell sx={{ color: 'white' }}>Username</TableCell>
                            <TableCell sx={{ color: 'white' }}>Role</TableCell>
                            <TableCell sx={{ color: 'white' }}>Related Student ID</TableCell>
                            <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((row) => (
                            <TableRow key={row.userID}>
                                <TableCell>{row.userID}</TableCell>
                                <TableCell>{row.username}</TableCell>
                                <TableCell>{row.role}</TableCell>
                                <TableCell>{row.relatedStudentID || '-'}</TableCell>
                                <TableCell>
                                    <Tooltip title="Reset Password">
                                        <IconButton color="warning" onClick={() => handleOpenReset(row)}>
                                            <LockResetIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create User Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Create New User</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Username"
                        fullWidth
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Password"
                        type="password"
                        fullWidth
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={newUser.role}
                            label="Role"
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <MenuItem value="DormManager">Dorm Manager</MenuItem>
                            <MenuItem value="Admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddUser} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
                <DialogTitle>Reset Password for {resetUser?.username}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="New Password"
                        type="password"
                        fullWidth
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenResetDialog(false)}>Cancel</Button>
                    <Button onClick={handleResetPassword} variant="contained" color="warning">Reset</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement;
