// src/api/account/controllers/account.ts
import { errors } from '@strapi/utils';
const { ApplicationError } = errors;

const ALLOWED_FIELDS = ['email', 'username', 'firstname', 'lastname', 'city', 'country', 'team'];

export default {
  async me(ctx) {
    const user = ctx.state.user;
    if (!user) throw new ApplicationError('Unauthorized');

    // haal verse data uit DB
    const fresh = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: [],
    });

    // laat niet alles lekken; stuur enkel relevante velden terug
    const out: Record<string, any> = {
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

    ctx.body = out;
  },

  async updateMe(ctx) {
    const user = ctx.state.user;
    if (!user) throw new ApplicationError('Unauthorized');

    const data = ctx.request.body ?? {};
    const patch: Record<string, any> = {};

    for (const k of ALLOWED_FIELDS) {
      if (k in data) {
        // lege string => null
        const v = data[k];
        patch[k] = v === '' ? null : v;
      }
    }

    // username altijd gelijk aan email (als email gezet wordt)
    if (typeof patch.email === 'string' && patch.email.trim()) {
      patch.username = patch.email.trim();
      patch.email = patch.email.trim();
    }

    // werk bij
    const updated = await strapi.entityService.update('plugin::users-permissions.user', user.id, {
      data: patch,
    });

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
