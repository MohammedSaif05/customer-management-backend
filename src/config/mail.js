/**
 * Nodemailer transport configuration for email notifications.
 * Supports SMTP (e.g. Gmail, SendGrid) via environment variables.
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    logger.info('Mail transporter configured (SMTP) - emails will be sent');
  } else {
    transporter = {
      sendMail: async (options) => {
        logger.info('Mail (not sent - no SMTP config):', { to: options.to, subject: options.subject });
        return { messageId: 'stub-' + Date.now() };
      },
    };
    logger.warn('Mail: No SMTP credentials. Emails will be logged only.');
  }

  return transporter;
}

module.exports = { getTransporter };
