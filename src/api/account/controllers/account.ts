import { errors } from '@strapi/utils';
const { UnauthorizedError } = errors; // liever deze dan ApplicationError

const ALLOWED_FIELDS = ['email', 'username', 'firstname', 'lastname', 'city', 'country', 'team'];

export default {
  async me(ctx) {
    const user = ctx.state.user;
    if (!user) throw new UnauthorizedError('Unauthorized');

    const fresh = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: [] });

    ctx.body = {
      id: fresh.id,
      email: fresh.email,
      username: fresh.username,
      confirmed: fresh.confirmed,
      blocked: fresh.blocked,
      firstname: fresh.firstname ?? null,
      lastname: fresh.lastname ?? null,
      city: fresh.city ?? null,
      country: fresh.country ?? null,
      team: fresh.team ?? null,
    };
  },

  async updateMe(ctx) {
    const user = ctx.state.user;
    if (!user) throw new UnauthorizedError('Unauthorized');

    const data = ctx.request.body ?? {};
    const patch: Record<string, any> = {};

    for (const k of ALLOWED_FIELDS) {
      if (k in data) {
        const v = (data as any)[k];
        patch[k] = v === '' ? null : v;
      }
    }

    if (typeof patch.email === 'string' && patch.email.trim()) {
      patch.username = patch.email.trim();
      patch.email = patch.email.trim();
    }

    const updated = await strapi.entityService.update('plugin::users-permissions.user', user.id, { data: patch });

    ctx.body = {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      confirmed: updated.confirmed,
      blocked: updated.blocked,
      firstname: updated.firstname ?? null,
      lastname: updated.lastname ?? null,
      city: updated.city ?? null,
      country: updated.country ?? null,
      team: updated.team ?? null,
    };
  },
};
