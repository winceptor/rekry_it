var router= require('express').Router();
var User =require ('../models/user');
var Job = require('../models/job');
var Category = require ('../models/category');
var Application = require ('../models/application');

var config =require('../config/config');

var transporter = require('./mailer');

router.use(function(req, res, next){
	res.locals.zeroadmins = false;
	if (res.locals.zeroadmins_unrestricted)
	{
		User.count({admin:true}, function (err, count) {
			if (!err && count === 0) {
				res.locals.zeroadmins = true;
				var problem = "WARNING! RUNNING WITHOUT ACCESS RESTRICTIONS: CREATE MAIN ADMIN USER";
				req.flash('error',problem);
				console.log(problem);
				next();
			}
			else
			{
				next();
			}
		});
	}
	else
	{
		next();
	}
});


var newestjobs = [];
var featuredjobs = [];
var reloadindexjobs = function()
{
	var indexjobnumber = 10;
	var searchproperties = {query_string: {query: 'featured:false AND hidden:false'}};
	Job.search(
		searchproperties, 
		{size: indexjobnumber, sort: "date:desc"},
		function(err, results){
			if (err) return next(err);
			if (results)
			{
				hits1 = results.hits.hits.map(function(hit){
					var dat = hit._source;
					dat._id = hit._id;
					return dat;
				});
			}
			Job.populate(
				hits1, 
				[{ path: 'field'}, { path: 'type'}], 
				function(err, hits1) {			
					newestjobs = hits1;
				}
			);
		}
	);	
	
	searchproperties = {query_string: {query: 'featured:true AND hidden:false'}};
	Job.search(
		searchproperties, 
		{size: indexjobnumber, sort: "displayDate:asc"},
		function(err, results){
			if (err) return next(err);
			if (results)
			{
				hits2 = results.hits.hits.map(function(hit){
					var dat = hit._source;
					dat._id = hit._id;
					return dat;
				});
			}
			Job.populate(
				hits2, 
				[{ path: 'field'}, { path: 'type'}], 
				function(err, hits2) {
					featuredjobs = hits2;
				}
			);
		}
	);
}
reloadindexjobs();

//using format dd.mm.yyyy for date
function InputToDate(input)
{	
	if (input && input!="" && input.length>3)
	{
		var datenow = new Date();
		var parts = input.split(/\W/);
		if (parts && parts.length==3)
		{
			var yyyy = parts[2];
			var mm = parts[1];
			var dd = parts[0];
			if (yyyy>1970 && yyyy<2038 && mm>0 && mm<13 && dd>0 && dd<32)
			{
				var date = new Date(parts[2], parts[1]-1, parts[0]);
				return date.getTime();
			}
		}
		return "";
	}
	return "";
}
function DateToInput(date) {
	if (!date || date=="" || date.length<3)
	{
		return "";
	}
	var date = new Date(Date.parse(date));
	var dd = date.getDate(); 
	var mm = date.getMonth()+1; 
	var yyyy = date.getFullYear(); 
	if(dd<10){dd="0"+dd} 
	if(mm<10){mm="0"+mm} 
	//return yyyy+"-"+mm+"-"+dd;
	return dd + "." + mm + "." + yyyy;
}
function DateToDate(date)
{
	return InputToDate(DateToInput(date));
}


var defaultsort = "_score:desc";
var sortmethods = [defaultsort];
function loadsortmethods() {
	sortmethods = config.sortmethods || sortmethods;
	defaultsort = config.default_sort || defaultsort;
}
loadsortmethods();

router.use(function(req, res, next) {
	var referrer = req.header('Referer') || "/";
	res.locals.returnpage = referrer;
	
	res.locals.default_searchlimit = config.default_searchlimit;
	res.locals.default_listlimit = config.default_listlimit;
	res.locals.searchlistlimit = res.locals.default_listlimit;
	
	res.locals.defaultsort = defaultsort;
	res.locals.sortmethods = sortmethods;
	
	res.locals.logfile = config.log_filename;
	
	res.locals.InputToDate = InputToDate;
	res.locals.DateToInput = DateToInput;
	res.locals.DateToDate = DateToDate;
	
	var LastDay = new Date();
	LastDay.setDate(LastDay.getDate() - 1);
	res.locals.LastDay = DateToDate(LastDay);
	
	var Today = new Date();
	res.locals.Today = DateToDate(Today);
	
	res.locals.newestjobs = newestjobs;
	res.locals.featuredjobs = featuredjobs;
	res.locals.reloadindexjobs = reloadindexjobs;
	
	res.locals.remoteip = req.connection.remoteAddress || 
	 req.socket.remoteAddress || "invalid";
	 
	res.locals.hosturl = "http://" + req.headers.host;
	
	res.locals.searchquery = config.default_searchquery;
	
	res.locals.languagecode = "en";
	next();
});

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
				//http://stackoverflow.com/questions/3115150/how-to-escape-regular-expression-special-characters-using-javascript
				var escaped = words[k].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
				
				var query = new RegExp("(\\b" + escaped + "\\b)", "gim");
				output = output.replace(query, "<span class='highlight'>$1</span>");
			}
			
			return output;
		}
		return input;
	}
	res.locals.highlight_term = "";
	next();
});

