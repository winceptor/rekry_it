var fs = require('fs');

var express = require('express');
var router = express.Router();

var User = require('../models/user');
var secret = require('../config/secret');


router.use(function(req,res,next){
	if (!res.locals.zeroadmins && (!req.user || !req.user.admin)) { return res.redirect("/denied"); }
	next();
});
	
var jobRoutes=require('./job-management');
router.use(jobRoutes);

var userRoutes=require('./user-management');
router.use(userRoutes);

var categoryRoutes=require('./category-management');
router.use(categoryRoutes);

var applicationRoutes=require('./application-management');
router.use(applicationRoutes);

//JSON.stringify(data)
module.exports=router;
