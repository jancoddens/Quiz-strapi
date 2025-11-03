// src/api/account/controllers/account.ts
import { errors } from '@strapi/utils';
const { ApplicationError } = errors;

const ALLOWED_FIELDS = [
  'email', 'username', 'firstname', 'lastname', 'city', 'country', 'team',
  'optin', 'Gender', // let op: veldnaam exact zoals in het user model
];

export default {
  async me(ctx) {
    const user = ctx.state.user;
    if (!user) throw new ApplicationError('Unauthorized');

    const fresh = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: [],
    });

    ctx.body = {
      id: fresh.id,
      email: fresh.email,
      username: fresh.username,
      confirmed: fresh.confirmed,
      blocked: fresh.blocked,
      firstname: fresh.firstname ?? null,
      lastname:  fresh.lastname  ?? null,
      city:      fresh.city      ?? null,
      country:   fresh.country   ?? null,
      team:      fresh.team      ?? null,
      optin:     typeof fresh.optin === 'number' ? fresh.optin : null, // 1 of 2
      Gender:    fresh.Gender ?? null, // 'Female' | 'Male' | 'X' | null
    };
  },

  async updateMe(ctx) {
    const user = ctx.state.user;
    if (!user) throw new ApplicationError('Unauthorized');

    const data = ctx.request.body ?? {};
    const patch: Record<string, any> = {};

    // Alleen toegestane velden toelaten; lege string => null
    for (const k of ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        const v = (data as any)[k];
        patch[k] = v === '' ? null : v;
      }
    }

    // username sync met email
    if (typeof patch.email === 'string' && patch.email.trim()) {
      const mail = patch.email.trim();
      patch.email = mail;
      patch.username = mail;
    }

    // optin normaliseren (2 = aan, 1 = uit)
    if (patch.optin !== undefined) {
      const n = Number(patch.optin);
      patch.optin = n === 2 ? 2 : 1;
    }

    // Gender normaliseren -> 'Female' | 'Male' | 'X' | null
    if ('Gender' in patch) {
      const raw = typeof patch.Gender === 'string' ? patch.Gender.trim() : null;
      if (!raw) {
        patch.Gender = null;
      } else {
        const v = raw.toLowerCase();
        if (v === 'female' || v === 'f') patch.Gender = 'Female';
        else if (v === 'male' || v === 'm') patch.Gender = 'Male';
        else if (v === 'x') patch.Gender = 'X';  // ✅ hier corrigeren we de case
        else patch.Gender = null; // onbekende waarde → null
      }
    }

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
      lastname:  updated.lastname  ?? null,
      city:      updated.city      ?? null,
      country:   updated.country   ?? null,
      team:      updated.team      ?? null,
      optin:     typeof updated.optin === 'number' ? updated.optin : null,
      Gender:    updated.Gender ?? null, // zal nu 'X' zijn als je 'x' of 'X' doorgaf
    };
  },
};
