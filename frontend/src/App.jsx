import { useState } from 'react'
import { AppBar, Toolbar, Typography, Container, Box, Tabs, Tab, CssBaseline, ThemeProvider, createTheme, Snackbar, Alert } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BuildIcon from '@mui/icons-material/Build';
import StudentList from './components/StudentList'
import DormitoryList from './components/DormitoryList'
import RepairRequestList from './components/RepairRequestList'

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
  const [view, setView] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const handleChange = (event, newValue) => {
    setView(newValue);
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
          </Toolbar>
          <Tabs value={view} onChange={handleChange} textColor="inherit" indicatorColor="secondary" centered>
            <Tab icon={<SchoolIcon />} label="Student List" />
            <Tab icon={<ApartmentIcon />} label="Dormitory Management" />
            <Tab icon={<BuildIcon />} label="Repair Requests" />
          </Tabs>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {view === 0 && <StudentList showNotification={showNotification} />}
          {view === 1 && <DormitoryList showNotification={showNotification} />}
          {view === 2 && <RepairRequestList showNotification={showNotification} />}
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
