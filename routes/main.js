var router= require('express').Router();
var User =require ('../models/user');
var Job = require('../models/job');
var Category = require ('../models/category');

router.get('/',function(req,res,next){
	var featurednumber = 3;
	
	var searchproperties = {query_string: {query: 'featured:false AND hidden:false'}};
	Job.search(
		searchproperties, 
		{hydrate: true, size: featurednumber, sort: "date:desc"},
		function(err, results){
			if (err) return next(err);
			if (results)
			{
				var hits1 = results.hits.hits;
				
				searchproperties = {query_string: {query: 'featured:true AND hidden:false'}};
				Job.search(
					searchproperties, 
					{hydrate: true, sort: "displayDate:asc"},
					function(err, results){
						if (err) return next(err);
						if (results)
						{
							var hits2 = results.hits.hits;
							res.render('main/index',{
								newestjobs: hits1,
								featuredjobs: hits2,
								errors: req.flash('error'), message:req.flash('success')
							});
						}
					}
				);
			}
		}
	);
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


router.get('/privacy',function(req,res){
	res.render('main/privacy',{
		errors: req.flash('error'), message:req.flash('success')
	});
});


router.get('/terms',function(req,res){
	res.render('main/terms',{
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
	
	var queryarray = ["hidden:false AND displayDate:>now"]; //skip hidden results in public search
	//var queryarray = [];
	if (query!="")
	{
		queryarray.push(query);
	}
	if (jobfield!="")
	{
		jobfield = "field:(" + jobfield + ")";
		console.log(jobfield);
		queryarray.push(jobfield);
	}
	if (jobtype!="")
	{
		jobtype = "type:(" + jobtype + ")";
		console.log(jobtype);
		queryarray.push(jobtype);
	}
	var querystring = queryarray.join(" AND ");
	
	var searchproperties = {"query" : {	"match_all" : {} } };
	if (querystring!="")
	{
		console.log("querystring:" + querystring);
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


router.get('/category/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	Category.findById({_id:req.params.id},function(err,category){
		if(err) return next(err);
		if (!category) return next();
		Job
		.find({category:category.name})
		.exec(function(err,jobs){
			if(err) return next(err);
			console.log(jobs.length);
			res.render('main/category',{
				category:category,
				jobs:jobs, 
				returnpage:encodeURIComponent(referrer), 
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
