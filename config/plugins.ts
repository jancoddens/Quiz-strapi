export default ({ env }) => ({
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: env("SMTP_HOST", "smtp-auth.mailprotect.be"),
        port: env.int("SMTP_PORT", 465),          // 587 = STARTTLS
        secure: env.bool("SMTP_SECURE", true),   // true als je 465 gebruikt
        auth: {
          user: env("SMTP_USERNAME"),             // volledige mailbox, bv. noreply@jouwdomein.be
          pass: env("SMTP_PASSWORD"),
        },
      },
      settings: {
        defaultFrom: env("EMAIL_FROM", "info@quizvragen.eu"),
        defaultReplyTo: env("EMAIL_REPLY_TO", "support@quizvragen.eu"),
        testAddress: env("EMAIL_REPLY_TO", "info@quizvragen.eu"),
      },
    },
  },
  rest: { defaultLimit: 25, maxLimit: 10000, withCount: true },
});
