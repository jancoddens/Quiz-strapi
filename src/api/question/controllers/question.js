"use strict";

module.exports = {
  async random(ctx) {
    const table = "questions_question";

    const min = await strapi.db.connection(table).min("id as min");
    const max = await strapi.db.connection(table).max("id as max");

    const minId = min[0].min;
    const maxId = max[0].max;

    if (!minId || !maxId) {
      return ctx.send({ data: null });
    }

    const randomId =
      Math.floor(Math.random() * (maxId - minId + 1)) + minId;

    const row = await strapi.db.connection(table)
      .select("slug")
      .where("id", ">=", randomId)
      .orderBy("id", "asc")
      .limit(1);

    const fallback = await strapi.db.connection(table)
      .select("slug")
      .orderBy("id", "asc")
      .limit(1);

    return ctx.send({ data: row[0] ?? fallback[0] });
  },
};
