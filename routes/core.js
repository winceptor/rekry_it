var fs = require('fs');

var router= require('express').Router();

var User =require ('../models/user');
var Job = require('../models/job');
var Category = require ('../models/category');
var Application = require ('../models/application');
var Document = require ('../models/document');
var Favorite = require ('../models/favorite');

var secret =require('../config/secret');
var config =require('../config/config');

var countries = require('country-list')().getNames();
var sanitize = require('elasticsearch-sanitize');


var newestjobs = [];
var featuredjobs = [];
var reloadindexjobs = function()
{
	var LastDay = new Date();
	LastDay.setDate(LastDay.getDate() - 1);
	
	var indexjobnumber = 3;
	var querystring = "displayDate:>" + LastDay.getTime() + " featured:false hidden:false";
	var searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
	Job.search(
		searchproperties, 
		{size: indexjobnumber, sort: "date:desc"},
		function(err, results){
			if (err) return console.log(err);
			if (results)
			{	
				var hits = results.hits.hits;
				hits = hits.filter(function(e){return e}); 
				var total = results.hits.total-results.hits.hits.length+hits.length;
			
				hits1 = hits.map(function(hit){
					var dat = hit._source;
					dat._id = hit._id;
					return dat;
				});
				Job.populate(
					hits1, 
					[{ path: 'user'}],  
					function(err, hits1) {			
						newestjobs = hits1;
					}
				);
			}
		}
	);	
	querystring = "displayDate:>" + LastDay.getTime() + " featured:true hidden:false";
	searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
	Job.search(
		searchproperties, 
		{size: indexjobnumber, sort: "displayDate:asc"},
		function(err, results){
			if (err) return console.log(err);

			if (results)
			{			
				var hits = results.hits.hits;
				hits = hits.filter(function(e){return e}); 
				var total = results.hits.total-results.hits.hits.length+hits.length;
			
				hits2 = hits.map(function(hit){
					var dat = hit._source;
					dat._id = hit._id;
					return dat;
				});
				Job.populate(
					hits2, 
					[{ path: 'user'}], 
					function(err, hits2) {
						featuredjobs = hits2;
					}
				);
			}
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
		if (parts && parts.length>=3)
		{
			var yyyy = parts[2];
			var mm = parts[1];
			var dd = parts[0];
			if (yyyy>1970 && yyyy<2038 && mm>0 && mm<13 && dd>0 && dd<32)
			{
				var date = new Date(parts[2], parts[1]-1, parts[0]);
				return date;
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
	//no need for trailing zeros
	//if(dd<10){dd="0"+dd} 
	//if(mm<10){mm="0"+mm} 
	//return yyyy+"-"+mm+"-"+dd;
	return dd + "." + mm + "." + yyyy;
}
function DateToOutput(date) {
	if (!date || date=="" || date.length<3)
	{
		return "";
	}
	var date = new Date(Date.parse(date));
	var dd = date.getDate(); 
	var mm = date.getMonth()+1; 
	var yyyy = date.getFullYear(); 
	//no need for trailing zeros
	//if(dd<10){dd="0"+dd} 
	//if(mm<10){mm="0"+mm} 
	//return yyyy+"-"+mm+"-"+dd;
	var hour = date.getHours(); 
	var min = date.getMinutes(); 
	if(hour<10){hour="0"+hour} 
	if(min<10){min="0"+min} 
	return dd + "." + mm + "." + yyyy + " " + hour + ":" + min;
}
function DateToTime(date) {
	if (!date || date=="" || date.length<3)
	{
		return "";
	}
	var date = new Date(Date.parse(date));
	var hour = date.getHours(); 
	var min = date.getMinutes(); 
	var sec = date.getSeconds();
	if(hour<10){hour="0"+hour} 
	if(min<10){min="0"+min} 
	if(sec<10){sec="0"+sec} 
	return hour + ":" + min + ":" + sec;
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


//UNRESTRICTED MODE MIDDLEWARE
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


//VARIOUS RESPONSES
router.use(function(req,res,next){
	//fatal error
	res.fatalerror = function(req, res, err) {
		var content = "ERROR" + " 400 - " + "Something went terribly wrong! Please contact administrator!";
		return res.status(400).render('message',{result: 'error', content: content});
	}

	//result message
	res.resultmessage = function(result, content) {
		return res.render('message',{result: result, content: content, closable: true});
	}
	
	res.missing = function(msg) {
		var content = "ERROR" + " 404 - " + msg;
		res.status(404).render('message',{result: 'error', content: content});
	}
	
	res.denied = function(msg) {
		var content = "ERROR" + " 403 - " + msg;
		res.status(403).render('message',{result: 'error', content: content});
	}
	next();
});



router.use(function(req, res, next) {
	res.locals.default_searchlimit = config.default_searchlimit;
	res.locals.default_listlimit = config.default_listlimit;
	res.locals.searchlistlimit = res.locals.default_listlimit;
	
	res.locals.resultlimits = config.resultlimits || [10,20,50,100,250,1000];
	
	res.locals.defaultsort = defaultsort;
	res.locals.sortmethods = sortmethods;
	
	res.locals.logfile = config.log_filename;
	
	res.locals.sanitize = sanitize;
	
	res.locals.InputToDate = InputToDate;
	res.locals.DateToInput = DateToInput;
	res.locals.DateToDate = DateToDate;
	res.locals.DateToOutput = DateToOutput;
	
	var LastDay = new Date();
	LastDay.setDate(LastDay.getDate() - 1);
	res.locals.LastDay = DateToDate(LastDay);
	
	var Today = new Date();
	res.locals.Today = DateToDate(Today);
	
	var Datestamp = new Date();
	res.locals.Datestamp = DateToInput(Datestamp);
	
	var Timestamp = new Date();
	res.locals.Timestamp = DateToTime(Timestamp);
	
	res.locals.newestjobs = newestjobs;
	res.locals.featuredjobs = featuredjobs;
	res.locals.reloadindexjobs = function() {
		var delay = 2000; //ms
		setTimeout(function(){ 
			reloadindexjobs();
		}, delay);
	};
	
	res.locals.remoteip = req.connection.remoteAddress || 
	 req.socket.remoteAddress || "invalid";
	 
	res.locals.hosturl = "http://" + req.headers.host;
	
	res.locals.searchquery = config.default_searchquery;
	
	res.locals.languagecode = "en";
	
	res.slowredirect = function(page) {
		res.render('loading',{
			redirectpage: page,
			errors: req.flash('error'), 
			message:req.flash('success')
		});
	}

	
	res.locals.emailhosts = config.allowed_emailhosts || [];
	
	var admin = req.user && req.user.admin;
	var remoteip = req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
	var localadmin = res.locals.localhostadmin && (remoteip=="localhost" || remoteip=="127.0.0.1" || remoteip=="::ffff:127.0.0.1");
	var zeroadmins = res.locals.zeroadmins;
	
	res.locals.hasadmin = admin || localadmin || zeroadmins;
	
	res.locals.filesizebeautify = function(filesize)
	{
		var filesize_kb = Math.round(filesize/1000);
		var filesize_mb = Math.round(filesize_kb/1000);
		var filesize_gb = Math.round(filesize_mb/1000);
		
		if (filesize_gb>0) {
			return filesize_gb + " GB";
		}
		if (filesize_mb>0) {
			return filesize_mb + " MB";
		}
		if (filesize_kb>0) {
			return filesize_kb + " KB";
		}
		return filesize + " B";
	}
	
	var referer = req.header('Referer') || '/';
	res.locals.referer = referer;
	//res.locals.referer = encodeURIComponent(referer);
	
	res.locals.user=req.user;

	res.locals.countries = countries;
	
	res.locals.localhostadmin = secret.localhostadmin || false;
	res.locals.zeroadmins_unrestricted = secret.zeroadmins_unrestricted || false;
	
	//res.locals.server_host = secret.server_host;
	res.locals.captchasite = secret.captcha_sitekey;
	res.locals.captchakey = secret.captcha_secretkey;
	res.locals.captchaapi = secret.captcha_api || "https://www.google.com/recaptcha/api/siteverify";
	
	if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === null) {
		req.body['g-recaptcha-response'] = '';
	}
	res.locals.captchaurl = res.locals.captchaapi + "?secret=" + res.locals.captchakey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
	

	//remove last / for canonical rel link url
	var canonicalpath = req.path;
	if (canonicalpath.slice(-1)=="/")
	{
		canonicalpath = canonicalpath.slice(0, -1);
	}
	res.locals.canonicalurl = res.locals.hosturl + canonicalpath;
	res.locals.canonicalpath = canonicalpath;
	
	res.locals.currenturl = res.locals.hosturl + req.originalUrl;
	res.locals.currentpath = req.originalUrl;
	
	
	res.locals.CatsToObjects = function(input) {
		var fieldarray = [];
		var idstring = input;
		if (typeof input._id!="undefined")
		{
			idstring = input._id;
		}
		idstring = idstring.toString();
		if (idstring && idstring!="")
		{
			var cats = res.locals.cats;
			var idarray = idstring.split(/[,| |, ]+/g);
			
			for (k in idarray)
			{
				var id = idarray[k].toString();
				var field = cats.field[id] || cats.type[id] || cats.level[id] || false;
				if (field && field!=null)
				{
					fieldarray.push(field);
				}
			}
		}
		return fieldarray;
	}
	
	//convert category ids string to names string
	res.locals.CatsToNames = function(idstring) {
		var namearray = [];
		if (idstring && idstring!="")
		{
			var fieldarray = res.locals.CatsToObjects(idstring);
			
			for (k in fieldarray)
			{
				var field = fieldarray[k];
				if (field && field!=null)
				{
					namearray.push(field.name);
				}
			}
			
		}
		return namearray;
	}
	
	next();
});


//WORD HIGLIGHTING MIDDLEWARE
router.use(function(req, res, next) {
	res.locals.highlight = function(input, term)
	{
		var output = input;
		var term = term || res.locals.highlight_term || "";
		if (term && term!="")
		{
			var words = term.split(" ");
			for (k in words)
			{
				var word = words[k];
				//http://stackoverflow.com/questions/3115150/how-to-escape-regular-expression-special-characters-using-javascript
				var escaped = word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "");
				if (escaped.length>0)
				{
					var query = new RegExp("(\\b" + escaped + "\\b)", "gim");
					output = output.replace(query, "<span class='highlight'>$1</span>");
				}
			}
			
			return output;
		}
		return input;
	}
	res.locals.highlight_term = "";
	
	if (req && req.query)
	{
		var hterm = req.query.h || req.query.q || "";
		res.locals.highlight_term = hterm.replace(/[-[\]{}()*+?.,\\^$|#]/g, "");	
	}

	next();
});

//SUBSCRIPTION MIDDLEWARE
router.use(function(req, res, next) {
	res.locals.notifysubscribers = function(job) {
		
		Job.findById({_id:job._id})
			.exec(function(err,job0){
			if(err) return next(err);
			if (!job0)
			{
				console.log("error null job");
				return next();
			}
			
			Job.populate(
				job, 
				[{ path: 'user'}], 
				function(err, job) {
					if(err) return console.log(err);
					var queryarray = [];
					queryarray.push(job.title);
					queryarray.push(job.company);
					queryarray.push(job.field.name);
					queryarray.push(job.type.name);
					queryarray.push(job.skills);
					

					var querystring = "( subscribe:true OR emailsub:true )";
					
					/*if (job.skills && job.skills!="")
					{
						querystring += "skills:(" + skillsarray.join(" AND ") + ")";
					}*/
					if (queryarray && queryarray.length>0)
					{
						querystring += " AND ( keywordsub:false OR keywords:(" + queryarray.join(" ") + ") )";
					}

					querystring += " AND ( recruitsub:false OR typeOfJob:(" + job.type._id + ") )";

					querystring += " AND ( studysub:false OR fieldOfStudy:(" + job.field._id + ") )";
					
					var searchproperties = {"query" : {	"match_all" : {} } };
					if (querystring!="")
					{
						searchproperties = {query_string: {query: querystring, default_operator: "OR"}};
					}
					

					User.search(
						searchproperties,
						{hydrate: true, size: 10000},
						function(err,results){
							if(err) return console.log(err);
							
							var hits = results.hits.hits;
							hits = hits.filter(function(e){return e}); 
							var total = results.hits.total-results.hits.hits.length+hits.length;
							
							
							for (var i=0; i < hits.length; i++) {

								var user = hits[i];
								
								//new
								
								if (user.subscribe)
								{
									job0.apps = job0.apps || 0;
									job0.apps = job0.apps + 1;
								
									var favorite = new Favorite();
									favorite.user = user._id;
									favorite.job = job._id;
									favorite.automatic = true;
								
									favorite.save(function(err) {
										if (err) return console.log(err);
									});
								}

								if (user.emailsub) {
									var recipient = '"' + user.name + '" <' + user.email + '>';
									var subject = '###new### ###job###';
								
									
									var mailParameters = {
										language: "english",
										to: recipient, 
										subject: subject, 
										job: job
									};
									var mailOptions = transporter.render('email/job-newoffer', mailParameters, res.locals);
									
							
									//Send e-mail
									transporter.sendMail(mailOptions, function(error, info){
										if(error){
										   console.log(error);
										}
										console.log('Message sent: ' + info.response);
									});
								}
							}
							
							job0.save(function(err, result) {
								if(err) return console.log(err);
							});		
							job0.index(function(err, result) {
								if(err) return console.log(err);
							});	
						}
					);
				}
			);	
			
		});
	}
	next();
});

module.exports=router;