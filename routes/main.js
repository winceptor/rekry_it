var router= require('express').Router();

var User =require ('../models/user');
var Job = require('../models/job');
var Category = require ('../models/category');
var Application = require ('../models/application');
var Document = require ('../models/document');
var Favorite = require('../models/favorite');
var Feedback = require('../models/feedback');

var transporter = require('./mailer');
var request = require('request');

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

router.get('/contact',function(req,res,next){
	res.getdocument("###contact###", function(err, doc) {
		if(err) return next(err);
		res.render('main/contact',{
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
		querystring += res.locals.sanitize(query) + " ";
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
	
	//res.locals.highlight_term = query.replace(/[-[\]{}()*+?.,\\^$|#]/g, "");	
	
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

router.get('/tracker',function(req,res,next){

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
		querystring += res.locals.sanitize(query) + " ";
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
	
	//disable highlighting
	res.locals.highlight_term = "";	
	
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
					res.getdocument("###trackernotification###", function(err, doc) {
						if(err) return next(err);
			
						res.render('tracker',{
							notification:doc,
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
	
	//var highlight = req.query.h || "";
	
	//res.locals.highlight_term = highlight;
	
	Job.findById({_id:req.params.id})
		.exec(function(err,job){
		if(err) return next(err);
		if (!job)
		{
			console.log("error null job");
			return next();
		}
		
		job.views = job.views || 0;
		job.views = job.views + 1;
		job.save(function(err, result) {
			if(err) return next(err);
			
		});		
		job.index(function(err, result) {
			if(err) return next(err);
			res.locals.reloadindexjobs();
		});	
		
		Job.populate(
			job, 
			[{ path: 'user'}, { path: 'field'}, { path: 'type'}], 
			function(err, job) {
				if(err) return next(err);
				
				if (req.user) {
					Favorite.findOne({user: req.user._id, job: req.params.id}, function(err, favorite){

						res.render('main/job',{
							data:job,
							favorite:favorite,
							errors: req.flash('error'), message:req.flash('success')
						});
					});	
				} else {
					res.render('main/job',{
						data:job,
						favorite:false,
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
			querystring += res.locals.sanitize(query) + " ";
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
				return res.denied("###denied###");
			}
		}
		else
		{
			req.flash('error', '###needlogin###');
			return res.denied("###denied###");
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
		return res.denied("###denied###");
	}
});


router.get('/favorites',function(req,res,next){
	var page = req.query.p || 1;
	//var num = req.query.n || res.locals.default_searchlimit;
	var num = 100;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	if (req.user) {
		var querystring = res.locals.searchquery + " displayDate:>" + res.locals.LastDay.getTime() + " user:(" + req.user._id + ")";
		var searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
		
		Favorite.search(
			searchproperties,
			{hydrate: true, size: 1000, sort: "date:desc"},
			function(err, results){
				if(err) return next(err);
				var hits = results.hits.hits;
				hits = hits.filter(function(e){return e}); 
				var total = results.hits.total-results.hits.hits.length+hits.length;
				Favorite.populate(
					hits, 
					[{ path: 'user'}, { path: 'job'}], 
					function(err, hits) {
						var valid = [];
						var invalid = [];
						
						for (k in hits)
						{
							var sample = hits[k];
							if (sample.user && sample.job)
							{
								valid.push(sample);
							}
							else
							{
								invalid.push(sample);
							}
						}
												
						invalid.forEach(function(sample) { 
							sample.remove(function(err, results) {
								if(err) return next(err);
							});
						});
						
						Favorite.populate(
							valid, 
							[{ path: 'user.fieldOfStudy', model: 'Category'}, { path: 'user.typeOfStudies', model: 'Category'}, { path: 'job.field', model: 'Category'}, { path: 'job.type', model: 'Category'}, { path: 'job.user', model: 'User'}], 
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
		return res.denied("###denied###");
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
			
			Favorite.findOne({user: req.user._id, job: req.params.id}, function(err, favorite){
				if(err) return next(err);
				if (!favorite)
				{
										
					job.apps = job.apps || 0;
					job.apps = job.apps + 1;
					job.save(function(err, result) {
						if(err) return next(err);
						
					});		
					job.index(function(err, result) {
						if(err) return next(err);
						res.locals.reloadindexjobs();
					});	
					
					Job.populate(
						job, 
						[{ path: 'user'}, { path: 'field'}, { path: 'type'}], 
						function(err, job) {
							if(err) return next(err);
							
							//new
							var favorite = new Favorite();
							favorite.user = req.user._id;
							favorite.job = req.params.id;
							favorite.automatic = true;
						
							favorite.save(function(err) {
								if (err) return next(err);
								
								req.flash('success', '###favorite### ###added###!');
									
								//return res.redirect("/favorites");
								return res.redirect(res.locals.referer);
							});

						}
					);
				}
				else
				{
					
					req.flash('error', '###favorite### ###already### ###added###!');						
					//return res.redirect("/favorites");
					return res.redirect(res.locals.referer);
				}
			});
		});
	} else {
		req.flash('error', '###needlogin###');
		return res.denied("###denied###");
	}
});

router.get('/unfavorite/:id',function(req,res,next){
	if (req.user) {
		Job.findById({_id:req.params.id}).exec(function(err,job){
			if(err) return next(err);
			if (!job)
			{
				console.log("error null job");
				return next();
			}

			Favorite.findOne({user: req.user._id, job: req.params.id}, function(err, favorite){
				if(err) return next(err);
				if (favorite)
				{
					//new
					
					job.apps = job.apps || 1;
					job.apps = job.apps - 1;
					job.save(function(err, result) {
						if(err) return next(err);
						
					});		
					job.index(function(err, result) {
						if(err) return next(err);
						res.locals.reloadindexjobs();
					});	
							
					favorite.remove(function(err, results) {
						if(err) return next(err);
						
						req.flash('success', '###favorite### ###removed###');
						//return res.redirect("/favorites");
						return res.redirect(res.locals.referer);
					});

				}
				else
				{
					
					req.flash('error', '###favorite### ###already### ###removed###!');						
					//return res.redirect("/favorites");
					return res.redirect(res.locals.referer);
				}
			});
		});
	} else {
		req.flash('error', '###needlogin###');
		return res.denied("###denied###");
	}
});


/*
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
				return res.denied("###denied###");
			}
		}
		else
		{
			req.flash('error', '###needlogin###');
			return res.denied("###denied###");
		}
	});
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
									language: "english",
									
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
*/

router.get('/sendfeedback',function(req,res,next){
	var targetpage = req.query.t || "";
	return res.render('main/sendfeedback',{
		targetpage: targetpage,
		errors: req.flash('error'), message:req.flash('success')
	});

});


router.post('/sendfeedback',function(req,res,next){

	var feedback = new Feedback();
	feedback.contact = req.body.contact;
	feedback.page = req.body.page;
	feedback.feedback = req.body.feedback;

	

	if (req.user){ 
		feedback.save(function(err) {
			if (err) return next(err);
			//return res.redirect(res.locals.referer);	
			return res.resultmessage('success', '###feedback### ###sent###!');
		});	
	} else {
		request(res.locals.captchaurl,function(error,response,body) {
			body = JSON.parse(body);
			if (body.success !== undefined && !body.success) {
				req.flash('error',"Problem with captcha, please retry!");
				
				return res.render('main/sendfeedback',{
					feedback: feedback,
					errors: req.flash('error'), message:req.flash('success')
				});
			} 
			else {
				feedback.save(function(err) {
					if (err) return next(err);
					//return res.redirect(res.locals.referer);	
					return res.resultmessage('success', '###feedback### ###sent###!');
				});
			}
		});
	}
	
});


router.get('/feedback/:id',function(req,res,next){
	if (!res.locals.hasadmin){ return res.denied("###denied###"); }
	
	Feedback.findById({_id:req.params.id},function(err,feedback){
		if(err) return next(err);
		if (!feedback)
		{
			console.log("error null feedback");
			return next();
		}
		
		res.render('main/feedback',{
			feedback:feedback,
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});


module.exports=router;
