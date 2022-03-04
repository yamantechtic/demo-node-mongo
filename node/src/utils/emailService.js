const nodemailer = require("nodemailer");
const config = require("config");

const logger = require("../utils/logger");

const domain = process.env.FRONTEND_URL;

const backend_domain = process.env.BACKEND_URL;

const port = process.env.PORT;

const TemplateService = require("../api/common/template/templateService");
const templateService = new TemplateService();

function doSend(email, subject, text, html_text) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_FROM_EMAIL,
    to: email,
    subject: subject,
    text: text,
    html: html_text,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
  return Promise.resolve(true);
}

function sendNewUserEmail(name, email) {
  const html_text =
    `Hello ${name},` +
    "<br /><br /><b>You have signed up successfully!</b><br /><br />" +
    "<br /><br /><br />Thank you," +
    "<br />Support Spreadbliss";

  const subject = "Spreadbliss Registration Successful";
  const text = "Spreadbliss Registration Successful";

  return doSend(email, subject, text, html_text);
}

async function sendChangeUserPasswordEmail(email, name) {
  var emailText = await templateService.findByType("change-password");
  var html_text =
    `Hello ${name},` +
    emailText.data.body +
    "<br />Thank you," +
    "<br />Support Spreadbliss";

  const subject = emailText.data.subject;
  const text = emailText.data.subject;

  return doSend(email, subject, text, html_text);
}

async function sendResetUserPasswordEmail(email, name, token, domain) {
  var emailText = await templateService.findByType("reset-password");

  const html_text =
    `Hello ${name},` +
    emailText.data.body +
    `<a href="${domain}/reset-password?reset_password_token=${token}"` +
    '" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 3px; background-color: #03A3A6 ; border-top: 12px solid #03A3A6 ; border-bottom: 12px solid #03A3A6 ; border-right: 18px solid #03A3A6 ; border-left: 18px solid #03A3A6; display: inline-block;"">Reset Password</a>' +
    "<br /><br />If you face any problem, please paste the following URL into your web browser: " +
    `<br /><br /><span style="color: #03A3A6 !important;">${domain}/reset-password?reset_password_token=${token}</span><br /><br />` +
    "<br />If it wasn't you, take no action or contact support." +
    "<br /><br />Thank you," +
    "<br />Support Spreadbliss";

  const subject = emailText.data.subject;
  const text = emailText.data.subject;

  return doSend(email, subject, text, html_text);
}

async function sendVerifyUserEmail(name, email, user_token, password) {
  var emailText = await templateService.findByType("verify-registration");
  var html_text =
    `Hello ${name},` +
    emailText.data.body +
    // + '<br /><br />Thanks for getting started with Spreadbliss! Kindly click on the below button to confirm your email address.'
    '<a href="' +
    (process.env.NODE_ENV == "production"
      ? domain
      : "http://localhost:" + port) +
    "/api/auth/confirmation/" +
    email +
    "/" +
    user_token +
    '" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 3px; background-color: #03A3A6 ; border-top: 12px solid #03A3A6 ; border-bottom: 12px solid #03A3A6 ; border-right: 18px solid #03A3A6 ; border-left: 18px solid #03A3A6; display: inline-block;"">Verify Now</a>' +
    "<br /><br />If you face any problem, please paste the following URL into your web browser: " +
    '<br /><br /><span style="color: #03A3A6 !important;">' +
    (process.env.NODE_ENV == "production"
      ? domain
      : "http://localhost:" + port) +
    "/api/auth/confirmation/" +
    email +
    "/" +
    user_token +
    "</span><br /><br />";

  if (password) {
    html_text =
      html_text +
      "Please find your login credentials below: <br /> Email: " +
      email +
      "<br /> Password: " +
      password;
  }
  html_text =
    html_text + "<br /><br />Thank you," + "<br />Support Spreadbliss";
  const subject = emailText.data.subject;
  const text = emailText.data.subject;

  return doSend(email, subject, text, html_text);
}

module.exports = {
  sendNewUserEmail,
  sendChangeUserPasswordEmail,
  sendResetUserPasswordEmail,
  sendVerifyUserEmail,
};
