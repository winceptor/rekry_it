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
//transporter.hostname = secret.server_host;

transporter.render = function(templatename, args, locals) {
	for (var k in args) { 
		locals[k] = args[k]; 
	}
	
	locals.filename = __dirname + '/../views/' + templatename + '.ejs';
	var bodytemplate = fs.readFileSync(locals.filename, 'utf8'); 
	
	locals.body = ejs.render(bodytemplate, locals);
	
	locals.filename = __dirname + '/../views/email.ejs';
	var template = fs.readFileSync(locals.filename, 'utf8'); 
	
	var render = ejs.render(template, locals);
	
	//translate if module installed
	if (typeof locals.trans!="undefined")
	{
		return {
			from: this.sender, // sender address
			to: args.to, // list of receivers
			subject: locals.trans(args.subject), // Subject line
			html: locals.trans(render) // html of message
		};
	}
	else
	{
		return {
			from: this.sender, // sender address
			to: args.to, // list of receivers
			subject: args.subject, // Subject line
			html: render // html of message
		};
	}
}

module.exports= transporter;
