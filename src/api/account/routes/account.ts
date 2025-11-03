// src/api/account/routes/account.ts
export default {
  routes: [
    {
      method: 'GET',
      path: '/account/me',
      handler: 'account.me',
      config: {
        auth: { strategies: ['users-permissions'] }, // ✅ v5 style
      },
    },
    {
      method: 'PUT',
      path: '/account/me',
      handler: 'account.updateMe',
      config: {
        auth: { strategies: ['users-permissions'] }, // ✅ v5 style
      },
    },
  ],
};