router.get('/errortest',function(req,res){
	var fs = require('fs');
	var data = fs.readFileSync('./errortest', 'utf8', function(err, data){
		if (err) {
			console.log(err);
			return false; 
		}
	});
});

router.get('/',function(req,res,next){
	res.render('main/index',{
		newestjobs: res.locals.newestjobs,
		featuredjobs: res.locals.featuredjobs,
		errors: req.flash('error'), message:req.flash('success')
	});
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

	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_searchlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	var query = req.query.q;
	
	var jobfield = req.query.f || false;
	var jobtype = req.query.t || false;
	var sortmethod = req.query.s || false;
	
	var querystring = res.locals.searchquery + " displayDate:>" + res.locals.LastDay;
	
	if (query)
	{
		querystring += query + " ";
	}
	if (jobfield)
	{
		jobfield = typeof jobfield=="string" ? jobfield : jobfield.join(" OR ");
		querystring += "field:(" + jobfield + ") ";
	}
	if (jobtype)
	{
		jobtype = typeof jobtype=="string" ? jobtype : jobtype.join(" OR ");
		querystring += "type:(" + jobtype + ") ";
	}
		
	var searchproperties = {"query" : {	"match_all" : {} } };
	var defaultsort = "displayDate:asc";
	var sort = sortmethod || defaultsort;
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
	}
	
	if (query && query!="")
	{
		sort = sortmethod || res.locals.defaultsort;
	}
	
	res.locals.highlight_term = query;	

	Job.search(
		searchproperties, 
		{from: frm, size: num, sort: sort},
		function(err, results){
			if(err) return next(err);
			//var hits = results.hits.hits;
			var total = results.hits.total;
			var mapped = results.hits.hits.map(function(hit){
				var dat = hit._source;
				dat._id = hit._id;
				return dat;
			});
			Job.populate(
				mapped, 
				[{ path: 'field'}, { path: 'type'}], 
				function(err, hits) {
					res.render('main/search',{
						query:query,
						jobfield:jobfield,
						jobtype:jobtype,
						sortmethod:sortmethod,
						defaultsort:defaultsort,
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

router.get('/job/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	var highlight = req.query.h || "";
	
	res.locals.highlight_term = highlight;
	
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
				if(err) return next(err);
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
			querystring += "field:(" + category._id + ") ";
		}
		if (category.category=="type")
		{
			querystring += "type:(" + category._id + ") ";
		}
		if (category.category=="level" || category.category=="other")
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
						if(err) return next(err);
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
				if(err) return next(err);
				res.render('main/profile',{
					data:profile,
					returnpage:encodeURIComponent(referrer), 
					errors: req.flash('error'), message:req.flash('success')
				});
			}
		);
	});
});

router.get('/application/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	Application.findById({_id:req.params.id},function(err,application){
		if(err) return next(err);
		if (!application)
		{
			console.log("error null application");
			return next();
		}
		Application.populate(
			application, 
			[{ path: 'user'}, { path: 'job'}], 
			function(err, application) {
				if(err) return next(err);
				res.render('main/application',{
					data:application,
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
		Job.populate(
			job, 
			[{ path: 'field'}, { path: 'type'}], 
			function(err, hits) {
				if(err) return next(err);
				res.render('main/apply',{
					data:job,
					returnpage:encodeURIComponent(referrer), 
					errors: req.flash('error'), message:req.flash('success')
				});
			}
		);
	});
});


router.post('/apply/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	var returnpage = req.query.r || referrer;	

	
	if (!req.user)
	{
		req.flash('error','###needlogin###');
		return res.render('main/denied',{
			errors: req.flash('error'), message: req.flash('success')
		});
	}
	var applicant = req.user;
	Job.findById({_id:req.params.id})
		.exec(function(err,job){
		if(err) return next(err);
		if (!job)
		{
			console.log("error null job");
			return next(err);
		}
		
		Job.populate(
			job, 
			[{ path: 'field'}, { path: 'type'}], 
			function(err, hits) {
				//apply
				
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
				
				applicationtext += "<a href='" + transporter.hostname + "/profile/" + applicant.id + "'><h2>Applicant details (link)</h2></a>";
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
				
				var application = new Application();
				application.user = req.user.id;
				application.job = req.params.id;
				application.application = req.body.application;
				
				application.save(function(err) {
					if (err) return next(err);
					req.flash('success', 'Application sent!');						
					return res.redirect(referrer);	
				});
				
			}
		);
	});
});


module.exports=router;
