var router= require('express').Router();
var User= require('../models/user');
var passport=require('passport');

var crypto = require('crypto');

var request = require('request');

var passportConf=require('./passport');
var transporter = require('./mailer');

router.get('/login',function(req,res, next){
	var redirectpage = req.query.r || "/";
	res.render('user/login',{
		redirectpage: redirectpage,
		errors: req.flash('error'), message:req.flash('success')
	});
});


router.post('/login', function(req, res, next) {
	
	var redirectpage = req.body.redirectpage || '/';
	
	passport.authenticate('local-login', {
		successRedirect: redirectpage,
		failureRedirect: '/user/login',
		failureFlash: true
	})(req,res,next);
});

router.post('/signup',function(req,res,next){
	
	var redirectpage = req.body.redirectpage || '/';
	
	var user=new User();
	
	var birthday = res.locals.InputToDate(req.body.dateOfBirth);

	user.admin = req.body.admin || res.locals.zeroadmins;	
	user.employer = req.body.employer;	
	user.name = req.body.name;	
	user.email = req.body.email;
	user.phone = req.body.phone;
	user.password = req.body.password;
	user.skills = req.body.skills;
	user.keywords = req.body.keywords;
	user.dateOfBirth = birthday;
	user.country = req.body.country;
	user.address = req.body.address;
	user.gender = req.body.gender;
	user.fieldOfStudy = req.body.fieldOfStudy || null;
	user.yearOfStudies = req.body.yearOfStudies;
	user.typeOfStudies = req.body.typeOfStudies || null;
	user.typeOfJob = req.body.typeOfJob || null;
	
	var problem = user.validateInput(req, res, true);
	if(req.body.terms == undefined || req.body.terms == null) {
		problem += "<br>###accept### ###terms###";
	}
	if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
		problem += "<br>Please complete captcha!";
	}
	if (problem)
	{
		req.flash('error',problem);

		return res.render('user/signup',{
			profile: user,
			redirectpage: redirectpage,
			errors: req.flash('error')
		});
	}
	
	var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + res.locals.captchakey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
	request(verificationUrl,function(error,response,body) {
		body = JSON.parse(body);
		if (body.success !== undefined && !body.success) {
			req.flash('error',"<br>Problem with captcha, please retry!");
			
			return res.render('user/signup',{
				profile: user,
				redirectpage: redirectpage,
				errors: req.flash('error')
			});
		} 
		else {

			User.findOne({email:req.body.email},function(err,existingUser){

				if(existingUser){
					req.flash('error','###user### ###alreadyexists###');

					return res.render('user/signup',{
						profile: user,
						redirectpage: redirectpage,
						errors: req.flash('error')
					});
				} else {
					user.save(function(err,user){
						if(err) return next (err);
						
						req.flash('success','###user### ###registered###');
						
						req.logIn(user,function(err){
							if(err) return next(err);
							res.redirect(redirectpage);
						});
						
						var title = res.locals.trans('###user### ###registered###');
						var message = 'This is an email confirming your successfull registration on rekty.it.lut.fi.';

						var mailOptions = {
							from: transporter.sender, // sender address
							to: '"' + user.name + '" <' + user.email + '>', // list of receivers
							subject: title, // Subject line
							//text: res.locals.trans('This is an email confirming your successfull registration on rekty.it.lut.fi.') // plaintext body
							html: res.locals.trans(transporter.render('generic',{title:title, message:message},res.locals))
						};
				
						//Send e-mail
						transporter.sendMail(mailOptions, function(error, info){
							if(error){
							   console.log(err);
								return next(err);
							}
							console.log('Message sent: ' + info.response);
						});

					});
				}
			});
		}
	});
});
router.get('/signup', function(req, res, next) {
	var redirectpage = req.params.r || "/";
	res.render('user/signup',{
		profile: false,
		redirectpage: redirectpage,
		errors: req.flash('error'), message: req.flash('success')
	});

});

router.get('/profile',function(req,res,next){
	if (!req.user) { 
		req.flash('error','###needlogin###');
		return res.render('denied',{
			profile: false,
			errors: req.flash('error'), message: req.flash('success')
		});
	}
	
	User.populate(
		req.user, 
		[{ path: 'fieldOfStudy'}, { path: 'typeOfStudies'}], 
		function(err, profile) {
			res.render('user/profile',{
				entry: profile,
				errors: req.flash('error'), message:req.flash('success')
			});
		}
	);
});

router.get('/logout',function(req,res,next){
	if (!req.user) { return res.render('denied'); }
	req.logout();
	res.redirect("/");
});


router.get('/edit',function(req,res,next){
	if (!req.user) { return res.render('denied'); }
	res.render('user/edit',{profile:req.user, errors: req.flash('error'), message: req.flash('success')});
});

//edit profile feature, might be modified according to user attributes and needs

