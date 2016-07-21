var router = require('express').Router();
var Category = require('../models/category');
var Job = require('../models/job');
var User = require('../models/user');

var transporter = require('./mailer');

router.get('/add-job',function(req,res,next){
  return res.render('admin/add-job',{
		job:false, 
		errors: req.flash('error'), message:req.flash('success')
	});
});

router.post('/add-job',function(req,res,next){
	res.locals.reloadindexjobs();
	
	var jobOffer = new Job();
		jobOffer.hidden = req.body.hidden || false;
		jobOffer.featured = req.body.featured || false;
		jobOffer.title = req.body.title;
		jobOffer.type = req.body.type || null;
		jobOffer.field = req.body.field || null;
		jobOffer.company = req.body.company;
		jobOffer.address = req.body.address;
		jobOffer.phone = req.body.phone;
		//jobOffer.startDate = res.locals.InputToDate(req.body.startDate);
		//jobOffer.endDate = res.locals.InputToDate(req.body.endDate);
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
	  
	  
	/*		  
	Category.findOne(
		{name: req.body.field},
		function(err, field){
			if(err) return next(err);
			if (!field || !field._id) 
			{
				req.flash('error', '###job### ###field### ###undefined###!');
				return res.render('admin/add-job',{
					job:jobOffer, 
					
					errors: req.flash('error'), message:req.flash('success')
				});
			}
			jobOffer.field = field.name;
			*/
			
	var problem = jobOffer.validateInput(req, res);
	if (problem)
	{
		req.flash('error',problem);
		return res.render('admin/add-job',{
			job: jobOffer,
			errors: req.flash('error')
		});
	}
	
	jobOffer.save(function(err) {
		if (err) return next(err);
		jobOffer.on('es-indexed', function(err, result){
			if (err) return next(err);
				
			/*
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

							var joboffertitle = '<h1>Hi! We have a new job offer, that might be suitable for you!</h1>';
							
							var joboffertext = "<h2>Job offer information:</h2>";
							joboffertext += "<br>Title: " + jobOffer.title;
							joboffertext += "<br>Company: " + jobOffer.company;
							joboffertext += "<br>Address: " + jobOffer.address;
							joboffertext += "<br>Skills: " + jobOffer.skills;
							joboffertext += "<br>Beginning: " + jobOffer.beginning;
							joboffertext += "<br>Duration: " + jobOffer.duration;
							joboffertext += "<br>Description: " + jobOffer.description;

							joboffertext += "<a href='" + transporter.hostname + "/job/" + jobOffer._id + "'><h2>Job details (link)</h2></a>";

							var mailOptions = {
								from: transporter.sender, // sender address
								to: '"' + data[i]._source.name + '" <' + data[i]._source.email + '>', // list of receivers
								subject: res.locals.trans('New job offer'), // Subject line
								//html: joboffertext // plaintext body
								html: res.locals.trans(transporter.render('generic',{title:joboffertitle, message:joboffertext},res.locals))
							};
					
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
			*/
			req.flash('success', '###job### ###added###');
			return res.slowredirect("/admin/list-jobs");	 
		});
	});
		/*}
	);*/
});

router.get('/generate/:amount',function(req,res,next){
	var faker = require('faker');
	faker.locale = "en";
	
	var amount = req.params.amount || 1;

	for (var i=0; i<amount; i++)
	{
		var fakejob = new Job();
		fakejob.hidden = false;
		fakejob.featured = false;
		
		fakejob.title = faker.name.jobType();
		fakejob.company = faker.company.companyName();
		fakejob.address = faker.address.streetAddress();
		fakejob.phone = faker.phone.phoneNumber();

		fakejob.email = faker.internet.email();
		fakejob.skills = faker.hacker.verb();
		fakejob.beginning = res.locals.DateToInput(faker.date.future());
		fakejob.duration = "FAKE";
		fakejob.description = faker.lorem.paragraphs( Math.round(Math.random()*10) );
		
		fakejob.displayDate = faker.date.future();
		
		fakejob.user = req.user._id;

		var fields = res.locals.jobfields;
		var fnum = Math.floor(Math.random()*fields.length);
		var types = res.locals.jobtypes;
		var tnum = Math.floor(Math.random()*types.length);
	
		fakejob.field = fields[fnum]._id;
		fakejob.type = types[tnum]._id;
		
		fakejob.save(function(err) {
			if (err) return next(err);
			fakejob.on('es-indexed', function(err, result){
				if (err) return next(err);
				if (i>=(amount-1))
				{
					res.locals.reloadindexjobs();
					
					req.flash('success', 'Generated ' + amount + ' fake job(s).');
					return res.slowredirect("/admin/list-jobs");	
				}
			});
		});
	}

});

router.get('/degenerate/',function(req,res,next){
	
	var querystring = 'duration:("FAKE" OR "Unknown") OR field:(null) OR type:(null)';
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "OR"}};
	}
	Job.search(
		searchproperties,
		{hydrate: true, size: 10000},
		function(err, results){
			if(err) return next(err);
			var data=results.hits.hits.map(function(hit){
				return hit;
			});
			data.forEach(function(fake) { 
				fake.remove(function(err, results) {
					if(err) return next(err);
				});
			});
			res.locals.reloadindexjobs();
			
			req.flash('success', 'Cleared ' + data.length + ' fake jobs.');
			return res.slowredirect("/admin/list-jobs");
		}
	);
	
});

