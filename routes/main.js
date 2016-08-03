var router= require('express').Router();
var User =require ('../models/user');
var Job = require('../models/job');
var Category = require ('../models/category');
var Application = require ('../models/application');
var Document = require ('../models/document');

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


router.get('/',function(req,res,next){

	res.getdocument("###notification###", function(err, doc) {
		if(err) return next(err);
		res.render('main/index',{
			document: doc,
			newestjobs: res.locals.newestjobs,
			featuredjobs: res.locals.featuredjobs,
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});

router.get('/about',function(req,res,next){
	res.getdocument("###about###", function(err, doc) {
		if(err) return next(err);
		res.render('main/about',{
			document: doc,
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});


router.get('/privacy',function(req,res,next){
	res.getdocument("###privacy###", function(err, doc) {
		if(err) return next(err);
		res.render('main/privacy',{
			document: doc,
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});


router.get('/terms',function(req,res,next){
	res.getdocument("###terms###", function(err, doc) {
		if(err) return next(err);
		res.render('main/terms',{
			document: doc,
			errors: req.flash('error'), message:req.flash('success')
		});
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
	
	var query = req.query.q || "";
	var jobfield = req.query.f || "";
	var jobtype = req.query.t || "";
	var sortmethod = req.query.s || "";
	
	var querystring = res.locals.searchquery + " displayDate:>" + res.locals.LastDay.getTime() + " ";
	
	if (query!="")
	{
		querystring += query + " ";
	}
	if (jobfield!="")
	{
		jobfield = typeof jobfield=="string" ? jobfield : jobfield.join(" OR ");
		querystring += "field:(" + jobfield + ") ";
	}
	if (jobtype!="")
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
	
	if (query!="")
	{
		sort = sortmethod || res.locals.defaultsort;
	}
	
	res.locals.highlight_term = query;	
	
	Job.search(
		searchproperties, 
		{from: frm, size: num, sort: sort},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			hits = hits.filter(function(e){return e}); 
			var total = results.hits.total-results.hits.hits.length+hits.length;
			
			var mapped = hits.map(function(hit){
				var dat = hit._source;
				dat._id = hit._id;
				return dat;
			});
			Job.populate(
				mapped, 
				[{ path: 'user'}, { path: 'field'}, { path: 'type'}], 
				function(err, hits) {
					res.getdocument("###sponsored###", function(err, doc) {
						if(err) return next(err);
			
						res.render('main/search',{
							sponsored:doc,
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
					});
				}
			);
		}
	);

});

router.get('/job/:id',function(req,res,next){
	
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
			[{ path: 'user'}, { path: 'field'}, { path: 'type'}], 
			function(err, job) {
				if(err) return next(err);
				
				job.views = job.views || 0;
				job.views = job.views + 1;
				
				job.save(function(err, result) {
					if(err) return next(err);
					reloadindexjobs();
				});
				
				if (req.user) {
					Application.findOne({user: req.user._id, job: req.params.id}, function(err, application){

						res.render('main/job',{
							data:job,
							application:application,
							errors: req.flash('error'), message:req.flash('success')
						});
					});	
				} else {
					res.render('main/job',{
						data:job,
						application:false,
						errors: req.flash('error'), message:req.flash('success')
					});
				}

			}
		);
	});
});

router.get('/category/:id',function(req,res,next){
	
	var query = req.query.q || "";
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_searchlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	Category.findById({_id:req.params.id},function(err,category){
		if(err) return next(err);
		if (!category) return next();
		
		
		var querystring = res.locals.searchquery + " displayDate:>" + res.locals.LastDay.getTime() + " ";
		
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
				hits = hits.filter(function(e){return e}); 
				var total = results.hits.total-results.hits.hits.length+hits.length;
				Job.populate(
					hits, 
					[{ path: 'user'}, { path: 'field'}, { path: 'type'}], 
					function(err, hits) {
						if(err) return next(err);
						res.render('main/category',{
							data:category,
							jobs:hits,
							query:query, 
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
});

router.get('/profile/:id',function(req,res,next){
	
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
					
					errors: req.flash('error'), message:req.flash('success')
				});
			}
		);
	});
});

router.get('/application/:id',function(req,res,next){
	var redirectpage = "/application/" + req.params.id;
	Application.findById({_id:req.params.id},function(err,application){
		if(err) return next(err);
		if (!application)
		{
			console.log("error null application");
			return next();
		}
		if (req.user) {
			if (req.user.admin || req.user.employer || req.user._id == application.user)
			{
				Application.populate(
					application, 
					[{ path: 'user'}, { path: 'job'}], 
					function(err, application) {
						if(err) return next(err);
						Application.populate(
							application, 
							[{ path: 'user.fieldOfStudy', model: 'Category'}, { path: 'user.typeOfStudies', model: 'Category'}, { path: 'job.user', model: 'User'}, { path: 'job.field', model: 'Category'}, { path: 'job.type', model: 'Category'}], 
							function(err, application) {
								if(err) return next(err);
								//application.job = hit;
								res.render('main/application',{
									data:application,
									errors: req.flash('error'), message:req.flash('success')
								});
							}
						);
					}
				);
			}
			else
			{
				req.flash('error', '###noaccess###');
				return res.redirect("/denied");
			}
		}
		else
		{
			req.flash('error', '###needlogin###');
			return res.redirect("/denied");
		}
	});
});


router.get('/document/:id',function(req,res,next){
	var redirectpage = "/document/" + req.params.id;
	Document.findById({_id:req.params.id},function(err,doc){
		if(err) return next(err);
		if (!doc)
		{
			doc = new Document();
			doc.name = name;
			
			doc.save(function(err,doc){
				if(err) return next (err);
			});
		}
		res.render('main/document',{
			document: doc,
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});



router.get('/applications',function(req,res,next){
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_searchlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	if (req.user) {
		var querystring = "user:(" + req.user._id + ") OR employer:(" + req.user._id + ")";
		var searchproperties = {query_string: {query: querystring}};
		
		Application.search(
			searchproperties,
			{hydrate: true, size: 1000, sort: "date:desc"},
			function(err, results){
				if(err) return next(err);
				var hits = results.hits.hits;
				hits = hits.filter(function(e){return e}); 
				var total = results.hits.total-results.hits.hits.length+hits.length;
				Application.populate(
					hits, 
					[{ path: 'user'}, { path: 'job'}], 
					function(err, hits) {
						Application.populate(
							hits, 
							[{ path: 'user.fieldOfStudy', model: 'Category'}, { path: 'user.typeOfStudies', model: 'Category'}, { path: 'job.field', model: 'Category'}, { path: 'job.type', model: 'Category'}], 
							function(err, hits) {
								if(err) return next(err);
								res.render('main/applications',{
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
			}
		);
	} else {
		req.flash('error', '###needlogin###');
		return res.redirect("/denied");
	}
});


router.get('/favorites',function(req,res,next){
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_searchlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	if (req.user) {
		var querystring = "user:(" + req.user._id + ")";
		var searchproperties = {query_string: {query: querystring}};
		
		Application.search(
			searchproperties,
			{hydrate: true, size: 1000, sort: "date:desc"},
			function(err, results){
				if(err) return next(err);
				var hits = results.hits.hits;
				hits = hits.filter(function(e){return e}); 
				var total = results.hits.total-results.hits.hits.length+hits.length;
				Application.populate(
					hits, 
					[{ path: 'user'}, { path: 'job'}], 
					function(err, hits) {
						Application.populate(
							hits, 
							[{ path: 'user.fieldOfStudy', model: 'Category'}, { path: 'user.typeOfStudies', model: 'Category'}, { path: 'job.field', model: 'Category'}, { path: 'job.type', model: 'Category'}], 
							function(err, hits) {
								if(err) return next(err);
								res.render('main/favorites',{
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
			}
		);
	} else {
		req.flash('error', '###needlogin###');
		return res.redirect("/denied");
	}
});

router.get('/favorite/:id',function(req,res,next){
	if (req.user) {
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
				[{ path: 'user'}, { path: 'field'}, { path: 'type'}], 
				function(err, job) {
					if(err) return next(err);

					Application.findOne({user: req.user._id, job: req.params.id}, function(err, application){
						if (!application)
						{
							//new
							var application = new Application();
							application.user = req.user._id;
							application.employer = job.user;
							application.job = job._id;
							
							job.apps = job.apps || 0;
							job.apps = job.apps + 1;
							
							job.save(function(err, result) {
								if(err) return next(err);
								reloadindexjobs();
							});
						
							application.save(function(err) {
								if (err) return next(err);
								
								req.flash('success', '###favorite### ###added###!');
									
								//return res.redirect("/favorites");
								return res.redirect(res.locals.referer);
							});

						}
						else
						{
							
							req.flash('error', '###already### ###added###!');						
							//return res.redirect("/favorites");
							return res.redirect(res.locals.referer);
						}
					});
				}
			);
		});
	} else {
		req.flash('error', '###needlogin###');
		return res.redirect("/denied");
	}
});

router.get('/unfavorite/:id',function(req,res,next){
	if (req.user) {
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
				[{ path: 'user'}, { path: 'field'}, { path: 'type'}], 
				function(err, job) {
					if(err) return next(err);

					Application.findOne({user: req.user._id, job: req.params.id}, function(err, application){
						if (application)
						{
							//new
							job.apps = job.apps || 1;
							job.apps = job.apps - 1;
							
							job.save(function(err, result) {
								if(err) return next(err);
								reloadindexjobs();
							});
									
							application.remove(function(err, results) {
								if(err) return next(err);
								
								req.flash('success', '###favorite### ###removed###');
								//return res.redirect("/favorites");
								return res.redirect(res.locals.referer);
							});

						}
						else
						{
							
							req.flash('error', '###already### ###removed###!');						
							//return res.redirect("/favorites");
							return res.redirect(res.locals.referer);
						}
					});
				}
			);
		});
	} else {
		req.flash('error', '###needlogin###');
		return res.redirect("/denied");
	}
});


router.get('/apply/:id',function(req,res,next){
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
			[{ path: 'user'}, { path: 'field'}, { path: 'type'}], 
			function(err, hits) {
				if(err) return next(err);
				job.apps++;
				job.save(function(err, result) {
					if(err) return next(err);
				});
				Application.findOne({user: req.user._id, job: req.params.id}, function(err, application){
					if (!application)
					{
						res.render('main/apply',{
							data:job,
							application: "",
							errors: req.flash('error'), message:req.flash('success')
						});
					}
					else
					{
						res.render('main/apply',{
							data:job,
							application: application.application,
							errors: req.flash('error'), message:req.flash('success')
						});
					}
				});
			}
		);
	});
});


router.get('/unapply/:id',function(req,res,next){
	Application.findById({_id:req.params.id},function(err,application){
		if(err) return next(err);
		if (!application)
		{
			console.log("error null application");
			return next();
		}
		if (req.user) {
			if (req.user.admin || req.user._id == application.employer || req.user._id == application.user)
			{
				application.remove(function(err, results) {
					if(err) return next(err);
					req.flash('success', '###application### ###removed###');
					return res.redirect("/favorites");
				});
			}
			else
			{
				req.flash('error', '###noaccess###');
				return res.redirect("/denied");
			}
		}
		else
		{
			req.flash('error', '###needlogin###');
			return res.redirect("/denied");
		}
	});
});


router.post('/apply/:id',function(req,res,next){
	if (!req.user)
	{
		req.flash('error','###needlogin###');
		return res.render('user/login',{
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
			Application.findOne({user: req.user._id, job: req.params.id}, function(err, application){
				if (!application)
				{
					//new
					Job.populate(
						job, 
						[{ path: 'field'}, { path: 'type'}], 
						function(err, hits) {
							var application = new Application();
							application.user = applicant._id;
							application.employer = job.user;
							application.job = job._id;
							application.application = req.body.application;
						
							application.save(function(err) {
								if (err) return next(err);
	
								var recipient = '"' + applicant.name + '" <' + applicant.email + '>';
								var title = '###application### ###sent###';
								
								//var applicationtext = "<h1>This is an email confirming your application for job: " + job.title + "</h1>";
								/*applicationtext += "<h2>Application:</h2>" + req.body.application;
								applicationtext += "<h2>Job details:</h2>";
								applicationtext += "<br>Title: " + job.title;
								applicationtext += "<br>Company: " + job.company;
								applicationtext += "<br>Address: " + job.address;
								applicationtext += "<br>Skills: " + job.skills;
								applicationtext += "<br>Beginning: " + job.beginning;
								applicationtext += "<br>Duration: " + job.duration;
								applicationtext += "<br>Description: " + job.description;
								
								applicationtext += "<a href='" + transporter.hostname + "/profile/" + applicant._id + "'><h2>Applicant details (link)</h2></a>";
								applicationtext += "<a href='" + transporter.hostname + "/job/" + req.params.id + "'><h2>Job details (link)</h2></a>";
								*/
								var mailParameters = {
									to: recipient, 
									subject: title, 
									
									user: applicant,
									job: job,
									application: application
								};
								var mailOptions = transporter.render('email/application-sent', mailParameters, res.locals);
								
								//Send e-mail
								transporter.sendMail(mailOptions, function(error, info){
									if(error){
									   console.log(err);
										return next(err);
									}
								});
								
								recipient = '"' + job.company + '" <' + job.email + '>';
								title = '###application### ###received###';
								
								var mailParameters = {
									to: recipient, 
									subject: title, 
									
									user: applicant,
									job: job,
									application: application
								};
								var mailOptions = transporter.render('email/application-received', mailParameters, res.locals);
								
								//Send e-mail
								transporter.sendMail(mailOptions, function(error, info){
									if(error){
									   console.log(err);
										return next(err);
									}
								});
								
								req.flash('success', '###application### ###sent###!');
									
								return res.redirect("/applications");	
							});
						}
					);
				}
				else
				{
					application.application = req.body.application;
				
					application.save(function(err) {
						if (err) return next(err);
						req.flash('success', '###application### ###edited###!');						
						return res.redirect("/applications");
					});
				}
			});
		}
	);
});


module.exports=router;
