var router = require('express').Router();

var Job = require('../models/job');
var Application = require('../models/application');
var User = require('../models/user');
var Favorite = require('../models/favorite');

var transporter = require('./mailer');

router.use(function(req,res,next){
	if (!res.locals.zeroadmins && (!req.user || !req.user.manager)) { return res.denied("###denied###"); }
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
		{hydrate: true, from: frm, size: num, sort: sort},
		function(err, results){
			if(err) return next(err);
			//var hits = results.hits.hits;
			//var total = results.hits.total;
			/*var mapped = results.hits.hits.map(function(hit){
				var dat = hit._source;
				dat._id = hit._id;
				return dat;
			});*/
			var hits = results.hits.hits;
			hits = hits.filter(function(e){return e}); 
			var total = results.hits.total-results.hits.hits.length+hits.length;
			Job.populate(
				hits, 
				[{ path: 'user'}, { path: 'field'}, { path: 'type'}], 
				function(err, hits) {
					res.render('admin/dashboard',{
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

/*
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
		
		//if (query!="")
		//{
		//	sort = sortmethod || res.locals.defaultsort;
		//}
		
		Application.search(
			searchproperties,
			{hydrate: true, from: frm, size: num, sort: defaultsort},
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
								res.render('admin/applications',{
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

router.get('/favorites',function(req,res,next){
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
								res.render('admin/favorites',{
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
*/

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
			
			return res.resultmessage('success', '###job### ###added###');
			//return res.redirect("/manager/dashboard");	 
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
	Job.findOne({_id:req.params.id, user:req.user._id},
		function(err, job){
			if(err) return next(err);
			
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
					return res.resultmessage('success', '###job### ###edited###');
					
					
					//return res.redirect("/manager/dashboard");	
									
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
		return res.render('admin/delete-job',{
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
				return res.resultmessage('success', '###job### ###removed###');
				
				//return res.redirect("/manager/dashboard");	
		   });
		}
   });
});

//JSON.stringify(data)
module.exports=router;
