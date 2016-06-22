var router= require('express').Router();
var User =require ('../models/user');
var Job = require('../models/job');
var Field = require ('../models/field');

router.get('/',function(req,res){
	res.render('main/index',{
		errors: req.flash('error'), message:req.flash('success')
	});
});

router.get('/language/:language',function(req,res){
	var referrer = req.header('Referer') || '/';
	var language = req.params.language;
	if (res.locals.languages[language])
	{
		res.cookie('language', language, { maxAge: 365 * 24 * 60 * 60 });
	}
	res.redirect(referrer);
});

router.get('/about',function(req,res){
	res.render('main/about',{
		errors: req.flash('error'), message:req.flash('success')
	});
});

router.get('/employers',function(req,res){
	res.render('main/forEmployers',{
		errors: req.flash('error'), message:req.flash('success')
	});
});

router.post('/search',function(req,res,next){
	res.redirect('/search');
});

router.get('/search',function(req,res,next){
	var query = req.query.q || "";
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.searchlimit;
	var frm = Math.max(0,page*num-num);
	
	var jobfield = req.query.f || "";
	var jobtype = req.query.t || "";
	
	var queryarray = [];
	if (query!="")
	{
		queryarray.push(query);
	}
	if (jobfield!="")
	{
		queryarray.push(jobfield);
	}
	if (jobtype!="")
	{
		queryarray.push(jobtype);
	}
	var querystring = queryarray.join(" AND ");
	
	var searchproperties = {"query" : {	"match_all" : {} } };
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "OR"}};
	}
	
	Job.search(
		searchproperties, 
		{hydrate: true, from: frm, size: num, sort: "date:desc"},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			var total = results.hits.total;
			res.render('main/search',{
				query:query,
				jobfield:jobfield,
				jobtype:jobtype,
				data:hits, 
				page:page, 
				number:num, 
				total:total, 
				errors: req.flash('error'), message:req.flash('success')
			});
		}
	);

});

/*
router.get('/jobs/:id',function(req,res,next){
	Job
	.find({field:req.params.id})
	.populate('field')
	.exec(function(err,jobs){
		if(err) return next(err);
		res.render('main/findjob',{jobs:jobs});
	});

});
*/

router.get('/job/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	Job.findById({_id:req.params.id})
		.populate('field')
		.exec(function(err,job){
		if(err) return next(err);
		if (!job)
		{
			console.log("error null job");
			return next();
		}
		res.render('main/job',{
			job:job,
			returnpage:encodeURIComponent(referrer), 
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});


router.get('/field/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	Field.findById({_id:req.params.id},function(err,field){
		if(err) return next(err);
		if (!field) return next();
		Job
		.find({field:field})
		.populate('field')
		.exec(function(err,jobs){
			if(err) return next(err);
			console.log(jobs.length);
			res.render('main/field',{
				field:field,
				data:jobs, 
				errors: req.flash('error'), message:req.flash('success')
			});
		});
	});
});

router.get('/profile/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	User.findById({_id:req.params.id},function(err,user){
		if(err) return next(err);
		if (!user)
		{
			console.log("error null user");
			return next();
		}
		res.render('main/user',{
			profile:user,
			returnpage:encodeURIComponent(referrer), 
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});


module.exports=router;
