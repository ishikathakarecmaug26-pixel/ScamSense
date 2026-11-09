import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env.js";

// Result interface returned by email operations
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const isSmtpConfigured = (): boolean => {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
};

const createTransporter = (): Transporter => {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE, // true for 465, false for 587
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000, 
    socketTimeout: 10000, 
  });
};

export const sendWelcomeEmail = async (
  toEmail: string,
  name: string
): Promise<EmailSendResult> => {
  // Check if SMTP is configured in .env
  if (!isSmtpConfigured()) {
    console.log(
      `[Email Service] SMTP configuration missing in .env. Skipping welcome email to <${toEmail}>.`
    );
    return {
      success: false,
      error: "SMTP_NOT_CONFIGURED",
    };
  }

  try {
    const transporter = createTransporter();
    const fromAddress = env.EMAIL_FROM || `"ScamSense" <${env.SMTP_USER}>`;
    const simpleText = `Hello ${name},

Welcome to ScamSense! You are registered.

Your account has been successfully created. You can now log in to analyze suspicious messages and learn cybersecurity tips.

The ScamSense Team
`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: "Welcome to ScamSense",
      text: simpleText,
    });

    console.log(
      `[Email Service] Welcome email successfully sent to <${toEmail}> (Message ID: ${info.messageId})`
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[Email Service Error] Failed to send welcome email to <${toEmail}>:`,
      errorMessage
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
};
