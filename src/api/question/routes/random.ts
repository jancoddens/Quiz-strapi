export default {
  routes: [
    {
      method: "GET",
      path: "/questions/random",
      handler: "question.random",
      config: {
        auth: false,
      },
    },
  ],
};
