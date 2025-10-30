export default {
  async updateMe(ctx) {
    const user = ctx.state.user; // komt uit JWT
    if (!user) return ctx.unauthorized();

    const {
      email,
      firstname,
      lastname,
      city,
      country,
      team,
    } = ctx.request.body || {};

    const data = {} as any;

    // username = email (zoals eerder)
    if (email) {
      data.email = email.trim();
      data.username = email.trim();
    }

    // Optionele velden (null als leeg)
    if (firstname !== undefined) data.firstname = firstname || null;
    if (lastname  !== undefined) data.lastname  = lastname  || null;
    if (city      !== undefined) data.city      = city      || null;
    if (country   !== undefined) data.country   = country   || null;
    if (team      !== undefined) data.team      = team      || null;

    const updated = await strapi.entityService.update(
      'plugin::users-permissions.user',
      user.id,
      { data }
    );

    ctx.body = { user: updated };
  },
};
