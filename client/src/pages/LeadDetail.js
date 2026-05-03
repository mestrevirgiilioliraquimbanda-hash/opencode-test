import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadsAPI } from '../services/api';
import { Container, TextField, Button, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const statusOptions = ['new', 'contacted', 'qualified', 'lost', 'converted'];

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '', notes: '', status: 'new' });

  useEffect(() => {
    if (id !== 'new') {
      leadsAPI.getById(id).then(res => setLead(res.data));
    }
  }, [id]);

  const handleChange = (e) => {
    setLead({ ...lead, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const apiCall = id === 'new' ? leadsAPI.create(lead) : leadsAPI.update(id, lead);
    apiCall.then(() => navigate('/leads'));
  };

  return (
    <Container>
      <Typography variant="h4">{id === 'new' ? 'Add Lead' : 'Edit Lead'}</Typography>
      <form onSubmit={handleSubmit}>
        <TextField margin="normal" fullWidth label="First Name" name="firstName" value={lead.firstName} onChange={handleChange} />
        <TextField margin="normal" fullWidth label="Last Name" name="lastName" value={lead.lastName} onChange={handleChange} />
        <TextField margin="normal" fullWidth label="Email" name="email" value={lead.email} onChange={handleChange} />
        <TextField margin="normal" fullWidth label="Phone" name="phone" value={lead.phone || ''} onChange={handleChange} />
        <TextField margin="normal" fullWidth label="Company" name="company" value={lead.company || ''} onChange={handleChange} />
        <TextField margin="normal" fullWidth label="Notes" name="notes" value={lead.notes || ''} onChange={handleChange} multiline rows={4} />
        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select name="status" value={lead.status} onChange={handleChange} label="Status">
            {statusOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>Save</Button>
        <Button onClick={() => navigate('/leads')} sx={{ mt: 2, ml: 2 }}>Cancel</Button>
      </form>
    </Container>
  );
};

export default LeadDetail;
