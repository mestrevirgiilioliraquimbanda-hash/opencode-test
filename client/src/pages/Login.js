import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Container, Paper, TextField, Button, Typography, Alert } from '@mui/material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper sx={{ mt: 8, p: 4 }}>
        <Typography variant="h5">Lead Management Login</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField margin="normal" fullWidth label="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <TextField margin="normal" fullWidth label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>Sign In</Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;
