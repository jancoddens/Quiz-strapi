/**
 * question controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::question.question",
  ({ strapi }) => ({

    async random(ctx) {
      try {
        // Gebruik de juiste tabelnaam
        const table = "questions_question";

        // 1. Min & max ID ophalen
        const min = await strapi.db.connection(table).min("id as min");
        const max = await strapi.db.connection(table).max("id as max");

        const minId = min[0].min;
        const maxId = max[0].max;

        if (!minId || !maxId) {
          return ctx.send({ data: null });
        }

        // 2. Random ID
        const randomId =
          Math.floor(Math.random() * (maxId - minId + 1)) + minId;

        // 3. Eerste record >= randomId
        const row = await strapi.db.connection(table)
          .select("slug")
          .where("id", ">=", randomId)
          .orderBy("id", "asc")
          .limit(1);

        // 4. fallback
        const fallback = await strapi.db.connection(table)
          .select("slug")
          .orderBy("id", "asc")
          .limit(1);

        return ctx.send({ data: row[0] ?? fallback[0] });

      } catch (err) {
        console.error("Random question error:", err);
        return ctx.internalServerError("Random fetch failed");
      }
    },

  })
);
