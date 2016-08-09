var router = require('express').Router();
var User = require('../models/user');
var Category = require('../models/category');

router.post('/list-users',function(req,res,next){
	//res.redirect('/admin/list-users?q='+req.body.q+'&p='+req.body.p+'&n='+req.body.n);
	res.redirect('/admin/list-users');
});
router.get('/list-users',function(req,res,next){
	var query = req.query.q || "";
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_listlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	var query = req.query.q || "";
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
		querystring += "fieldOfStudy:(" + jobfield + ") ";
	}
	if (jobtype!="")
	{
		jobtype = typeof jobtype=="string" ? jobtype : jobtype.join(" OR ");
		querystring += "typeOfJob:(" + jobtype + ") ";
	}

	var searchproperties = {"query" : {	"match_all" : {} } };
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
	}
	User.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: "date:desc"},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			hits = hits.filter(function(e){return e}); 
			var total = results.hits.total-results.hits.hits.length+hits.length;
			User.populate(
				hits, 
				[{ path: 'fieldOfStudy'}, { path: 'typeOfStudies'}], 
				function(err, hits) {
					if(err) return next(err);
					return res.render('admin/list-users',{
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

router.post('/delete-users',function(req,res,next){
	var query = req.query.q || "";
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_listlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	var query = req.query.q || "";
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
		querystring += "fieldOfStudy:(" + jobfield + ") ";
	}
	if (jobtype!="")
	{
		jobtype = typeof jobtype=="string" ? jobtype : jobtype.join(" OR ");
		querystring += "typeOfJob:(" + jobtype + ") ";
	}

	var searchproperties = {"query" : {	"match_all" : {} } };
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
	}
	User.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: "date:desc"},
		function(err, results){
			if(err) return next(err);
			var data=results.hits.hits.map(function(hit){
				return hit;
			});
			var total = results.hits.total;
			data.forEach(function(user) { 
				user.remove(function(err, result) {
					if(err) return next(err);
				});
			});
			return res.locals.resultmessage('success', total + ' ###users### ###removed###');
			//res.slowredirect('/admin/list-users');
	});
});
router.get('/delete-users',function(req,res,next){
	var query = req.query.q || "";
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_listlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	var query = req.query.q || "";
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
		querystring += "fieldOfStudy:(" + jobfield + ") ";
	}
	if (jobtype!="")
	{
		jobtype = typeof jobtype=="string" ? jobtype : jobtype.join(" OR ");
		querystring += "typeOfJob:(" + jobtype + ") ";
	}

	var searchproperties = {"query" : {	"match_all" : {} } };
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
	}
	User.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: "date:desc"},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			hits = hits.filter(function(e){return e}); 
			var total = results.hits.total-results.hits.hits.length+hits.length;
			User.populate(
				hits, 
				[{ path: 'fieldOfStudy'}, { path: 'typeOfStudies'}], 
				function(err, hits) {
					if(err) return next(err);
					return res.render('admin/delete-users',{
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

router.get('/add-user',function(req,res,next){
  return res.render('admin/add-user',{profile:false, errors: req.flash('error'), message:req.flash('success')});
});

router.post('/add-user', function(req, res, next) {
	
	var profile=new User();
	
	var problem = profile.processForm(req, res);
	if (problem)
	{
		req.flash('error',problem);

		return res.render('admin/add-user',{
			profile: profile,
			errors: req.flash('error')
		});
	}

	User.findOne({email:req.body.email},function(err,existingUser){

		if(existingUser){
			req.flash('error','###user### ###alreadyexists###');

			return res.render('admin/add-user',{
				profile: profile,
				errors: req.flash('error')
			});
		} else {
			profile.save(function(err,user){
				if(err) return next (err);
				profile.on('es-indexed', function(err, result){
					if (err) return next(err);
					return res.locals.resultmessage('success', '###user### ###added###');
					//return res.redirect("/admin/list-users");	
					//return res.redirect(res.locals.referer);					
				});
			});
		}
	});

});


router.get('/edit-user/:id',function(req,res,next){
	

	User.findById(req.params.id, function(err,user){
		if(err) return next(err);
		if (!user)
		{
			req.flash('error', '###user### ###id### ###undefined###!');
			return res.redirect(res.locals.referer);
		}
		//console.log("user:" + user);
		return res.render('admin/edit-user',{
			profile:user,
			
			errors: req.flash('error'), message:req.flash('success')
		});
	});

});


router.post('/edit-user/:id',function(req,res,next){
	
		
	
	//console.log("req.body.admin:" + req.body.admin);	
	
	User.findById(req.params.id,function(err,profile){
			if(err) return next(err);
			
			if (!profile)
			{
				req.flash('error', '###user### ###id### ###undefined###!');
				return res.redirect(res.locals.referer);
			}
			
			var problem = profile.processForm(req, res);
			if (problem)
			{
				req.flash('error',problem);

				return res.render('admin/edit-user',{
					profile: profile,
					
					errors: req.flash('error')
				});
			}
			
			User.findOne({email:req.params.email},function(err,existingUser){
				if(err) return next(err);
				if(existingUser && existingUser._id.toString()!=req.params.id.toString()){
					req.flash('error','###user### ###alreadyexists###');

					return res.render('admin/edit-user',{
						profile:profile,
						
						errors: req.flash('error')
					});
				} else {
					profile.save( 
						function(err, results) {
							if(err) return next(err);
							if (!results)
							{
								req.flash('error', '###user### ###not### ###edited###!');
								return res.redirect(res.locals.referer);
							}
							profile.on('es-indexed', function(err, result){
								if (err) return next(err);
								

								return res.locals.resultmessage('success', '###user### ###edited###');
								
								
								//return res.redirect('/profile/' + req.params.id);
												
								//return res.redirect("/admin/list-users");
								//return res.redirect(res.locals.referer);
							});
						}
					);
				}
			});	

		}
	);
});

router.get('/delete-user/:id',function(req,res,next){
	

	User.findById(req.params.id, function(err,profile){
		if(err) return next(err);
		if (!profile)
		{
			req.flash('error', '###user### ###id### ###undefined###!');
			return res.redirect(res.locals.referer);
		}
		return res.render('admin/delete-user',{
			entry:profile,
			
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});

router.post('/delete-user/:id',function(req,res,next){
	
	
	
	User.findById({_id:req.params.id}, function(err, profile) {
		if(err) return next(err);
		if (!profile)
		{
			req.flash('error', '###user### ###id### ###undefined###!');
			return res.redirect(res.locals.referer);
		}
		else
		{
			profile.remove(function(err, profile) {
				 if (err) {
					console.log(err);
					return next(err);
				 }  
				return res.locals.resultmessage('success', '###user### ###removed###');
				
				//return res.redirect("/admin/list-users");	 
		   });
		}
   });
});

//JSON.stringify(data)
module.exports=router;
