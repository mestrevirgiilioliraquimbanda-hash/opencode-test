import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemText, Box } from '@mui/material';

const Layout = () => {
  const { user, logout } = useAuth();
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Lead Management</Typography>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{ width: 240, mt: 8 }}>
        <List>
          <ListItem button component={Link} to="/dashboard"><ListItemText primary="Dashboard" /></ListItem>
          <ListItem button component={Link} to="/leads"><ListItemText primary="Leads" /></ListItem>
          {user?.role === 'admin' && <ListItem button component={Link} to="/users"><ListItemText primary="Users" /></ListItem>}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, ml: 30 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
