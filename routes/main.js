var router= require('express').Router();
var User =require ('../models/user');
var Job = require('../models/job');
var Category = require ('../models/category');

var transporter = require('./mailer');

router.get('/',function(req,res,next){
	var featurednumber = 3;
	
	var hits1 = false;
	var hits2 = false;
	
	var searchproperties = {query_string: {query: 'featured:false AND hidden:false AND displayDate:(>now)'}};
	Job.search(
		searchproperties, 
		{hydrate: true, size: featurednumber, sort: "date:desc"},
		function(err, results){
			if (err) return next(err);
			if (results)
			{
				hits1 = results.hits.hits;
			}	
			searchproperties = {query_string: {query: 'featured:true AND hidden:false'}};
			Job.search(
				searchproperties, 
				{hydrate: true, sort: "date:asc"},
				function(err, results){
					if (err) return next(err);
					if (results)
					{
						hits2 = results.hits.hits;
					}
					res.render('main/index',{
						newestjobs: hits1,
						featuredjobs: hits2,
						errors: req.flash('error'), message:req.flash('success')
					});
				}
			);
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
	
	//var queryarray = ["hidden:false AND (displayDate:>now OR featured:true)"]; //skip hidden results in public search
	//var queryarray = [];
	var queryarray = ["((hidden:false AND displayDate:(>now)) OR featured:true)"];
	if (query!="")
	{
		queryarray.push(query);
	}
	if (jobfield!="")
	{
		jobfield = "field:(" + jobfield + ")";
		queryarray.push(jobfield);
	}
	if (jobtype!="")
	{
		jobtype = "type:(" + jobtype + ")";
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

router.get('/category',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	var query = req.query.q || "";
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.searchlimit;
	var frm = Math.max(0,page*num-num);
	
	var nam = req.query.nam || "";
	var cat = req.query.cat || "";
	
	Category.findOne({name:nam, category:cat},function(err,category){
		if(err) return next(err);
		if (!category) return next();
		
		var queryarray = ["((hidden:false AND displayDate:(>now)) OR featured:true)"];

		if (query!="")
		{
			queryarray.push(query);
		}
		if (category.category=="Job field")
		{
			jobfield = "field:(" + category.name + ")";
			queryarray.push(jobfield);
		}
		if (category.category=="Job type")
		{
			jobtype = "type:(" + category.name + ")";
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
				res.render('main/category',{
					category:category,
					jobs:hits,
					query:query, 
					page:page, 
					number:num, 
					total:total, 
					returnpage:encodeURIComponent(referrer), 
					errors: req.flash('error'), message:req.flash('success')
				});
			}
		);
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


router.get('/apply/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	Job.findById({_id:req.params.id})
		.exec(function(err,job){
		if(err) return next(err);
		if (!job)
		{
			console.log("error null job");
			return next();
		}
		res.render('main/apply',{
			job:job,
			returnpage:encodeURIComponent(referrer), 
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});


router.post('/apply/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	var returnpage = req.query.r || referrer;	
	
	Job.findById({_id:req.params.id})
		.exec(function(err,job){
		if(err) return next(err);
		if (!job)
		{
			console.log("error null job");
			return next(err);
		}
		//apply
		var applicant = req.user;
		var applicationtext = "<h1>This is an email confirming your application for job: " + job.title + "</h1><br><h3>Application:</h3>" + req.body.application;
		applicationtext += "<br><a href='" + transporter.hostname + "/profile/" + req.user.id + "'><h2>Applicant details (link)</h2></a>";
		applicationtext += "<br><a href='" + transporter.hostname + "/job/" + req.params.id + "'><h2>Job details (link)</h2></a>";
		var mailOptions = {
			from: transporter.sender, // sender address
			to: '"' + applicant.name + '" <' + applicant.email + '>', // list of receivers
			subject: res.locals.trans('Application sent'), // Subject line
			html: applicationtext // plaintext body
		};

		//Send e-mail
		transporter.sendMail(mailOptions, function(error, info){
			if(error){
			   console.log(err);
				return next(err);
			}
		});
		
		applicationtext = "<h1>You have received application for job: " + job.title + "</h1>";
		applicationtext += "<h2>Applicant information:</h2>";
		applicationtext += "<br>Name: " + applicant.name;
		applicationtext += "<br>Email: " + applicant.email;
		applicationtext += "<br>Date of birth: " + applicant.dateOfBirth;
		applicationtext += "<br>Studies: " + applicant.yearOfStudies + "/" + applicant.typeOfStudies;
		applicationtext += "<br>Skills: " + applicant.skills;
		applicationtext += "<br>Application: " + req.body.application;
		
		applicationtext += "<br><a href='" + transporter.hostname + "/profile/" + req.user.id + "'><h2>Applicant details (link)</h2></a>";
		applicationtext += "<br><a href='" + transporter.hostname + "/job/" + req.params.id + "'><h2>Job details (link)</h2></a>";
		
		var mailOptions = {
			from: transporter.sender, // sender address
			to: '"' + job.company + '" <' + job.email + '>', // list of receivers
			subject: res.locals.trans('Application received'), // Subject line
			html: applicationtext // plaintext body
		};

		//Send e-mail
		transporter.sendMail(mailOptions, function(error, info){
			if(error){
			   console.log(err);
				return next(err);
			}
		});
		
		req.flash('success', 'Application sent!');
									
		return res.redirect(returnpage);	
	});
});


module.exports=router;
