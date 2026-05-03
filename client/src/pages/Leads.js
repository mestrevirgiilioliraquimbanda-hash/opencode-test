import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsAPI } from '../services/api';
import { Container, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    leadsAPI.getAll().then(res => setLeads(res.data));
  }, []);

  const handleDelete = (id) => {
    leadsAPI.delete(id).then(() => setLeads(leads.filter(l => l.id !== id)));
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Leads</Typography>
      <Button variant="contained" onClick={() => navigate('/leads/new')}>Add Lead</Button>
      <Paper sx={{ mt: 2 }}>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {leads.map(lead => (
              <TableRow key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                <TableCell>{lead.firstName} {lead.lastName}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.status}</TableCell>
                <TableCell><Button color="error" onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}>Delete</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default Leads;
