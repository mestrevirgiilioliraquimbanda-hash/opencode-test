const express = require('express');
const authService = require('./auth.service');
const logger = require('../../config/logger');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, tenantSlug } = req.body;

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      tenantSlug
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.json(result);
  } catch (error) {
    if (error.message === 'Invalid credentials' || error.message === 'Account has been deactivated') {
      return res.status(401).json({ error: error.message });
    }
    logger.error('Login error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const result = await authService.refreshToken(refreshToken);

    res.json(result);
  } catch (error) {
    if (error.message === 'Invalid refresh token' || error.message === 'Refresh token expired') {
      return res.status(401).json({ error: error.message });
    }
    logger.error('Token refresh error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    await authService.logout(refreshToken);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
