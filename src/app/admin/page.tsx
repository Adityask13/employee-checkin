'use client';
import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Container, 
  TextField, 
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { createAdminSession, isValidAdminSession } from '../../utils/adminSession';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const checkExistingSession = () => {
      if (isValidAdminSession()) {
        router.push('/admin/dashboard');
      } else {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple authentication (in production, use proper authentication)
    if (username === 'admin' && password === 'admin123') {
      // Create admin session
      createAdminSession();
      
      router.push('/admin/dashboard');
    } else {
      setError('Invalid credentials. Please check your username and password.');
    }
    
    setLoading(false);
  };

  // Show loading spinner while checking session
  if (checkingSession) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Checking authentication...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Admin Login
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Please enter your credentials to access the admin dashboard
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleLogin}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Default credentials: admin / admin123
              </Typography>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
