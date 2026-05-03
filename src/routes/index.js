const authRoutes = require('./modules/auth/auth.routes');
const tenantRoutes = require('./modules/tenants/tenant.routes');
const userRoutes = require('./modules/users/user.routes');
const subscriptionRoutes = require('./modules/subscriptions/subscription.routes');

module.exports = {
  authRoutes,
  tenantRoutes,
  userRoutes,
  subscriptionRoutes
};
