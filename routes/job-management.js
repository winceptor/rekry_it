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
	var jobOffer = new Job();
	
	var problem = jobOffer.processForm(req, res);
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
			
			
			res.locals.notifysubscribers(jobOffer);
			
			res.locals.reloadindexjobs();
			
			//return res.resultmessage('success', '###job### ###added###');
			
			req.flash('success', '###job### ###added###');
			
			return res.redirect("/admin/list-jobs");
			//return res.redirect(res.locals.referer);			
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
		
		var job = faker.name.jobDescriptor() + " " + faker.name.jobType();
		var jobarea = faker.name.jobArea();
		fakejob.title = job;
		fakejob.company = faker.company.companyName();
		fakejob.address = faker.address.streetAddress();
		fakejob.phone = faker.phone.phoneNumber();

		fakejob.email = faker.internet.email();
		fakejob.skills = faker.company.catchPhrase();
		
		var date1 = faker.date.future();
		var date2 = faker.date.future();
		
		fakejob.beginning = res.locals.DateToInput(date1);
		fakejob.displayDate = date2;
		if (date1<date2)
		{
			fakejob.beginning = res.locals.DateToInput(date2);
			fakejob.displayDate = date1;
		}

		
		fakejob.duration = "FAKE";
		
		var description = "";
		
		description += "<strong>Description:</strong>\n" + fakejob.company + " is seeking for " + job + " to work in " + jobarea + " field.\n\n";
		
		description += "<strong>Background:</strong>\n" + faker.lorem.paragraphs( Math.round(Math.random()*9+1) ) + "\n\n";
		
		description += "<strong>Application:</strong>\nSend your applications to the email mentioned above.\n\n";
		
		description += "Last day for applications is " + res.locals.DateToOutput(fakejob.displayDate) + ". Job begins at: " + fakejob.beginning + "\n";
				
		fakejob.description = description;

		
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

			});
		});
	}
	
	res.locals.reloadindexjobs();
					
	req.flash('success', 'Generated ' + amount + ' fake job(s).');
	return res.redirect("/admin/list-jobs");	
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
			return res.redirect("/admin/list-jobs");
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
			return res.redirect("/admin/list-jobs");
		}
		//console.log("job:" + job);
		return res.render('admin/edit-job',{
			job:job,
			
			errors: req.flash('error'), message:req.flash('success')
		});
	});

});


router.post('/edit-job/:id',function(req,res,next){

	Job.findById(req.params.id,
		function(err, job){
			if(err) return next(err);
			if (!job)
			{
				req.flash('error', '###job### ###id### ###undefined###!');
				return res.redirect("/admin/list-jobs");
			}
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
			var problem = job.processForm(req, res);
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
					
					res.locals.reloadindexjobs();
					
					//return res.resultmessage('success', '###job### ###edited###');
					
					req.flash('success', '###job### ###edited###');
					
					//return res.redirect("/admin/list-jobs");	
					//return res.redirect('/job/' + req.params.id);
					return res.redirect(res.locals.referer);
				});

			});
					/*
				}
			);*/
		}
	);
});

router.get('/delete-job/:id',function(req,res,next){
	

	Job.findById(req.params.id)
		.exec(function(err,job){
		if(err) return next(err);
		if (!job)
		{
			req.flash('error', '###job### ###id### ###undefined###!');
			return res.redirect("/admin/list-jobs");
		}
		//console.log("job:" + job);
		Job.populate(
			job, 
			[{ path: 'field'}, { path: 'type'}], 
			function(err, job) {
				if(err) return next(err);
				return res.render('admin/delete-job',{
					entry:job
				});
			}
		);
	});
});

router.post('/delete-job/:id',function(req,res,next){
	Job.findById({_id:req.params.id}, function(err, job) {
		if(err) return next(err);
		if (!job)
		{
			req.flash('error', '###job### ###not### ###removed###!');
			return res.redirect("/admin/list-jobs");
		}
		else
		{
			job.remove(function(err, job) {
				 if (err) {
					console.log(err);
					return next(err);
				 }  
				res.locals.reloadindexjobs();
				return res.resultmessage('success', '###job### ###removed###');
				
				//return res.redirect("/admin/list-jobs");	 
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
			hits = hits.filter(function(e){return e}); 
			var total = results.hits.total-results.hits.hits.length+hits.length;
			
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
		//querystring += res.locals.sanitize(query) + " ";
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
			hits = hits.filter(function(e){return e}); 
			var total = results.hits.total-results.hits.hits.length+hits.length;
			
			var data=hits.map(function(hit){
				return hit;
			});
			data.forEach(function(job) { 
				job.remove(function(err, result) {
					if(err) return next(err);
				});
			});
			res.locals.reloadindexjobs();
			return res.resultmessage('success', total + ' ###jobs### ###removed###');
			//return res.redirect('/admin/list-jobs');
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
			hits = hits.filter(function(e){return e}); 
			var total = results.hits.total-results.hits.hits.length+hits.length;
			Job.populate(
				hits, 
				[{ path: 'field'}, { path: 'type'}, { path: 'user'}], 
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
