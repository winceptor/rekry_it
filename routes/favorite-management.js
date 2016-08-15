var router = require('express').Router();

var Job = require('../models/job');
var Favorite = require('../models/favorite');

router.post('/list-favorites',function(req,res,next){
	//res.redirect('/admin/list-favorites?q='+req.body.q+'&p='+req.body.p+'&n='+req.body.n);
	res.redirect('/admin/list-favorites');
});
router.get('/list-favorites',function(req,res,next){
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
	Favorite.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: "date:desc"},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			hits = hits.filter(function(e){return e}); 
			var total = results.hits.total-results.hits.hits.length+hits.length;
			Favorite.populate(
				hits, 
				[{ path: 'user'}, { path: 'job'}], 
				function(err, hits) {
					if(err) return next(err);
					return res.render('admin/list-favorites',{
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


router.get('/delete-favorite/:id',function(req,res,next){
	

	Favorite.findById(req.params.id, function(err,favorite){
		if(err) return next(err);
		if (!favorite)
		{
			req.flash('error', '###favorite### ###id### ###undefined###!');
			return res.redirect("/admin/list-favorites");	 
		}
		return res.render('admin/delete-favorite',{
			entry:favorite,
			
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});

router.post('/delete-favorite/:id',function(req,res,next){
	
	
	
	Favorite.findById({_id:req.params.id}, function(err, favorite) {
		if(err) return next(err);
		if (!favorite)
		{
			req.flash('error', '###favorite### ###id### ###undefined###!');
			return res.redirect("/admin/list-favorites");	 
		}
		else
		{
			favorite.remove(function(err, favorite) {
				 if (err) {
					console.log(err);
					return next(err);
				 }  
				return res.resultmessage('success', '###favorite### ###removed###');
				
				//return res.redirect("/admin/list-favorites");	 
		   });
		}
   });
});

//JSON.stringify(data)
module.exports=router;
