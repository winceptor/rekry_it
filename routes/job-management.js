var router = require('express').Router();
var Category = require('../models/category');
var Job = require('../models/job');
var User = require('../models/user');

var transporter = require('./mailer');

router.get('/add-job',function(req,res,next){
  return res.render('admin/add-job',{
		job:false, 
		message:req.flash('success'),
		errors: req.flash('error'), message:req.flash('success')
	});
});

router.post('/add-job',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	
	var jobOffer = new Job();
	jobOffer.hidden = req.body.hidden;
	  jobOffer.featured = req.body.featured;
		jobOffer.title = req.body.title;
	  jobOffer.type = req.body.type;
	  jobOffer.company = req.body.company;
	  jobOffer.address = req.body.address;
	  jobOffer.startDate = req.body.startDate;
	  jobOffer.endDate = req.body.endDate;
	  jobOffer.email = req.body.email;
	  jobOffer.skills = req.body.skills;
	  jobOffer.description = req.body.description;
	  jobOffer.displayDate = req.body.displayDate;
			  
	Category.findOne(
		{name: req.body.field},
		function(err, field){
			if(err) return next(err);
			if (!field || !field._id) 
			{
				req.flash('error', 'Job field undefined!');
				return res.render('admin/add-job',{
					job:jobOffer, 
					returnpage:encodeURIComponent(referrer), 
					errors: req.flash('error'), message:req.flash('success')
				});
			}
			jobOffer.field = field.name;
			User.search({
					query_string:{query:jobOffer.skills}
				},function(err,results){
					if(err) return next(err);
					var data=results.hits.hits.map(function(hit){
						return hit;
					});
					var i = 0;
					for (i; i < data.length; i++) {
						
						var email = data[i]._source.email;

						var mailOptions = {
							from: transporter.sender, // sender address
							to: email, // list of receivers
							subject: 'Job Offer', // Subject line
							text: 'Hi! We have job offer, that might be suitable for you!', // plaintext body
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

		  jobOffer.save(function(err) {
			if (err) return next(err);
			req.flash('success', 'Successfully added a job offer');
			return res.redirect('/job/' + jobOffer._id);
		  });
			
		}
	);
});

router.get('/edit-job/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';

	Job.findById(req.params.id)
		.exec(function(err,job){
		if(err) return next(err);
		if (!job)
		{
			req.flash('error', 'Job ID undefined!');
			return res.render('admin/edit-job',{
				job:false, 
				returnpage:encodeURIComponent(referrer), 
				errors: req.flash('error'), message:req.flash('success')
			});
		}
		job.startDate = res.locals.DateToInput(job.startDate);
		job.endDate = res.locals.DateToInput(job.endDate);
		//console.log("job:" + job);
		return res.render('admin/edit-job',{
			job:job,
			returnpage:encodeURIComponent(referrer), 
			errors: req.flash('error'), message:req.flash('success')
		});
	});

});


router.post('/edit-job/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	var returnpage = req.query.r || referrer;	
	
	Job.findById(req.params.id,
		function(err, job){
			if(err) return next(err);
			
			job.hidden = req.body.hidden;
			job.featured = req.body.featured;
			job.title = req.body.title;
			job.type = req.body.type;
			job.company = req.body.company;
			job.address = req.body.address;
			job.startDate = req.body.startDate;
			job.endDate = req.body.endDate;
			job.email = req.body.email;
			job.skills = req.body.skills;
			job.description = req.body.description;
			job.displayDate = req.body.displayDate;
					
			Category.findOne(
				{name: req.body.field},
				function(err, field){
					if(err) return next(err);
					if (!field || !field._id) 
					{
						req.flash('error', 'Job field undefined!');
						return res.render('admin/edit-job',{
							job:job,
							returnpage:returnpage, 
							errors: req.flash('error'), message:req.flash('success')
						});
					}
					
					job.field = field.name;
								
					job.save(function(err, results) {
						if(err) return next(err);
						if (!results)
						{
							req.flash('error', 'Failed to edit job offer!');
							return res.render('admin/edit-job',{
								job:job,
								returnpage:returnpage, 
								errors: req.flash('error'), message:req.flash('success')
							});
						}
						//console.log(req.returnpage +":"+ res.returnpage);

						req.flash('success', 'Successfully edited job offer');
						//console.log("req.query:" + req.query )
						
						//return res.redirect('/job/' + req.params.id);
										
						return res.redirect(returnpage);	
					});
				}
			);
		}
	);
});

router.get('/delete-job/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';

	Job.findById(req.params.id)
		.exec(function(err,job){
		if(err) return next(err);
		if (!job)
		{
			req.flash('error', 'Job ID undefined!');
			return res.redirect(referrer);
		}
		//console.log("job:" + job);
		return res.render('admin/delete-job',{
			job:job,
			returnpage:encodeURIComponent(referrer)
		});
	});
});

