'use client';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import { AdminPanelSettings, Logout } from '@mui/icons-material';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isValidAdminSession, destroyAdminSession } from '../utils/adminSession';

export default function Header() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check admin authentication status using session management
    const checkAdminAuth = () => {
      setIsAdminLoggedIn(isValidAdminSession());
    };

    // Check initially
    checkAdminAuth();

    // Listen for storage changes (when admin logs in/out from different tabs)
    window.addEventListener('storage', checkAdminAuth);
    
    // Listen for custom auth events (same tab changes)
    window.addEventListener('adminAuthChange', checkAdminAuth);

    return () => {
      window.removeEventListener('storage', checkAdminAuth);
      window.removeEventListener('adminAuthChange', checkAdminAuth);
    };
  }, []);

  const handleAdminAction = () => {
    if (isAdminLoggedIn) {
      // Logout using session management
      destroyAdminSession();
      setIsAdminLoggedIn(false);
      
      router.push('/');
    } else {
      // Go to admin login
      router.push('/admin');
    }
  };

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography variant="h6" component="div">
              Employee Check-in System
            </Typography>
          </Link>
        </Box>
        
        <IconButton 
          color="inherit" 
          size="large"
          title={isAdminLoggedIn ? "Logout" : "Admin Panel"}
          sx={{ ml: 1 }}
          onClick={handleAdminAction}
        >
          {isAdminLoggedIn ? <Logout /> : <AdminPanelSettings />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
