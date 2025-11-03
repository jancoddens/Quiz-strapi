// src/api/account/routes/account.ts
export default {
  routes: [
    {
      method: 'GET',
      path: '/account/me',
      handler: 'account.me',
      config: {
        auth: { strategies: ['jwt'] }, // vereis ingelogde user
      },
    },
    {
      method: 'PUT',
      path: '/account/me',
      handler: 'account.updateMe',
      config: {
        auth: { strategies: ['jwt'] }, // vereis ingelogde user
      },
    },
  ],
};