router.post('/edit',function(req,res,next){
	if (!req.user) { return res.render('denied'); }
	

	var birthday = res.locals.InputToDate(req.body.dateOfBirth);

	User.findById(req.user._id, function(err, user) {
		if(err) return next (err);
		user.admin = req.body.admin;	
		user.employer = req.body.employer;		
		user.gender = req.body.gender;
		user.name = req.body.name;
		user.email = req.body.email;
		user.phone = req.body.phone;
		user.dateOfBirth = birthday;
		user.country = req.body.country;
		user.address = req.body.address;
		user.skills = req.body.skills;
		user.keywords = req.body.keywords;
		user.fieldOfStudy = req.body.fieldOfStudy || null;
		user.yearOfStudies = req.body.yearOfStudies;
		user.typeOfStudies = req.body.typeOfStudies || null;
		user.typeOfJob = req.body.typeOfJob || null;
		
		if (req.body.password!="")
		{
			user.password = req.body.password;
		}
		
		var problem = user.validateInput(req, res);
		if (problem)
		{
			req.flash('error',problem);

			return res.render('user/edit',{
				profile: user,
				errors: req.flash('error')
			});
		}
		
		User.findOne({email:req.body.email},function(err,existingUser){
			if(err) return next(err);
			if(existingUser && existingUser._id.toString()!=user._id.toString()){
				req.flash('error','###user### ###alreadyexists###');

				return res.render('user/edit',{
					profile:user,
					errors: req.flash('error')
				});
			} else {
				user.save( 
					function(err, results) {
						if(err) return next(err);
						if (!results)
						{
							req.flash('error', '###user### ###not### ###edited###!');
							return res.redirect(res.locals.referer);
						}
						user.on('es-indexed', function(err, result){
							if (err) return next(err);
							req.flash('success','###user### ###edited###');
				
							res.redirect('/user/profile');
						});
					}
				);
			}
		});	
	});
});

router.get('/forgot', function(req, res) {
  res.render('user/forgot', {
		profile: false,
		errors: req.flash('error'), message: req.flash('success')
  });
});

//http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/
router.post('/forgot', function(req, res, next) {
	
	//remember to disable once deployed
	var ignorecaptcha = false;
	
	if(!ignorecaptcha && (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null)) {
		req.flash('error', "Please complete captcha!");
		
		res.render('user/forgot', {
			profile: false,
			errors: req.flash('error'), message: req.flash('success')
	  });
	}
	
	var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + res.locals.captchakey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
	request(verificationUrl,function(error,response,body) {
		body = JSON.parse(body);
		if (!ignorecaptcha && body.success !== undefined && !body.success) {
			req.flash('error',"Problem with captcha, please retry!");
			
			res.render('user/forgot', {
				profile: false,
				errors: req.flash('error'), message: req.flash('success')
			});
		} 
		else {
			crypto.randomBytes(20, function(err, buf) {
				if(err) return next (err);
				var token = buf.toString('hex');

				User.findOne({ email: req.body.email }, function(err, user) {
					if(err) return next (err);
					if (!user) {
					  req.flash('error', 'No account with that email address exists.');
					  return res.redirect('/user/forgot');
					}

					user.resetPasswordToken = token;
					user.resetPasswordExpires = Date.now() + 60*60*1000; // 1 hour

					user.save(function(err) {
						if(err) return next (err);
						
						var recipient = '"' + user.name + '" <' + user.email + '>';
						var title = '###forgotpass###';
						var message = 'You are receiving this because you (or someone else) have requested the reset of the password for your account.<br>' +
						  'Please click on the following link, or paste this into your browser to complete the process: (token expires in 1 hour)<br><br>' +
						  '<a href="' + res.locals.hosturl + '/user/reset/' + token + '">Reset link</a><br><br>' +
						  'If you did not request this, please ignore this email and your password will remain unchanged.<br>';
						/*var mailOptions = {
							from: transporter.sender, // sender address
							to: '"' + user.name + '" <' + user.email + '>', // list of receivers
							subject: res.locals.trans(title), // Subject line
							text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
						  'Please click on the following link, or paste this into your browser to complete the process: (token expires in 1 hour)\n\n' +
						  'http://' + req.headers.host + '/user/reset/' + token + '\n\n' +
						  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
							html: res.locals.trans(transporter.render('generic',{title:title, message:message},res.locals))
						};*/
						
						var mailParameters = {
								to: recipient, 
								subject: title, 
								title: title, 
								message: message
							};
						var mailOptions = transporter.render('email/forgot', mailParameters, res.locals);

						//Send e-mail
						transporter.sendMail(mailOptions, function(error, info){
							if(error){
							   return console.log(error);
							}
							console.log('Message sent: ' + info.response);
							req.flash('success', 'An e-mail has been sent with further instructions.');
							
							return res.redirect("/");
						});		
					});
				});
			});
		}
	});
});
   
router.get('/reset/:token', function(req, res) {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		if(err) return next (err);
		if (!user) {
			req.flash('error', 'Password reset token is invalid or has expired.');
			return res.redirect('/user/forgot');
		}
		res.render('user/reset', {
			errors: req.flash('error'), message: req.flash('success')
		});
	});
});

router.post('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if(err) return next (err);
		if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/user/forgot');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
		
		var problem = user.validateInput(req, res);
		if (req.body.password=="")
		{
			problem = "Enter password!";
		}
		if (problem)
		{
			req.flash('error',problem);

			return res.render('user/forgot',{
				profile: user,
				errors: req.flash('error')
			});
		}

        user.save(function(err) {
			if(err) return next (err);
			req.logIn(user, function(err) {
				if(err) return next (err);
				recipient = '"' + user.name + '" <' + user.email + '>';
				var title = 'Your password has been changed';
				var message = 'Hello ' + user.name + ',\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n';
				
				var mailParameters = {
						to: recipient, 
						subject: title, 
						title: title, 
						message: message
					};
				var mailOptions = transporter.render('email/message', mailParameters, res.locals);
						
				//Send e-mail
				transporter.sendMail(mailOptions, function(error, info){
					if(error){
					   return console.log(error);
					}
					//console.log('Message sent: ' + info.response);
					req.flash('success', 'Your password has been changed.');
					
					res.redirect("/");
				});	
			});
        });
    });
});

module.exports= router;
