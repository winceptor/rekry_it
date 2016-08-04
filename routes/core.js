var fs = require('fs');

var router= require('express').Router();

var User =require ('../models/user');
var Job = require('../models/job');
var Category = require ('../models/category');
var Application = require ('../models/application');
var Document = require ('../models/document');

var secret =require('../config/secret');
var config =require('../config/config');

var countries = require('country-list')().getNames();
var sanitize = require('elasticsearch-sanitize');

router.use(function(req, res, next) {	
	var referer = req.header('Referer') || '/';
	res.locals.referer = referer;
	//res.locals.referer = encodeURIComponent(referer);
	//redirectpage: res.locals.referer,
	
	res.locals.user=req.user;

	res.locals.countries = countries;
	
	res.locals.localhostadmin = secret.localhostadmin || false;
	res.locals.zeroadmins_unrestricted = secret.zeroadmins_unrestricted || false;
	
	res.locals.server_host = secret.server_host;
	res.locals.captchasite = secret.captcha_sitekey;
	res.locals.captchakey = secret.captcha_secretkey;
	

	//remove last / for canonical rel link url
	var canonicalpath = req.path;
	if (canonicalpath.slice(-1)=="/")
	{
		canonicalpath = canonicalpath.slice(0, -1);
	}
	res.locals.canonicalurl = secret.server_host + canonicalpath;
	res.locals.canonicalpath = canonicalpath;
	
	next();
});

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
	var indexjobnumber = 3;
	var searchproperties = {query_string: {query: 'featured:false AND hidden:false'}};
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
			}
			Job.populate(
				hits1, 
				[{ path: 'user'}, { path: 'field'}, { path: 'type'}], 
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
			}
			Job.populate(
				hits2, 
				[{ path: 'user'}, { path: 'field'}, { path: 'type'}], 
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
	
	res.locals.newestjobs = newestjobs;
	res.locals.featuredjobs = featuredjobs;
	res.locals.reloadindexjobs = reloadindexjobs;

	
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
				var word = words[k];
				//http://stackoverflow.com/questions/3115150/how-to-escape-regular-expression-special-characters-using-javascript
				var escaped = word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
				
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

module.exports=router;