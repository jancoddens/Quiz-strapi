// config/plugins.ts
export default () => ({
  rest: {
    defaultLimit: 25,
    maxLimit: 10000,   // ⬅️ VERHOGEN
    withCount: true,
  },
});
