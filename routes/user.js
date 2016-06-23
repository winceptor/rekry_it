var router= require('express').Router();
var User= require('../models/user');
var passport=require('passport');

var crypto = require('crypto');

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

/*
router.post('/login', function(req, res, next) {
	var referrer = req.header('Referer') || '/';
	var returnpage = req.query.r || referrer;
	
	 User.findOne({ email: req.query.email }, function (err, user) {
		  if (err) { return done(err); }
		  if (!user) {
			return done(null, false, { message: 'Incorrect username.' });
		  }
		  if (!user.validPassword(password)) {
			return done(null, false, { message: 'Incorrect password.' });
		  }
		  return done(null, user);
		
		req.logIn(user,function(err){
			if(err) return next(err);
			res.redirect(returnpage);
		});
	 });
});

*/

router.post('/signup',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	var returnpage = req.query.r || referrer;
	
	var user=new User();
	
	var user_admin = false;
	
	user.admin = user_admin;
	user.name = req.body.name;	
	user.email = req.body.email;
	user.password = req.body.password;
	user.skills = req.body.skills;
	user.keywords = req.body.keywords;
	user.dateOfBirth = req.body.dateOfBirth;
	user.country = req.body.country;
	user.gender = req.body.gender;
	user.fieldOfStudy = req.body.fieldOfStudy;
	user.yearOfStudies = req.body.yearOfStudies;
	user.typeOfStudies = req.body.typeOfStudies;
	user.typeOfJob = req.body.typeOfJob;
	
	if (req.body.password != req.body.passwordcheck)
	{
		req.flash('error','Passwords must match!');

		return res.render('user/signup',{
			profile: user,
			errors: req.flash('error')
		});
	}
	
	
	if (req.body.admin)
	{
		var admin = req.user && req.user.admin;
		var remoteip = req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
		var localadmin = res.locals.localhostadmin && (remoteip=="localhost" || remoteip=="127.0.0.1" || remoteip=="::ffff:127.0.0.1");
		//console.log("req.body.admin:" + req.body.admin + " ip:" + remoteip);
		if (admin || localadmin) {
			user_admin = req.body.admin;	
		}
		else
		{
			req.flash('error','Unable to create admin account!');

			return res.render('user/signup',{
				profile: user,
				errors: req.flash('error')
			});
		}
	}
	

	//console.log(req.body.name);


	/*user.profile.name=req.body.name;
	user.password=req.body.password;
	user.email=req.body.email;*/
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
				
				req.flash('success','Account created successfully');
				
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
					   return console.log(error);
					}
					console.log('Message sent: ' + info.response);
				});

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
	var referrer = req.header('Referer') || '/';
	var returnpage = req.query.r || referrer;
	
	if (!req.user) { return res.render('main/denied'); }
	req.logout();
	res.redirect(returnpage);
});


router.get('/editProfile',function(req,res,next){
	if (!req.user) { return res.render('main/denied'); }
	res.render('user/editProfile',{profile:req.user, errors: req.flash('error'), message: req.flash('success')});
});

//edit profile feature, might be modified according to user attributes and needs

router.post('/editProfile',function(req,res,next){
	if (!req.user) { return res.render('main/denied'); }
	
	if (req.body.password != req.body.passwordcheck)
	{
		req.flash('error','Passwords must match!');

		return res.render('user/editProfile',{
			profile: user,
			errors: req.flash('error')
		});
	}
	
	var user_admin = false;
	if (req.body.admin)
	{
		var admin = req.user && req.user.admin;
		var remoteip = req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
		var localadmin = res.locals.localhostadmin && (remoteip=="localhost" || remoteip=="127.0.0.1" || remoteip=="::ffff:127.0.0.1");
		//console.log("req.body.admin:" + req.body.admin + " ip:" + remoteip);
		if (admin || localadmin) {
			user_admin = req.body.admin;	
		}
		else
		{
			req.flash('error','Unable to create admin account!');

			return res.render('user/editProfile',{
				profile: user,
				errors: req.flash('error')
			});
		}
	}

	//var user = new User();	
	var password = req.body.password;
	if (!password || password == "" || password.length<1 )
	{
		password = null;
	}
	var birthday = req.body.dateOfBirth;
	//console.log("birthday:" + birthday);
	User.update({ email:req.user.email },
    { 
		admin : user_admin,
		name : req.body.name,
		email : req.body.email,
		dateOfBirth : birthday,
		country : req.body.country,
		fieldOfStudy : req.body.fieldOfStudy,
		yearOfStudies : req.body.yearOfStudies,
		typeOfStudies : req.body.typeOfStudies,
		typeOfJob : req.body.typeOfJob,
		skills : req.body.skills,
		keywords : req.body.keywords
	}, function(err, results) {
		if(err) {
			return console.log(err);
		}
		else {      
			//console.log(results);
			req.flash('success','Account details changed');
			
			res.redirect('/user/profile');
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
