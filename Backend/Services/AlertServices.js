const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS
  },
  tls: {
    rejectUnauthorized: false
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


sendEmail('ingbianjonathan@gmail.com', 'Test Email', 'This is a test email from FlowSync.');

module.exports = { sendEmail };