import React, { useEffect, useState } from 'react';
import { leadsAPI, tenantsAPI } from '../services/api';
import { Container, Typography, Grid, Card, CardContent, CircularProgress } from '@mui/material';

const Dashboard = () => {
  const [stats, setStats] = useState({ leads: 0, tenant: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([leadsAPI.getAll(), tenantsAPI.getProfile()])
      .then(([leadsRes, tenantRes]) => {
        setStats({ leads: leadsRes.data.length, tenant: tenantRes.data });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card><CardContent><Typography>Total Leads: {stats.leads}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent><Typography>Tenant: {stats.tenant?.companyName}</Typography></CardContent></Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
