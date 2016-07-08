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
	
	var query = req.query.q;
	
	var jobfield = req.query.f || false;
	var jobtype = req.query.t || false;
	
	var querystring = "";
	
	if (query)
	{
		querystring += query + " ";
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
	User.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: "date:desc"},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			var total = results.hits.total;
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
	});
});

router.get('/add-user',function(req,res,next){
  return res.render('admin/add-user',{profile:false, errors: req.flash('error'), message:req.flash('success')});
});

router.post('/add-user', function(req, res, next) {
	var referrer = req.header('Referer') || '/';
	var profile=new User();
	
	var user_admin = false;
	
	var birthday = res.locals.InputToDate(req.body.dateOfBirth);
	
	profile.admin = req.body.admin;	
	profile.name = req.body.name;	
	profile.email = req.body.email;
	profile.phone = req.body.phone;
	profile.password = req.body.password;
	profile.skills = req.body.skills;
	profile.keywords = req.body.keywords;
	profile.dateOfBirth = birthday;
	profile.country = req.body.country;
	profile.gender = req.body.gender;
	profile.fieldOfStudy = req.body.fieldOfStudy || null;
	profile.yearOfStudies = req.body.yearOfStudies;
	profile.typeOfStudies = req.body.typeOfStudies || null;
	profile.typeOfJob = req.body.typeOfJob || null;
	
	var problem = profile.validateInput(req, res);
	if (problem)
	{
		req.flash('error',problem);

		return res.render('admin/add-user',{
			profile: profile,
			errors: req.flash('error')
		});
	}

	//console.log(req.body.name);


	/*user.profile.name=req.body.name;
	user.password=req.body.password;
	user.email=req.body.email;*/
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
					req.flash('success', '###user### ###added###');
					return res.redirect("/admin/list-users");	 
				});
			});
		}
	});

});


router.get('/edit-user/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';

	User.findById(req.params.id, function(err,user){
		if(err) return next(err);
		if (!user)
		{
			req.flash('error', '###user### ###id### ###undefined###!');
			return res.redirect(referrer);
		}
		//console.log("user:" + user);
		return res.render('admin/edit-user',{
			profile:user,
			returnpage:encodeURIComponent(referrer),
			errors: req.flash('error'), message:req.flash('success')
		});
	});

});


router.post('/edit-user/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	var returnpage = req.query.r || referrer;	
	
	//console.log("req.body.admin:" + req.body.admin);	
	
	User.findById(req.params.id,function(err,profile){
			if(err) return next(err);
			var birthday = res.locals.InputToDate(req.body.dateOfBirth);
	
			profile.admin = req.body.admin;		
			profile.gender = req.body.gender;
			profile.name = req.body.name;
			profile.email = req.body.email;
			profile.phone = req.body.phone;
			profile.dateOfBirth = birthday;
			profile.country = req.body.country;
			profile.fieldOfStudy = req.body.fieldOfStudy || null;
			profile.yearOfStudies = req.body.yearOfStudies;
			profile.typeOfStudies = req.body.typeOfStudies || null;
			profile.typeOfJob = req.body.typeOfJob || null;
			profile.skills = req.body.skills;
			profile.keywords = req.body.keywords;
			
			if (req.body.password!="")
			{
				profile.password = req.body.password;
			}
			
			var problem = profile.validateInput(req, res);
			if (problem)
			{
				req.flash('error',problem);

				return res.render('admin/edit-user',{
					profile: profile,
					returnpage:returnpage,
					errors: req.flash('error')
				});
			}
			
			User.findOne({email:req.params.email},function(err,existingUser){
				if(err) return next(err);
				if(existingUser && existingUser._id.toString()!=req.params.id.toString()){
					req.flash('error','###user### ###alreadyexists###');

					return res.render('admin/edit-user',{
						profile:profile,
						returnpage:returnpage,
						errors: req.flash('error')
					});
				} else {
					profile.save( 
						function(err, results) {
							if(err) return next(err);
							if (!results)
							{
								req.flash('error', '###user### ###not### ###edited###!');
								return res.redirect(referrer);
							}
							profile.on('es-indexed', function(err, result){
								if (err) return next(err);
								//console.log(req.returnpage +":"+ res.returnpage);

								req.flash('success', '###user### ###edited###');
								//console.log("req.query:" + req.query )
								
								return res.redirect('/profile/' + req.params.id);
												
								//return res.redirect("/admin/list-users");
							});
						}
					);
				}
			});	

		}
	);
});

router.get('/delete-user/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';

	User.findById(req.params.id, function(err,user){
		if(err) return next(err);
		if (!user)
		{
			req.flash('error', '###user### ###id### ###undefined###!');
			return res.render('admin/delete-user',{
				profile:user,
				returnpage:encodeURIComponent(referrer),
				errors: req.flash('error'), message:req.flash('success')
			});
		}
		return res.render('admin/delete-user',{
			entry:user,
			returnpage:encodeURIComponent(referrer),
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});

router.post('/delete-user/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	//console.log(req.returnpage + ":" + res.returnpage + ":" + res.locals.returnpage);
	var returnpage = req.query.r || referrer;
	User.findById({_id:req.params.id}, function(err, user) {
		if(err) return next(err);
		if (!user)
		{
			req.flash('error', '###user### ###not### ###removed###!');
			return res.redirect(referrer);
		}
		else
		{
			user.remove(function(err, user) {
				 if (err) {
					console.log(err);
					return next(err);
				 }  
				req.flash('success', '###user### ###removed###');
				//console.log("req.query:" + req.query )
				return res.redirect("/admin/list-users");	 
		   });
		}
   });
});

//JSON.stringify(data)
module.exports=router;
