import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Paper, Typography, TextField, Button, Alert, Container, Avatar, Grid 
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [captcha, setCaptcha] = useState({ id: '', image: '' });
    const [captchaText, setCaptchaText] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const fetchCaptcha = async () => {
        try {
            const res = await axios.get('/api/auth/captcha');
            setCaptcha({ id: res.data.captchaId, image: res.data.imageBase64 });
            setCaptchaText('');
        } catch (err) {
            console.error("Captcha error", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post('/api/auth/login', { 
                username, 
                password,
                captchaId: captcha.id,
                captchaText 
            });
            onLogin(response.data);
        } catch (err) {
            console.error('Login failed:', err);
            setError(err.response?.data || 'Login failed. Please check your credentials.');
            fetchCaptcha(); // Refresh captcha on failure
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username / Student ID"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    
                    {/* Captcha Section */}
                    <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <TextField
                                required
                                fullWidth
                                name="captcha"
                                label="Verification Code"
                                value={captchaText}
                                onChange={(e) => setCaptchaText(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            {captcha.image && (
                                <img 
                                    src={captcha.image} 
                                    alt="captcha" 
                                    style={{ width: '100%', height: '56px', objectFit: 'cover', cursor: 'pointer' }} 
                                    onClick={fetchCaptcha}
                                />
                            )}
                        </Grid>
                        <Grid item xs={2}>
                            <Button onClick={fetchCaptcha} sx={{ minWidth: 'auto' }}>
                                <RefreshIcon />
                            </Button>
                        </Grid>
                    </Grid>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Sign In
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default Login;

