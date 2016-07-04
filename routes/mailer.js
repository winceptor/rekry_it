var router= require('express').Router();

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var ejs = require('ejs');
var fs = require('fs');
  
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
transporter.hostname = secret.server_host;

transporter.render = function(templatename, args, locals) {
	for (var k in locals) { 
		args[k] = locals[k]; 
	}
	
	args.filename = __dirname + '/../views/email/' + templatename + '.ejs';
	var bodytemplate = fs.readFileSync(args.filename, 'utf8'); 
	var bodyrender = ejs.render(bodytemplate, args);
	
	args.body = bodyrender;
	
	args.filename = __dirname + '/../views/email/layout.ejs';
	var template = fs.readFileSync(args.filename, 'utf8'); 
	var render = ejs.render(template, args);
	
	return render;
}

module.exports= transporter;
