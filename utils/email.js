const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    // Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, // Use your email host provider
        port: process.env.EMAIL_PORT, // Use the appropriate port for your email provider
        auth: {
            user: process.env.EMAIL_USERNAME, // Your email address
            pass: process.env.EMAIL_PASSWORD, // Your email password or app password
        },
    });
    // Define the email options
    const mailOptions = {
        from: "Natours <ahmed.toba.mahmoud@gmail.com>",
        to: options.email, // Recipient's email address
        subject: options.subject, // Subject of the email
        text: options.message, // Plain text body of the email
        // html: options.html, // Uncomment if you want to send HTML content
    };
    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
};

module.exports = sendEmail;
