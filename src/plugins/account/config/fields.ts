export default {
  me: {
    read: [
      "id",
      "username",
      "email",
      "favorites",    // ⬅️ relation zichtbaar maken
    ],
    update: [
      "favorites",    // ⬅️ relation updaten via account/me
    ],
  },
};
