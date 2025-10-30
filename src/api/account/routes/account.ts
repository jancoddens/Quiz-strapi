export default {
  routes: [
    {
      method: 'PUT',
      path: '/account/me',
      handler: 'account.updateMe',
      config: {
        // <-- GEEN 'true' gebruiken; v5 verwacht een object
        auth: {
          strategies: ['jwt'], // standaard JWT-auth van users-permissions
        },
        policies: [],
        middlewares: [],
      },
    },
  ],
};
