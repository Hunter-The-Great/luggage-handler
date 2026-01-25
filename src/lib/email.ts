import nodemailer from "nodemailer";
import { env } from "./env";

export const transport: nodemailer.Transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.CLIENT_EMAIL,
    pass: env.CLIENT_PASSWORD,
  },
});
