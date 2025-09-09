import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, html: string) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // SSL
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from: `"Taskboard" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
    });
};
