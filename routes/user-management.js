var router = require('express').Router();
var User = require('../models/user');
var Field = require('../models/field');

router.post('/list-users',function(req,res,next){
	//res.redirect('/admin/list-users?q='+req.body.q+'&p='+req.body.p+'&n='+req.body.n);
	res.redirect('/admin/list-users');
});
router.get('/list-users',function(req,res,next){
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
		queryarray.push(jobfield);
	}
	if (jobtype!="")
	{
		queryarray.push(jobtype);
	}
	var querystring = queryarray.join(" AND ");
	
	var searchproperties = {"query" : {	"match_all" : {} } };
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "OR"}};
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
	
	profile.admin = user_admin;
	profile.name = req.body.name;	
	profile.email = req.body.email;
	profile.password = req.body.password;
	profile.skills = req.body.skills;
	profile.keywords = req.body.keywords;
	profile.dateOfBirth = req.body.dateOfBirth;
	profile.country = req.body.country;
	profile.gender = req.body.gender;
	profile.field = req.body.field;
	profile.yearOfStudies = req.body.yearOfStudies;
	profile.typeOfStudies = req.body.typeOfStudies;
	profile.typeOfJob = req.body.typeOfJob;
	
	if (req.body.password != req.body.passwordcheck)
	{
		req.flash('error','Passwords must match!');

			return res.render('admin/add-user',{
				profile: profile,
				errors: req.flash('error')
			});
	}
	
	
	if (req.body.admin)
	{
		var admin = req.user && req.user.admin;
		var remoteip = req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
		var localadmin = res.locals.localhostadmin && (remoteip=="localhost" || remoteip=="127.0.0.1" || remoteip=="::ffff:127.0.0.1");
		//console.log("req.body.admin:" + req.body.admin + " ip:" + remoteip);
		if (admin || localadmin) {
			user_admin = req.body.admin;	
		}
		else
		{
			req.flash('error','Unable to create admin account!');

			return res.render('admin/add-user',{
				profile: profile,
				errors: req.flash('error')
			});
		}
	}
	

	//console.log(req.body.name);


	/*user.profile.name=req.body.name;
	user.password=req.body.password;
	user.email=req.body.email;*/
	User.findOne({email:req.body.email},function(err,existingUser){

		if(existingUser){
			req.flash('error','Account with that email address already exists');

			return res.render('user/signup',{
				profile: profile,
				errors: req.flash('error')
			});
		} else {
			profile.save(function(err,user){
				if(err) return next (err);

				req.flash('success', 'Successfully added a user');
				return res.redirect('/profile/' + user._id);

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
			console.log("error null user: " + req.params.id);
			return next();
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
	
	console.log("req.body.admin:" + req.body.admin);	
	
	var profile = new User();

	profile.gender = req.body.gender;
	profile.name = req.body.name;
	profile.email = req.body.email;
	profile.dateOfBirth = req.body.dateOfBirth;
	profile.country = req.body.country;
	profile.fieldOfStudy = req.body.fieldOfStudy;
	profile.yearOfStudies = req.body.yearOfStudies;
	profile.typeOfStudies = req.body.typeOfStudies;
	profile.typeOfJob = req.body.typeOfJob;
	profile.skills = req.body.skills;
	profile.keywords = req.body.keywords;
	
	profile.admin = req.body.admin;

	Field.findOne(
		{field: req.body.fieldOfStudy},
		function(err, field){
			if(err) return next(err);
			if (!field || !field._id)
			{
				req.flash('error', 'Invalid job field!');
				return res.render('admin/edit-user',{
					profile:profile,
					returnpage:returnpage,
					errors: req.flash('error')
				});
			}
			
			User.findOne({email:profile.email},function(err,existingUser){

				if(existingUser && existingUser._id!=req.params.id){
					req.flash('error','Account with that email address already exists');

					return res.render('admin/edit-user',{
						profile:profile,
						returnpage:returnpage,
						errors: req.flash('error')
					});
				} else {
					User.update(
						{ _id:req.params.id },
						{ 
							admin : profile.admin,
							name : profile.name,
							email : profile.email,
							dateOfBirth : profile.dateOfBirth,
							country : profile.country,
							fieldOfStudy : profile.fieldOfStudy,
							yearOfStudies : profile.yearOfStudies,
							typeOfStudies : profile.typeOfStudies,
							typeOfJob : profile.typeOfJob,
							skills : profile.skills,
							keywords : profile.keywords,
							gender : profile.gender
						}, 
						function(err, results) {
							if(err) return next(err);
							if (!results)
							{
								req.flash('error', 'Invalid user!');
								return res.redirect(referrer);
							}
							//console.log(req.returnpage +":"+ res.returnpage);

							req.flash('success', 'Successfully edited user');
							//console.log("req.query:" + req.query )
							
							//return res.redirect('/user/' + req.params.id);
											
							return res.redirect(returnpage);	
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
			console.log("error null user: " + req.params.id);
			return next();
		}
		return res.render('admin/delete-user',{
			profile:user,
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
			req.flash('error', 'Failed to delete user!');
			return res.redirect(referrer);
		}
		else
		{
			user.remove(function(err, user) {
				 if (err) {
					console.log(err);
					return next(err);
				 }  
				req.flash('success', 'Successfully deleted user');
				//console.log("req.query:" + req.query )
				return res.redirect(returnpage);	 
		   });
		}
   });
});

//JSON.stringify(data)
module.exports=router;
