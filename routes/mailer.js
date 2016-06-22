var router= require('express').Router();

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var secret = require('../config/secret');

var transporter = nodemailer.createTransport(smtpTransport({
	host: secret.email_host,
    port: secret.email_port,
    secure: secret.email_secure, // use SSL
    auth: {
        user: secret.email_user,
        pass: secret.email_pass
    }
}));

transporter.sender = '"' + secret.email_sender + '" <' + secret.email_user + '>';

module.exports= transporter;
