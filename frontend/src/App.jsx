import { useState } from 'react'
import { AppBar, Toolbar, Typography, Container, Box, Tabs, Tab, CssBaseline, ThemeProvider, createTheme, Snackbar, Alert, Button } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BuildIcon from '@mui/icons-material/Build';
import LogoutIcon from '@mui/icons-material/Logout';
import StudentList from './components/StudentList'
import DormitoryList from './components/DormitoryList'
import RepairRequestList from './components/RepairRequestList'
import Login from './components/Login'

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
    showNotification('Logged out successfully.', 'info');
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
    const tabs = [
      { label: "Student List", icon: <SchoolIcon />, component: <StudentList showNotification={showNotification} /> }
    ];

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
                <Typography variant="subtitle1" sx={{ mr: 2 }}>
                  {user.username} ({user.role})
                </Typography>
                <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
                  Logout
                </Button>
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
