var fs = require('fs');

var express = require('express');
var router = express.Router();

var User = require('../models/user');
var secret = require('../config/secret');

User.count(function (err, count) {
    if (!err && count === 0) {
    
		var defaultuser = new User();
		
		defaultuser.admin = true;
		defaultuser.name = secret.admin_name;	
		defaultuser.email = secret.admin_email;
		defaultuser.password = secret.admin_pass;

		defaultuser.save(function(err,user){
			if(err) return next (err);
			console.log("Created default admin user:'" + secret.admin_email + "' pass:'" + secret.admin_pass + "'. Login and change password!");
		});
	}
});

router.use(function(req,res,next){
	if (!req.user || !req.user.admin) { return res.render('main/denied'); }
	next();
});

router.get('/server-log',function(req,res,next){
	var filename = res.locals.logfile;
	
	res.writeHead(200, {'Content-Type': 'text/plain'});
	try {
		var data = fs.accessSync('./log/'+filename, fs.F_OK, function(err, data){
			if (err) {
				console.log(err);
				return false; 
			}
		});
		var data = fs.readFileSync('./log/'+filename, 'utf8', function(err, data){
			if (err) {
				console.log(err);
				return false; 
			}
		});
		res.end(data);
		return true;
	} catch (e) {
		//console.log(e);
		res.end('Could not read ' + filename + ' file!');
	}
	return false;
});

	
var jobRoutes=require('./job-management');
router.use(jobRoutes);

var userRoutes=require('./user-management');
router.use(userRoutes);

var categoryRoutes=require('./category-management');
router.use(categoryRoutes);

//JSON.stringify(data)
module.exports=router;
