var router= require('express').Router();
var User= require('../models/user');
var passport=require('passport');

var crypto = require('crypto');

var request = require('request');

var passportConf=require('./passport');
var transporter = require('./mailer');

function SendVerification(user, res, cb) {
	if (!user) {
	  return;
	}	
	crypto.randomBytes(20, function(err, buf) {
		if(err) return next (err);
		var token = buf.toString('hex');

	


		user.verifyToken = token;
		user.verifyExpires = Date.now() + 60*60*1000*24; // 1 day

		user.save(function(err) {
			if(err) return next (err);
			
			var recipient = '"' + user.name + '" <' + user.email + '>';
			var title = res.locals.trans('###email### ###verification###');
			
			var mailParameters = {
				to: recipient, 
				subject: title, 
				token: token
			};
			var mailOptions = transporter.render('email/user-verification', mailParameters, res.locals);

			//Send e-mail
			transporter.sendMail(mailOptions, function(error, info){
				if(error){
					console.log("error sending email");
				   console.log(error);
				   console.log(info);
				   return;
				}
				console.log('Message sent: ' + info.response);
			});		
		});
	});
}

router.get('/login',function(req,res, next){
	if (req.user) {
		res.redirect("/user/profile");
	}
	var redirectpage = req.query.r || "/";
	res.render('user/login',{
		redirectpage: redirectpage,
		username: false, 
		errors: req.flash('error'), message:req.flash('success')
	});
});

/*
router.post('/login', function(req, res, next) {
	
	var redirectpage = req.body.redirectpage || '/';
	
	passport.authenticate('local-login', {
		successRedirect: redirectpage,
		failureRedirect: '/user/login',
		failureFlash: true
	})(req,res,next);
});*/


router.post('/login', function(req, res, next) {
	var redirectpage = req.body.redirectpage || '/';
	
	var username = req.body.email;
	var password = req.body.password;
	
	if (!username || !password)
	{
		return res.render('user/login',{
			redirectpage: redirectpage,
			username: false, 
			errors: req.flash('error'), message:req.flash('success')
		});
	}
	else
	{
		username = username.toLowerCase();
		//email = email.toLowerCase();
		User.findOne({email:username},function(err,user){
			if(err) return next (err);

			if(!user){
				req.flash('error','###usernameerror###');
				return res.render('user/login',{
					redirectpage: redirectpage,
					username: username, 
					errors: req.flash('error'), message:req.flash('success')
				});
			}
			if(!user.comparePassword(password)){
				req.flash('error','###passworderror###');
				return res.render('user/login',{
					redirectpage: redirectpage,
					username: username, 
					errors: req.flash('error'), message:req.flash('success')
				});
			}

			user.lastlogin = Date.now();
			user.lastip = req.connection.remoteAddress || req.socket.remoteAddress || "invalid";
			user.save(function(err) {
				if(err) return console.log(err);
			});

			req.flash('success','###loginsuccess###')
			req.logIn(user,function(err){
				if(err) return next(err);
				res.redirect(redirectpage);
			});
		});
	}
});

router.post('/signup',function(req,res,next){
	
	//var redirectpage = req.body.redirectpage || '/';
	var redirectpage = "/user/profile";
	
	var user = new User();
	

	var problem = user.processForm(req, res, true);
	if(req.body.terms == undefined || req.body.terms == null) {
		problem += "<br>###accept### ###terms###";
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
	
	request(res.locals.captchaurl,function(error,response,body) {
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
						
						SendVerification(user, res);
						
						req.logIn(user,function(err){
							if(err) return next(err);
							res.redirect(redirectpage);
						});
						
					});
				}
			});
		}
	});
});
router.get('/signup', function(req, res, next) {
	if (req.user) {
		res.redirect("/user/profile");
	}
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

		return res.status(403).render('denied',{
			profile: false,
			errors: req.flash('error'), message:req.flash('success')
		});
	}
	

	return res.render('user/profile',{
		entry: req.user,
		errors: req.flash('error'), message:req.flash('success')
	});
	
});

router.get('/logout',function(req,res,next){
	if (!req.user) { return res.redirect("/"); }
	req.logout();
	res.redirect("/");
});


router.get('/reverify',function(req,res,next){
	if (!req.user) { return res.redirect("/"); }
	SendVerification(req.user, res);
	req.flash('success', 'An e-mail with verification link has been sent.');
	res.redirect("/");	
});

   
router.get('/verify/:token', function(req, res) {
	User.findOne({ verifyToken: req.params.token, verifyExpires: { $gt: Date.now() } }, function(err, user) {
		if(err) return next (err);
		if (!user) {
			req.flash('error', 'Verify token is invalid or has expired.');
			return res.redirect('/user/login');
		}
		user.verifyToken = undefined;
        user.verifyExpires = undefined;
		user.verified = true;
		user.save(function(err) {
			if(err) return next (err);
			req.flash('success', 'Your account is now verified!');
			return res.redirect('/user/login');
		});
	});
});


router.get('/edit',function(req,res,next){
	if (!req.user) { return res.denied("###denied###"); }
	res.render('user/edit',{profile:req.user, errors: req.flash('error'), message: req.flash('success')});
});

//edit profile feature, might be modified according to user attributes and needs

router.post('/edit',function(req,res,next){
	if (!req.user) { return res.denied("###denied###"); }
	

	User.findById(req.user._id, function(err, user) {
		if(err) return next (err);

		var problem = user.processForm(req, res);
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

	request(res.locals.captchaurl,function(error,response,body) {
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
						
						var recipient = '"' + user.name + '" <' + user.email + '>';
						var title = '###forgotpass###';
							
						var mailParameters = {
								to: recipient, 
								subject: title,
								token: token
							};
						var mailOptions = transporter.render('email/user-forgotpass', mailParameters, res.locals);

						//Send e-mail
						transporter.sendMail(mailOptions, function(error, info){
							if(error){
							   return console.log(error);
							}
							console.log('Message sent: ' + info.response);
							req.flash('success', '###email### ###sent###');
							
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
				var title = '###password### ###changed###';
				//var message = 'Hello ' + user.name + ',\n\n' +
          //'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n';
				
				var mailParameters = {
						to: recipient, 
						subject: title, 
					};
				var mailOptions = transporter.render('email/user-newpass', mailParameters, res.locals);
						
				//Send e-mail
				transporter.sendMail(mailOptions, function(error, info){
					if(error){
					   return console.log(error);
					}
					//console.log('Message sent: ' + info.response);
					req.flash('success', '###password### ###changed###');
					
					res.redirect("/");
				});	
			});
        });
    });
});



module.exports= router;
