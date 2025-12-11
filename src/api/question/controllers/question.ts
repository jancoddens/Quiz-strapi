/**
 * question controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::question.question",
  ({ strapi }) => ({
    // --- JOUW RANDOM ENDPOINT FUNCTIE ---
    async random(ctx) {
      try {
        // 1: Min & max ID ophalen (indexed → snel)
        const min = await strapi.db.connection("questions").min("id as min");
        const max = await strapi.db.connection("questions").max("id as max");

        const minId = min[0].min;
        const maxId = max[0].max;

        if (!minId || !maxId) {
          return ctx.send({ data: null });
        }

        // 2: Random ID genereren
        const randomId =
          Math.floor(Math.random() * (maxId - minId + 1)) + minId;

        // 3: Vraag met id >= randomId ophalen
        const row = await strapi.db
          .connection("questions")
          .select("slug")
          .where("id", ">=", randomId)
          .orderBy("id", "asc")
          .limit(1);

        // 4: fallback indien random hoger dan de hoogste id was
        const fallback = await strapi.db
          .connection("questions")
          .select("slug")
          .orderBy("id", "asc")
          .limit(1);

        return ctx.send({ data: row[0] ?? fallback[0] });
      } catch (err) {
        strapi.log.error("Random question error:", err);
        return ctx.internalServerError("Random fetch failed");
      }
    },
  })
);
