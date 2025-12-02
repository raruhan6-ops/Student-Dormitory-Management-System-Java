import { useState } from 'react'
import { AppBar, Toolbar, Typography, Container, Box, Tabs, Tab, CssBaseline, ThemeProvider, createTheme, Snackbar, Alert, Button, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BuildIcon from '@mui/icons-material/Build';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import StudentList from './components/StudentList'
import DormitoryList from './components/DormitoryList'
import RepairRequestList from './components/RepairRequestList'
import MyDorm from './components/MyDorm'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import DashboardIcon from '@mui/icons-material/Dashboard';
import axios from 'axios';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Change Password Dialog state
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  const handleChange = (event, newValue) => {
    setView(newValue);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setView(0); // Reset view on login
    showNotification(`Welcome back, ${userData.username}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    setView(0);
    setAnchorEl(null);
    showNotification('Logged out successfully.', 'info');
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenPasswordDialog = () => {
    handleCloseMenu();
    setOpenPasswordDialog(true);
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification("New passwords do not match", "error");
      return;
    }
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      showNotification("Please fill in all fields", "error");
      return;
    }

    try {
      await axios.post('/api/auth/change-password', {
        username: user.username,
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      showNotification("Password changed successfully", "success");
      handleClosePasswordDialog();
    } catch (error) {
      console.error("Change password error", error);
      showNotification(error.response?.data || "Failed to change password", "error");
    }
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  // Define tabs based on role
  const getTabs = () => {
    if (!user) return [];
    const tabs = [];

    if (user.role === 'Student') {
      tabs.push({ label: "My Dorm", icon: <ApartmentIcon />, component: <MyDorm user={user} showNotification={showNotification} /> });
    } else {
      // Manager Dashboard
      tabs.push({ label: "Dashboard", icon: <DashboardIcon />, component: <Dashboard showNotification={showNotification} /> });
      tabs.push({ label: "Student List", icon: <SchoolIcon />, component: <StudentList showNotification={showNotification} /> });
    }

    if (user.role === 'DormManager' || user.role === 'Admin') {
      tabs.push({ label: "Dormitory Management", icon: <ApartmentIcon />, component: <DormitoryList showNotification={showNotification} /> });
    }

    tabs.push({ label: "Repair Requests", icon: <BuildIcon />, component: <RepairRequestList showNotification={showNotification} user={user} /> });

    return tabs;
  };

  const currentTabs = getTabs();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <SchoolIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Student Dormitory Management System
            </Typography>
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button 
                    color="inherit" 
                    startIcon={<AccountCircleIcon />} 
                    onClick={handleMenu}
                >
                  {user.username} ({user.role})
                </Button>
                <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleCloseMenu}
                >
                    <MenuItem onClick={handleOpenPasswordDialog}>Change Password</MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </Box>
            )}
          </Toolbar>
          {user && (
            <Tabs value={view} onChange={handleChange} textColor="inherit" indicatorColor="secondary" centered>
              {currentTabs.map((tab, index) => (
                <Tab key={index} icon={tab.icon} label={tab.label} />
              ))}
            </Tabs>
          )}
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {!user ? (
            <Login onLogin={handleLogin} />
          ) : (
            currentTabs[view] && currentTabs[view].component
          )}
        </Container>

        {/* Change Password Dialog */}
        <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog}>
            <DialogTitle>Change Password</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Old Password"
                    type="password"
                    fullWidth
                    variant="outlined"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                />
                <TextField
                    margin="dense"
                    label="New Password"
                    type="password"
                    fullWidth
                    variant="outlined"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                />
                <TextField
                    margin="dense"
                    label="Confirm New Password"
                    type="password"
                    fullWidth
                    variant="outlined"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClosePasswordDialog}>Cancel</Button>
                <Button onClick={handleChangePassword} variant="contained">Change</Button>
            </DialogActions>
        </Dialog>

        <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification}>
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}

export default App
