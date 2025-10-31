// src/api/account/routes/account.ts
export default {
  routes: [
    {
      method: 'GET',
      path: '/account/me',
      handler: 'account.me',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'], // ⬅️ belangrijk
      },
    },
    {
      method: 'PUT',
      path: '/account/me',
      handler: 'account.updateMe',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'], // ⬅️ belangrijk
      },
    },
  ],
};
