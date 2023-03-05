const nodemailer = require("nodemailer");

// const auth = {
// 	auth: { 
// 		api_key: "953815eaf5daf9ca5be27935144a8723-2a9a428a-c86035d3",
// 		domain: "sandboxedfb4f2ab4ec45b8852f54f424c5091f.mailgun.org"
// 	},
// };

// const nodemailer = require('nodemailer');
// const mg = require('nodemailer-mailgun-transport');

// const auth = {
// 	type: "oauth2",
// 	user:process.env.SENDER_EMAIL,
// 	clientId:process.env.CLIENT_ID,
// 	clientSecret:process.env.CLIENT_SECRET,
// 	refreshToken:process.env.REFRESH_TOKEN
// };
	
// // create reusable transporter object using the default SMTP transport
// let transporter = nodemailer.createTransport({
// 	service:"gmail",
// 	auth: auth
// });

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
	host: process.env.EMAIL_SMTP_HOST,
	port: process.env.EMAIL_SMTP_PORT,
	//secure: process.env.EMAIL_SMTP_SECURE, // lack of ssl commented this. You can uncomment it.
	auth: {
		user: process.env.EMAIL_SMTP_USERNAME,
		pass: process.env.EMAIL_SMTP_PASSWORD
	}
});

exports.send = function (from, to, subject, html)
{
	// send mail with defined transport object
	// visit https://nodemailer.com/ for more options
	return transporter.sendMail({
		from: from, // sender address e.g. no-reply@xyz.com or "Fred Foo 👻" <foo@example.com>
		bcc: to, // list of receivers e.g. bar@example.com, baz@example.com
		subject: subject, // Subject line e.g. 'Hello ✔'
		//text: text, // plain text body e.g. Hello world?
		html: html // html body e.g. '<b>Hello world?</b>'
	});
};