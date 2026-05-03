import React, { useEffect, useState } from 'react';
import { usersAPI } from '../services/api';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';

const Users = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    usersAPI.getAll().then(res => setUsers(res.data));
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Users</Typography>
      <Paper sx={{ mt: 2 }}>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell></TableRow></TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default Users;
