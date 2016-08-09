var router = require('express').Router();

var Feedback = require('../models/feedback');

router.post('/list-feedback',function(req,res,next){
	//res.redirect('/admin/list-feedback?q='+req.body.q+'&p='+req.body.p+'&n='+req.body.n);
	res.redirect('/admin/list-feedback');
});
router.get('/list-feedback',function(req,res,next){
	var query = req.query.q || "";
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_listlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	var query = req.query.q;
	
	var jobfield = req.query.f || false;
	var jobtype = req.query.t || false;
	
	var querystring = "";
	
	if (query)
	{
		querystring += res.locals.sanitize(query) + " ";
	}
	if (jobfield)
	{
		jobfield = typeof jobfield=="string" ? jobfield : jobfield.join(" OR ");
		querystring += "fieldOfStudy:(" + jobfield + ") ";
	}
	if (jobtype)
	{
		jobtype = typeof jobtype=="string" ? jobtype : jobtype.join(" OR ");
		querystring += "typeOfJob:(" + jobtype + ") ";
	}

	var searchproperties = {"query" : {	"match_all" : {} } };
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
	}
	Feedback.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: "date:desc"},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			hits = hits.filter(function(e){return e}); 
			var total = results.hits.total-results.hits.hits.length+hits.length;
			Feedback.populate(
				hits, 
				[{ path: 'user'}, { path: 'job'}], 
				function(err, hits) {
					if(err) return next(err);
					return res.render('admin/list-feedback',{
						data:hits,
						jobfield:jobfield,
						jobtype:jobtype, 
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


router.get('/delete-feedback/:id',function(req,res,next){
	

	Feedback.findById(req.params.id, function(err,feedback){
		if(err) return next(err);
		if (!feedback)
		{
			req.flash('error', '###feedback### ###id### ###undefined###!');
			return res.redirect(res.locals.referer);
		}
		return res.render('admin/delete-feedback',{
			entry:feedback,
			
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});

router.post('/delete-feedback/:id',function(req,res,next){
	Feedback.findById({_id:req.params.id}, function(err, feedback) {
		if(err) return next(err);
		if (!feedback)
		{
			req.flash('error', '###feedback### ###id### ###undefined###!');
			return res.redirect(res.locals.referer);
		}
		else
		{
			feedback.remove(function(err, feedback) {
				 if (err) {
					console.log(err);
					return next(err);
				 }  
				return res.resultmessage('success', '###feedback### ###removed###');
				
				//return res.redirect("/admin/list-feedback");	 
		   });
		}
   });
});

//JSON.stringify(data)
module.exports=router;
