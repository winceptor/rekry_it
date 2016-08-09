var fs = require('fs');

var express = require('express');
var router = express.Router();

var User = require('../models/user');
var secret = require('../config/secret');


router.use(function(req,res,next){
	if (!res.locals.zeroadmins && (!req.user || !req.user.admin)) { return res.denied("###denied###"); }
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

var documentRoutes=require('./document-management');
router.use(documentRoutes);

var favoriteRoutes=require('./favorite-management');
router.use(favoriteRoutes);

var feedbackRoutes=require('./feedback-management');
router.use(feedbackRoutes);

//JSON.stringify(data)
module.exports=router;
