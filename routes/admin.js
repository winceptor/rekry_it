var router = require('express').Router();
var Field = require('../models/field');
var Job = require('../models/job');
var User = require('../models/user');



router.use(function(req,res,next){
	if (!req.user || !req.user.admin) { return res.render('main/denied'); }
	next();
});

var jobRoutes=require('./job-management');
router.use(jobRoutes);

var userRoutes=require('./user-management');
router.use(userRoutes);

var categoryRoutes=require('./category-management');
router.use(categoryRoutes);

//JSON.stringify(data)
module.exports=router;
