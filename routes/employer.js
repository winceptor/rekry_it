var router = require('express').Router();

var Job = require('../models/job');
var Application = require('../models/application');
var User = require('../models/user');

var transporter = require('./mailer');

router.use(function(req,res,next){
	if (!res.locals.zeroadmins && (!req.user || !req.user.employer)) { return res.render('denied'); }
	next();
});

router.get('/dashboard',function(req,res,next){
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_searchlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	var query = req.query.q || "";
	
	var jobfield = req.query.f || "";
	var jobtype = req.query.t || "";
	var sortmethod = req.query.s || "";
	
	var querystring = "user:(" + req.user._id + ") ";
	
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
	var defaultsort = "date:desc";
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
					res.render('employer/dashboard',{
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

router.get('/applications',function(req,res,next){
	if (req.user) {
		
		var page = req.query.p || 1;
		var num = req.query.n || res.locals.default_searchlimit;
		num = Math.min(num, 1000);
		var frm = Math.max(0,page*num-num);
		
		
		var querystring = "(user:(" + req.user._id + ") OR employer:(" + req.user._id + ")) ";
		
			
		var searchproperties = {query_string: {query: querystring}};
		var defaultsort = "date:desc";
		//var sort = sortmethod || defaultsort;
		
		if (querystring!="")
		{
			searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
		}
		
		/*
		if (query!="")
		{
			sort = sortmethod || res.locals.defaultsort;
		}
		*/
		
		Application.search(
			searchproperties,
			{hydrate: true, from: frm, size: num, sort: defaultsort},
			function(err, results){
				if(err) return next(err);
				var hits = results.hits.hits;
				var total = results.hits.total;
				Application.populate(
					hits, 
					[{ path: 'user'}, { path: 'job'}], 
					function(err, hits) {
						Application.populate(
							hits, 
							[{ path: 'user.fieldOfStudy', model: 'Category'}, { path: 'user.typeOfStudies', model: 'Category'}, { path: 'job.field', model: 'Category'}, { path: 'job.type', model: 'Category'}], 
							function(err, hits) {
								if(err) return next(err);
								res.render('employer/applications',{
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
	}
});

router.get('/add-job',function(req,res,next){
  return res.render('employer/add-job',{
		job:false, 
		errors: req.flash('error'), message:req.flash('success')
	});
});

router.post('/add-job',function(req,res,next){
	var jobOffer = new Job();
		jobOffer.hidden = req.body.hidden || false;
		jobOffer.featured = req.body.featured || false;
		jobOffer.title = req.body.title;
		jobOffer.type = req.body.type || null;
		jobOffer.field = req.body.field || null;
		jobOffer.company = req.body.company;
		jobOffer.address = req.body.address;
		jobOffer.phone = req.body.phone;
		jobOffer.email = req.body.email;
		jobOffer.skills = req.body.skills;
		jobOffer.beginning = req.body.beginning;
		jobOffer.duration = req.body.duration;
		jobOffer.description = req.body.description;
		
		jobOffer.user = req.user._id;
	  
	  
	if (req.body.displayDate!="")
	{
		jobOffer.displayDate = res.locals.InputToDate(req.body.displayDate);
	}

	var problem = jobOffer.validateInput(req, res);
	if (problem)
	{
		req.flash('error',problem);
		return res.render('employer/add-job',{
			job: jobOffer,
			errors: req.flash('error')
		});
	}
	
	jobOffer.save(function(err) {
		if (err) return next(err);
		jobOffer.on('es-indexed', function(err, result){
			if (err) return next(err);
					
			var queryarray = [];
			queryarray.push(jobOffer.title);
			queryarray.push(jobOffer.company);
			queryarray.push(jobOffer.field.name);
			queryarray.push(jobOffer.type.name);
			queryarray.push(jobOffer.skills);
			
			var querystring = "";
			
			if (jobOffer.skills && jobOffer.skills!="")
			{
				querystring += "skills:(" + jobOffer.skills + ")";
			}
			if (queryarray && queryarray!="")
			{
				querystring += "keywords:(" + queryarray.join(" ") + ")";
			}
			
			if (querystring!="")
			{
				var searchproperties = {query_string: {query: querystring, default_operator: "OR"}};	
				User.search(
					searchproperties
					,function(err,results){
						if(err) return next(err);
						var data=results.hits.hits.map(function(hit){
							return hit;
						});
						var i = 0;
						for (i; i < data.length; i++) {
							
							var email = data[i]._source.email;
							var recipient = '"' + data[i]._source.name + '" <' + data[i]._source.email + '>';
							var subject = 'New job offer';
							var joboffertext = '<h1>Hi! We have a new job offer, that might be suitable for you!</h1>';
							
							//joboffertext += "<h2>Job offer information:</h2>";
							/*joboffertext += "<br>Title: " + jobOffer.title;
							joboffertext += "<br>Company: " + jobOffer.company;
							joboffertext += "<br>Address: " + jobOffer.address;
							joboffertext += "<br>Skills: " + jobOffer.skills;
							joboffertext += "<br>Beginning: " + jobOffer.beginning;
							joboffertext += "<br>Duration: " + jobOffer.duration;
							joboffertext += "<br>Description: " + jobOffer.description;
							*/
							joboffertext += "<a href='" + transporter.hostname + "/job/" + jobOffer._id + "'><h2>Job details (link)</h2></a>";
							
							
							/*var mailOptions = {
								from: transporter.sender, // sender address
								to: '"' + data[i]._source.name + '" <' + data[i]._source.email + '>', // list of receivers
								subject: res.locals.trans('New job offer'), // Subject line
								//html: joboffertext // plaintext body
								html: transporter.render('generic',{title:joboffertitle, message:joboffertext},res.locals)
							};*/
							
							var mailParameters = {
								to: recipient, 
								subject: subject, 
								title: subject, 
								message: joboffertext,
								job: jobOffer
							};
							var mailOptions = transporter.render('email/job', mailParameters, res.locals);
							
					
							//Send e-mail
							transporter.sendMail(mailOptions, function(error, info){
								if(error){
								   return console.log(error);
								}
								console.log('Message sent: ' + info.response);
							});

						}
					}
				);
			}

			req.flash('success', '###job### ###added###');
			return res.slowredirect("/employer/dashboard");	 
		});
	});
});


router.get('/edit-job/:id',function(req,res,next){
	Job.findOne({_id:req.params.id, user:req.user._id})
		.exec(function(err,job){
		if(err) return next(err);
		if (!job)
		{
			req.flash('error', '###job### ###id### ###undefined###!');
			return res.render('employer/edit-job',{
				job:false, 
				
				errors: req.flash('error'), message:req.flash('success')
			});
		}
		//console.log("job:" + job);
		return res.render('employer/edit-job',{
			job:job,
			
			errors: req.flash('error'), message:req.flash('success')
		});
	});

});


router.post('/edit-job/:id',function(req,res,next){
	Job.findOne({_id:req.params.id, user:req.user._id},
		function(err, job){
			if(err) return next(err);
			
			job.hidden = req.body.hidden || false;
			job.featured = req.body.featured || false;
			job.title = req.body.title;
			job.type = req.body.type || null;
			job.field = req.body.field || null;
			job.company = req.body.company;
			job.address = req.body.address;
			job.phone = req.body.phone;
			//job.startDate = res.locals.InputToDate(req.body.startDate);
			//job.endDate = res.locals.InputToDate(req.body.endDate);
			job.email = req.body.email;
			job.skills = req.body.skills;
			job.beginning = req.body.beginning;
			job.duration = req.body.duration;
			job.description = req.body.description;
			job.displayDate = res.locals.InputToDate(req.body.displayDate);
					
			var problem = job.validateInput(req, res);
			if (problem)
			{
				req.flash('error',problem);
				return res.render('employer/edit-job',{
					job: job,
					 
					errors: req.flash('error')
				});
			}
			
			job.save(function(err, results) {
				if(err) return next(err);
				if (!results)
				{
					req.flash('error', '###job### ###not### ###edited###!');
					return res.render('employer/edit-job',{
						job:job,
						 
						errors: req.flash('error'), message:req.flash('success')
					});
				}
				
				job.on('es-indexed', function(err, result){
					if (err) return next(err);
					req.flash('success', '###job### ###edited###');
					
					
					return res.redirect("/employer/dashboard");	
									
				});

			});
		}
	);
});

router.get('/delete-job/:id',function(req,res,next){
	Job.findOne({_id:req.params.id, user:req.user._id})
		.exec(function(err,job){
		if(err) return next(err);
		if (!job)
		{
			req.flash('error', '###job### ###id### ###undefined###!');
			return res.redirect(res.locals.referer);
		}
		//console.log("job:" + job);
		return res.render('employer/delete-job',{
			entry:job
		});
	});
});

router.post('/delete-job/:id',function(req,res,next){
	Job.findOne({_id:req.params.id, user:req.user._id}, function(err, job) {
		if(err) return next(err);
		if (!job)
		{
			req.flash('error', '###job### ###not### ###removed###!');
			return res.redirect(res.locals.referer);
		}
		else
		{
			job.remove(function(err, job) {
				 if (err) {
					console.log(err);
					return next(err);
				 }  
				req.flash('success', '###job### ###removed###');
				
				return res.redirect("/employer/dashboard");	
		   });
		}
   });
});

//JSON.stringify(data)
module.exports=router;