router.post('/delete-job/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	var returnpage = req.query.r || referrer;
	/*Job.findByIdAndRemove(req.params.id, function(err) {
		if(err) return next(err);
		console.log("removed null job id: " + req.params.id);
		res.setHeader("Content-Type", "text/html");
		res.setHeader("Access-Control-Allow-Origin", "*");
		return res.send("done");	
	});*/
	//57600fd2334b82d8048b7a44 test
	Job.findById({_id:req.params.id}, function(err, job) {
		if(err) return next(err);
		if (!job)
		{
			req.flash('error', 'Failed to delete job offer!');
			return res.redirect(referrer);
		}
		else
		{
			job.remove(function(err, job) {
				 if (err) {
					console.log(err);
					return next(err);
				 }  
				req.flash('success', 'Successfully deleted job offer');
				//console.log("req.query:" + req.query )
				return res.redirect(returnpage);	 
		   });
		}
   });
});

/*
router.post('/ajax-list-jobs',function(req,res,next){
	res.redirect('/admin/ajax-list-jobs');
});
router.get('/ajax-list-jobs',function(req,res,next){
	//console.log(req.query);
	var query = req.query.q || "";
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.searchlimit;
	var frm = Math.max(0,page*num-num);
	
	
	//var regex = new RegExp(["^", title, "$"].join(""), "i");
	var searchproperties = {
			"query" : {
				"match_all" : {}
			  }
		};
	if (query!="")
	{
		searchproperties = {query_string: {query: query}};
	}
	Job.search(searchproperties,
		{hydrate: false, from: frm, size: num},
	//{"title" : {$regex: '/' + title + '/'} }
	function(err,results){
		if(err) return next(err);

		res.setHeader("Content-Type", "text/html");
        res.setHeader("Access-Control-Allow-Origin", "*");
        return res.send(JSON.stringify(results))
	});
});
*/

router.post('/list-jobs',function(req,res,next){
	res.redirect('/admin/list-jobs');
});
router.get('/list-jobs',function(req,res,next){
	var query = req.query.q || "";
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.searchlimit;
	var frm = Math.max(0,page*num-num);
	
	var jobfield = req.query.f || "";
	var jobtype = req.query.t || "";
	
	var queryarray = [];
	if (query!="")
	{
		queryarray.push(query);
	}
	if (jobfield!="")
	{
		jobfield = "field:(" + jobfield + ")";
		queryarray.push(jobfield);
	}
	if (jobtype!="")
	{
		jobtype = "type:(" + jobtype + ")";
		queryarray.push(jobtype);
	}
	var querystring = queryarray.join(" AND ");
	
	var searchproperties = {"query" : {	"match_all" : {} } };
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "OR"}};
	}
	Job.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: "date:desc"},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			var total = results.hits.total;
			return res.render('admin/list-jobs',{
				data:hits,
				jobfield:jobfield,
				jobtype:jobtype, 
				query:query, 
				page:page, 
				number:num, 
				total:total, 
				errors: req.flash('error'), message:req.flash('success')
			});
	});
});

/*
router.get('/delete-index',function(req,res,next){
	Job.esTruncate({},function(err, results){
			if(err) return next(err);
			return res.send("INDEX REMOVED");
	});
});
*/

router.get('/test-jobs',function(req,res,next){
	Job.find({}, function(err, jobs) {
		if (err) return next(err);
		var total = jobs.length;
		Job.search(
			{"query" : {	"match_all" : {} } },
			function(err, results){
				if(err) return next(err);
				Job.search(
					{"query" : {	"match_all" : {} } },
					{size: results.hits.total},
					function(err, results){
						if(err) return next(err);
						
						
						
						var clean = 0;
						var error = 0;
						var problematic = "";
						for (var i=0; i<results.hits.hits.length; i++)
						{
							var test = results.hits.hits[i];
							if (test && test._source && test._source.date && Date.parse(test._source.date))
							{
								clean++;
							}
							else
							{
								error++;
								problematic += test._id + ":" + Date.parse(test._source.date) + " ";
							}
							//5746f7316ea4ba4d7a5bc454
						}
						console.log("type:" + test._source.date)
						
						
						return res.send(JSON.stringify({total: total,clean: clean, error: error, total: results.hits.hits.length, problematic: problematic}));
					}
				);
			}
		);
	});
});



//JSON.stringify(data)
module.exports=router;
