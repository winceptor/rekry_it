var router= require('express').Router();
var User =require ('../models/user');
var Job = require('../models/job');
var Category = require ('../models/category');

var transporter = require('./mailer');

//WORD HIGLIGHTING MIDDLEWARE
router.use(function(req, res, next) {
	res.locals.highlight = function(input, term)
	{
		var output = input;
		var term = term || res.locals.highlight_term;
		if (term && term!="")
		{
			var words = term.split(" ");
			for (k in words)
			{
				var query = new RegExp("(\\b" + words[k] + "\\b)", "gim");
				output = output.replace(query, "<span class='highlight'>$1</span>");
			}
			
			return output;
		}
		return input;
	}
	res.locals.highlight_term = "";
	next();
});


router.get('/',function(req,res,next){
	var newjobnumber = 3;
	
	var hits1 = [];
	var hits2 = [];
	
	var searchproperties = {query_string: {query: 'featured:false AND hidden:false AND displayDate:(>now)'}};
	Job.search(
		searchproperties, 
		{hydrate: true, size: newjobnumber, sort: "date:desc"},
		function(err, results){
			if (err) return next(err);
			if (results)
			{
				hits1 = results.hits.hits;
			}
			Job.populate(
				hits1, 
				[{ path: 'field'}, { path: 'type'}], 
				function(err, hits1) {			
					searchproperties = {query_string: {query: 'featured:true AND hidden:false'}};
					Job.search(
						searchproperties, 
						{hydrate: true, sort: "date:desc"},
						function(err, results){
							if (err) return next(err);
							if (results)
							{
								hits2 = results.hits.hits;
							}
							Job.populate(
								hits2, 
								[{ path: 'field'}, { path: 'type'}], 
								function(err, hits2) {
									res.render('main/index',{
										newestjobs: hits1,
										featuredjobs: hits2,
										errors: req.flash('error'), message:req.flash('success')
									});
								}
							);
						}
					);
				}
			);
		}
	);
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
	var num = req.query.n || res.locals.default_searchlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	var jobfield = req.query.f || "";
	var jobtype = req.query.t || "";
	
	var querystring = res.locals.searchquery;
	
	if (query!="")
	{
		querystring += query + " ";
	}
	if (jobfield!="")
	{
		querystring += "field:(" + jobfield.split(",").join(" OR ") + ") ";
	}
	if (jobtype!="")
	{
		querystring += "type:(" + jobtype.split(",").join(" OR ") + ") ";
	}
		
	var searchproperties = {"query" : {	"match_all" : {} } };
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
	}
	
	res.locals.highlight_term = query;
	
	Job.search(
		searchproperties, 
		{hydrate: true, from: frm, size: num, sort: "date:desc"},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			var total = results.hits.total;
			Job.populate(
				hits, 
				[{ path: 'field'}, { path: 'type'}], 
				function(err, hits) {
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
		Job.populate(
			job, 
			[{ path: 'field'}, { path: 'type'}], 
			function(err, job) {
				res.render('main/job',{
					data:job,
					returnpage:encodeURIComponent(referrer), 
					errors: req.flash('error'), message:req.flash('success')
				});
			}
		);
	});
});

router.get('/category/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	var query = req.query.q || "";
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_searchlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	Category.findById({_id:req.params.id},function(err,category){
		if(err) return next(err);
		if (!category) return next();
		
		
		var querystring = res.locals.searchquery;
		
		if (query!="")
		{
			querystring += query + " ";
		}
		
		if (category.category=="field")
		{
			querystring += "field:(" + category.name + ") ";
		}
		if (category.category=="type")
		{
			querystring += "type:(" + category.name + ") ";
		}
		if (category.category=="level")
		{
			querystring += category.name + " ";
		}
		
		var searchproperties = {"query" : {	"match_all" : {} } };
		if (querystring!="")
		{
			searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
		}
		Job.search(
			searchproperties,
			{hydrate: true, from: frm, size: num, sort: "date:desc"},
			function(err, results){
				if(err) return next(err);
				var hits = results.hits.hits;
				var total = results.hits.total;
				Job.populate(
					hits, 
					[{ path: 'field'}, { path: 'type'}], 
					function(err, hits) {
						res.render('main/category',{
							data:category,
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
			}
		);
	});
});

router.get('/profile/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	User.findById({_id:req.params.id},function(err,profile){
		if(err) return next(err);
		if (!profile)
		{
			console.log("error null user");
			return next();
		}
		User.populate(
			profile, 
			[{ path: 'fieldOfStudy'}, { path: 'typeOfStudies'}], 
			function(err, profile) {
				res.render('main/profile',{
					data:profile,
					returnpage:encodeURIComponent(referrer), 
					errors: req.flash('error'), message:req.flash('success')
				});
			}
		);
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
			entry:job,
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
		var title = res.locals.trans('Application sent');
		var applicationtext = "<h1>This is an email confirming your application for job: " + job.title + "</h1>";
		applicationtext += "<h2>Application:</h2>" + req.body.application;
		applicationtext += "<h2>Job details:</h2>";
		applicationtext += "<br>Title: " + job.title;
		applicationtext += "<br>Company: " + job.company;
		applicationtext += "<br>Address: " + job.address;
		applicationtext += "<br>Skills: " + job.skills;
		applicationtext += "<br>Beginning: " + job.beginning;
		applicationtext += "<br>Duration: " + job.duration;
		applicationtext += "<br>Description: " + job.description;
		
		applicationtext += "<a href='" + transporter.hostname + "/profile/" + req.user.id + "'><h2>Applicant details (link)</h2></a>";
		applicationtext += "<a href='" + transporter.hostname + "/job/" + req.params.id + "'><h2>Job details (link)</h2></a>";
		var mailOptions = {
			from: transporter.sender, // sender address
			to: '"' + applicant.name + '" <' + applicant.email + '>', // list of receivers
			subject: title, // Subject line
			//html: applicationtext // plaintext body
			html: transporter.render('generic',{title:title, message:applicationtext},res.locals)
		};

		//Send e-mail
		transporter.sendMail(mailOptions, function(error, info){
			if(error){
			   console.log(err);
				return next(err);
			}
		});
		
		title = res.locals.trans('Application received');
		
		applicationtext = "<h1>You have received application for your job offer: " + job.title + "</h1>";
		applicationtext += "<h2>Applicant information:</h2>";
		applicationtext += "<br>Name: " + applicant.name;
		applicationtext += "<br>Email: " + applicant.email;
		applicationtext += "<br>Date of birth: " + res.locals.DateToInput(applicant.dateOfBirth);
		applicationtext += "<br>Studies: " + applicant.yearOfStudies + "/" + applicant.typeOfStudies;
		applicationtext += "<br>Skills: " + applicant.skills;
		applicationtext += "<br>Application: " + req.body.application;
		
		applicationtext += "<a href='" + transporter.hostname + "/profile/" + req.user.id + "'><h2>Applicant details (link)</h2></a>";
		applicationtext += "<a href='" + transporter.hostname + "/job/" + req.params.id + "'><h2>Job details (link)</h2></a>";
		
		var mailOptions = {
			from: transporter.sender, // sender address
			to: '"' + job.company + '" <' + job.email + '>', // list of receivers
			subject: title, // Subject line
			//html: applicationtext // plaintext body
			html: transporter.render('generic',{title:title, message:applicationtext},res.locals)
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
