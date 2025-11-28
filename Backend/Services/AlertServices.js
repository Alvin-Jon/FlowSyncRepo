const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS
  }
});


const sendEmail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: `"FlowSync Alerts" <${process.env.EMAIL}>`,
      to,
      subject,
      text,
      ...(html && { html }),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
  }
};

module.exports = { sendEmail };