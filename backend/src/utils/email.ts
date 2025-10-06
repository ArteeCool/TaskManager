import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, html: string) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
        connectionTimeout: 30000,
    });

    await transporter.sendMail({
        from: `"Taskboard" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
    });
};
