// src/index.ts

// import type { Core } from '@strapi/strapi';

export default {
  /**
   * Runs before your application is initialized.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * Runs before your application gets started.
   * Perfect to verify which email provider/config is active.
   */
  async bootstrap({ strapi /* }: { strapi: Core.Strapi } */ }) {
    try {
      const emailConf = strapi.config.get("plugin.email");

      const provider = emailConf?.config?.provider ?? "(none)";
      const defaultFrom = emailConf?.config?.settings?.defaultFrom ?? "(unset)";
      const replyTo = emailConf?.config?.settings?.defaultReplyTo ?? "(unset)";
      const host = emailConf?.config?.providerOptions?.host ?? "(unset)";
      const port = emailConf?.config?.providerOptions?.port ?? "(unset)";
      const secure = emailConf?.config?.providerOptions?.secure ?? "(unset)";

      strapi.log.info("=== Email config loaded at bootstrap ===");
      strapi.log.info(`Provider:        ${provider}`);
      strapi.log.info(`defaultFrom:     ${defaultFrom}`);
      strapi.log.info(`defaultReplyTo:  ${replyTo}`);
      strapi.log.info(`SMTP host:       ${host}`);
      strapi.log.info(`SMTP port:       ${port}`);
      strapi.log.info(`SMTP secure:     ${secure}`);

      // Extra sanity check op ENV’s die vaak vergeten worden
      const missing: string[] = [];
      for (const key of [
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_SECURE",
        "SMTP_USERNAME",
        "SMTP_PASSWORD",
        "EMAIL_FROM",
      ]) {
        if (!process.env[key]) missing.push(key);
      }
      if (missing.length) {
        strapi.log.warn(
          `Email ENV missing (check Cloud Variables / .env): ${missing.join(", ")}`
        );
      }

      // Hint als hij nog op de cloud-provider valt
      if (provider !== "nodemailer") {
        strapi.log.warn(
          "Expected provider 'nodemailer' not active. Check config/plugins.ts location, filename, and redeploy."
        );
      }
    } catch (e: any) {
      strapi.log.error(`Email config inspection failed: ${e?.message || e}`);
    }
  },
};
