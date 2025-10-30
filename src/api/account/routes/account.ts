export default {
  routes: [
    {
      method: 'PUT',
      path: '/account/me',
      handler: 'account.updateMe',
      config: {
        auth: true, // JWT verplicht
      },
    },
  ],
};
