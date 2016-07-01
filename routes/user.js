var router= require('express').Router();
var User= require('../models/user');
var passport=require('passport');

var crypto = require('crypto');

var request = require('request');

var passportConf=require('./passport');
var transporter = require('./mailer');

router.get('/login',function(req,res){
	if(req.user) return res.redirect('/');
	res.render('user/login',{
		errors: req.flash('error'), message:req.flash('success')
	});
});


router.post('/login', function(req, res, next) {
	var referrer = req.header('Referer') || '/';
	var returnpage = req.query.r || referrer;
	
	passport.authenticate('local-login', {
		successRedirect: returnpage,
		failureRedirect: '/user/login',
		failureFlash: true
	})(req,res,next);
});

router.post('/signup',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	var returnpage = req.query.r || referrer;
	
	var user=new User();
	
	var birthday = res.locals.InputToDate(req.body.dateOfBirth);
	var jobfield = req.body.fieldOfStudy || "";
	var jobtype = req.body.typeOfJob || "";
	
	user.admin = req.body.admin;	
	user.name = req.body.name;	
	user.email = req.body.email;
	user.password = req.body.password;
	user.skills = req.body.skills;
	user.keywords = req.body.keywords;
	user.dateOfBirth = birthday;
	user.country = req.body.country;
	user.gender = req.body.gender;
	user.fieldOfStudy = jobfield;
	user.yearOfStudies = req.body.yearOfStudies;
	user.typeOfStudies = req.body.typeOfStudies;
	user.typeOfJob = jobtype;
	
	var problem = user.validateInput(req, res);
	if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
		problem = "Please complete captcha!";
	}
	if (problem)
	{
		req.flash('error',problem);

		return res.render('user/signup',{
			profile: user,
			errors: req.flash('error')
		});
	}
	
	var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + res.locals.captchakey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
	request(verificationUrl,function(error,response,body) {
		body = JSON.parse(body);
		if (body.success !== undefined && !body.success) {
			req.flash('error',"Problem with captcha, please retry!");
			
			return res.render('user/signup',{
				profile: user,
				errors: req.flash('error')
			});
		} 
		else {

			User.findOne({email:req.body.email},function(err,existingUser){

				if(existingUser){
					req.flash('error','Account with that email address already exists');

					return res.render('user/signup',{
						profile: user,
						errors: req.flash('error')
					});
				} else {
					user.save(function(err,user){
						if(err) return next (err);
						
						req.flash('success','Registration complete');
						
						req.logIn(user,function(err){
							if(err) return next(err);
							res.redirect(returnpage);
						});
						

						var mailOptions = {
							from: transporter.sender, // sender address
							to: '"' + user.name + '" <' + user.email + '>', // list of receivers
							subject: res.locals.trans('Registration complete'), // Subject line
							text: res.locals.trans('This is an email confirming your successfull registration on rekty.it.lut.fi.') // plaintext body
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
	res.render('user/signup',{
		profile: false,
		errors: req.flash('error'), message: req.flash('success')
	});

});

router.get('/profile',function(req,res,next){
	if (!req.user) { 
		req.flash('error','You have to be logged in!');
		return res.render('main/denied',{
			profile: false,
			errors: req.flash('error'), message: req.flash('success')
		});
	}

	res.render('user/profile',{
		profile: req.user,
		errors: req.flash('error'), message:req.flash('success')
	});
});

router.get('/logout',function(req,res,next){
	if (!req.user) { return res.render('main/denied'); }
	req.logout();
	res.redirect("/");
});


router.get('/edit',function(req,res,next){
	if (!req.user) { return res.render('main/denied'); }
	res.render('user/edit',{profile:req.user, errors: req.flash('error'), message: req.flash('success')});
});

//edit profile feature, might be modified according to user attributes and needs

router.post('/edit',function(req,res,next){
	if (!req.user) { return res.render('main/denied'); }
	

	var birthday = res.locals.InputToDate(req.body.dateOfBirth);
	var jobfield = req.body.fieldOfStudy || "";
	var jobtype = req.body.typeOfJob || "";

	profile.admin = req.body.admin;		
	profile.gender = req.body.gender;
	profile.name = req.body.name;
	profile.email = req.body.email;
	profile.dateOfBirth = birthday;
	profile.country = req.body.country;
	profile.fieldOfStudy = jobfield;
	profile.yearOfStudies = req.body.yearOfStudies;
	profile.typeOfStudies = req.body.typeOfStudies;
	profile.typeOfJob = jobtype;
	profile.skills = req.body.skills;
	profile.keywords = req.body.keywords;
	
	var problem = profile.validateInput(req, res);
	if (problem)
	{
		req.flash('error',problem);

		return res.render('user/edit',{
			profile: profile,
			errors: req.flash('error')
		});
	}
	
	User.findOne({email:req.params.email},function(err,existingUser){
		if(err) return next(err);
		if(existingUser && existingUser._id!=req.params.id){
			req.flash('error','Account with that email address already exists');

			return res.render('user/edit',{
				profile:profile,
				errors: req.flash('error')
			});
		} else {
			profile.save( 
				function(err, results) {
					if(err) return next(err);
					if (!results)
					{
						req.flash('error', 'User edit failed!');
						return res.redirect(referrer);
					}
					profile.on('es-indexed', function(err, result){
						if (err) return next(err);
						req.flash('success','Account details changed');
			
						res.redirect('/user/profile');
					});
				}
			);
		}
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
	var referrer = req.header('Referer') || '/';
	var returnpage = req.query.r || referrer;
	
	if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
		req.flash('error', "Please complete captcha!");
		
		res.render('user/forgot', {
			profile: false,
			errors: req.flash('error'), message: req.flash('success')
	  });
	}
	
	var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + res.locals.captchakey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
	request(verificationUrl,function(error,response,body) {
		body = JSON.parse(body);
		if (body.success !== undefined && !body.success) {
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
						
						var mailOptions = {
							from: transporter.sender, // sender address
							to: '"' + user.name + '" <' + user.email + '>', // list of receivers
							subject: res.locals.trans('Password reset'), // Subject line
							text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
						  'Please click on the following link, or paste this into your browser to complete the process: (token expires in 1 hour)\n\n' +
						  'http://' + req.headers.host + '/user/reset/' + token + '\n\n' +
						  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
						};

						//Send e-mail
						transporter.sendMail(mailOptions, function(error, info){
							if(error){
							   return console.log(error);
							}
							console.log('Message sent: ' + info.response);
							req.flash('success', 'An e-mail has been sent with further instructions.');
							
							res.redirect(referrer);
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
	var referrer = req.header('Referer') || '/';
	var returnpage = req.query.r || referrer;
	
	if (req.body.password != req.body.passwordcheck)
	{
		req.flash('error','Passwords must match!');

		return res.redirect(referrer);
	}
	
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if(err) return next (err);
		if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/user/forgot');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
			if(err) return next (err);
			req.logIn(user, function(err) {
				if(err) return next (err);
				var mailOptions = {
					from: transporter.sender, // sender address
					to: '"' + user.name + '" <' + user.email + '>', // list of receivers
					subject: res.locals.trans('Your password has been changed'), // Subject line
					text: 'Hello ' + user.name + ',\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
				};

				//Send e-mail
				transporter.sendMail(mailOptions, function(error, info){
					if(error){
					   return console.log(error);
					}
					//console.log('Message sent: ' + info.response);
					req.flash('success', 'Success! Your password has been changed.');
					
					res.redirect("/");
				});	
			});
        });
    });
});

module.exports= router;
