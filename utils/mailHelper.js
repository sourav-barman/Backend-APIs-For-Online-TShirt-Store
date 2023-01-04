const nodemailer = require("nodemailer");

const mailHelper = async (option) => {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER, 
      pass: process.env.SMTP_PASS, 
    },
  });

  const message = {
    from: "souravbarmancomp@gmail.com", // sender address
    to: option.email, // list of receivers
    subject: option.subject, // Subject line
    text: option.message, // plain text body
  }

  // send mail with defined transport object
  await transporter.sendMail(message);

}

module.exports = mailHelper;