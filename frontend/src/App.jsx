import { useState } from 'react'
import { AppBar, Toolbar, Typography, Container, Box, Tabs, Tab, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ApartmentIcon from '@mui/icons-material/Apartment';
import StudentList from './components/StudentList'
import DormitoryList from './components/DormitoryList'

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

  const handleChange = (event, newValue) => {
    setView(newValue);
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
          </Tabs>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {view === 0 ? <StudentList /> : <DormitoryList />}
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App