router.get('/edit-job/:id',function(req,res,next){
	

	Job.findById(req.params.id)
		.exec(function(err,job){
		if(err) return next(err);
		if (!job)
		{
			req.flash('error', '###job### ###id### ###undefined###!');
			return res.render('admin/edit-job',{
				job:false, 
				
				errors: req.flash('error'), message:req.flash('success')
			});
		}
		//console.log("job:" + job);
		return res.render('admin/edit-job',{
			job:job,
			
			errors: req.flash('error'), message:req.flash('success')
		});
	});

});


router.post('/edit-job/:id',function(req,res,next){
	res.locals.reloadindexjobs();
		
	
	Job.findById(req.params.id,
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
					
			/*Category.findOne(
				{_id: req.body.field},
				function(err, field){
					if(err) return next(err);
					if (!field || !field._id) 
					{
						req.flash('error', '###job### ###field### ###undefined###!');
						return res.render('admin/edit-job',{
							job:job,
							 
							errors: req.flash('error'), message:req.flash('success')
						});
					}
					
					job.field = field.name;*/
			var problem = job.validateInput(req, res);
			if (problem)
			{
				req.flash('error',problem);
				return res.render('admin/edit-job',{
					job: job,
					 
					errors: req.flash('error')
				});
			}
			
			job.save(function(err, results) {
				if(err) return next(err);
				if (!results)
				{
					req.flash('error', '###job### ###not### ###edited###!');
					return res.render('admin/edit-job',{
						job:job,
						 
						errors: req.flash('error'), message:req.flash('success')
					});
				}
				
				job.on('es-indexed', function(err, result){
					if (err) return next(err);
					req.flash('success', '###job### ###edited###');
					
					
					//return res.slowredirect('/job/' + req.params.id);
									
					return res.slowredirect("/admin/list-jobs");	
				});

			});
					/*
				}
			);*/
		}
	);
});

router.get('/delete-job/:id',function(req,res,next){
	res.locals.reloadindexjobs();

	Job.findById(req.params.id)
		.exec(function(err,job){
		if(err) return next(err);
		if (!job)
		{
			req.flash('error', '###job### ###id### ###undefined###!');
			return res.redirect(res.locals.referer);
		}
		//console.log("job:" + job);
		return res.render('admin/delete-job',{
			entry:job
		});
	});
});

router.post('/delete-job/:id',function(req,res,next){
	Job.findById({_id:req.params.id}, function(err, job) {
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
				
				return res.slowredirect("/admin/list-jobs");	 
		   });
		}
   });
});

router.post('/list-jobs',function(req,res,next){
	res.redirect('/admin/list-jobs');
});
router.get('/list-jobs',function(req,res,next){
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_listlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	var query = req.query.q || "";
	
	var sortmethod = req.query.s || "";
	
	var jobfield = req.query.f || "";
	var jobtype = req.query.t || "";
	
	var querystring = "";
	
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
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
	}
	
	var defaultsort = "date:desc";
	var sort = defaultsort;
	if (query!="")
	{
		sort = res.locals.defaultsort;
	}
	if (sortmethod!="")
	{
		sort = sortmethod;
	}
	Job.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: sort},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			var total = results.hits.total;
			Job.populate(
				hits, 
				[{ path: 'field'}, { path: 'type'}, { path: 'user'}], 
				function(err, hits) {
					if(err) return next(err);
					return res.render('admin/list-jobs',{
						data:hits,
						jobfield:jobfield,
						jobtype:jobtype, 
						sortmethod:sortmethod,
						defaultsort:defaultsort,
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


router.post('/delete-jobs',function(req,res,next){
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_listlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	var query = req.query.q || "";
	
	var sortmethod = req.query.s || "";
	
	var jobfield = req.query.f || "";
	var jobtype = req.query.t || "";
	
	var querystring = "";
	
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
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
	}
	
	var defaultsort = "date:desc";
	var sort = defaultsort;
	if (query!="")
	{
		sort = res.locals.defaultsort;
	}
	if (sortmethod!="")
	{
		sort = sortmethod;
	}
	Job.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: sort},
		function(err, results){
			if(err) return next(err);
			var data=results.hits.hits.map(function(hit){
				return hit;
			});
			var total = results.hits.total;
			data.forEach(function(job) { 
				job.remove(function(err, result) {
					if(err) return next(err);
				});
			});
			res.locals.reloadindexjobs();
			req.flash('success', total + ' ###jobs### ###removed###');
			res.slowredirect('/admin/list-jobs');
		}
	);
});
router.get('/delete-jobs',function(req,res,next){
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_listlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	var query = req.query.q || "";
	
	var sortmethod = req.query.s || "";
	
	var jobfield = req.query.f || "";
	var jobtype = req.query.t || "";
	
	var querystring = "";
	
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
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
	}
	
	var defaultsort = "date:desc";
	var sort = defaultsort;
	if (query!="")
	{
		sort = res.locals.defaultsort;
	}
	if (sortmethod!="")
	{
		sort = sortmethod;
	}
	
	Job.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: sort},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			var total = results.hits.total;
			Job.populate(
				hits, 
				[{ path: 'field'}, { path: 'type'}], 
				function(err, hits) {
					if(err) return next(err);
					return res.render('admin/delete-jobs',{
						data:hits,
						jobfield:jobfield,
						jobtype:jobtype, 
						sortmethod:sortmethod,
						defaultsort:defaultsort,
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

/*
router.get('/delete-index',function(req,res,next){
	Job.esTruncate({},function(err, results){
			if(err) return next(err);
			return res.send("INDEX REMOVED");
	});
});
*/


module.exports=router;
