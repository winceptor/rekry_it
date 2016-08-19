var router = require('express').Router();

var Job = require('../models/job');
var Application = require('../models/application');

router.post('/list-applications',function(req,res,next){
	//res.redirect('/admin/list-applications?q='+req.body.q+'&p='+req.body.p+'&n='+req.body.n);
	res.redirect('/admin/list-applications');
});
router.get('/list-applications',function(req,res,next){
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
	Application.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: "date:desc"},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			hits = hits.filter(function(e){return e}); 
			var total = results.hits.total-results.hits.hits.length+hits.length;
			Application.populate(
				hits, 
				[{ path: 'user'}, { path: 'job'}], 
				function(err, hits) {
					if(err) return next(err);
					return res.render('admin/list-applications',{
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


router.get('/edit-application/:id',function(req,res,next){
	

	Application.findById(req.params.id, function(err,application){
		if(err) return next(err);
		if (!application)
		{
			return res.resultmessage('error', '###application### ###id### ###undefined###!');
			//return res.redirect("/admin/list-applications");
		}
		//console.log("application:" + application);
		return res.render('admin/edit-application',{
			application:application,
			
			errors: req.flash('error'), message:req.flash('success')
		});
	});

});


router.post('/edit-application/:id',function(req,res,next){
	
		
	
	//console.log("req.body.admin:" + req.body.admin);	
	
	Application.findById(req.params.id,function(err,application){
			if(err) return next(err);
			
			if (!application)
			{
				return res.resultmessage('error', '###application### ###id### ###undefined###!');
				//return res.redirect("/admin/list-applications");
			}
			
			var birthday = res.locals.InputToDate(req.body.dateOfBirth);
	
			application.admin = req.body.admin;		
			application.gender = req.body.gender;
			application.name = req.body.name;
			application.email = req.body.email;
			application.phone = req.body.phone;
			application.dateOfBirth = birthday;
			application.country = req.body.country;
			application.fieldOfStudy = req.body.fieldOfStudy || null;
			application.yearOfStudies = req.body.yearOfStudies;
			application.typeOfStudies = req.body.typeOfStudies || null;
			application.typeOfJob = req.body.typeOfJob || null;
			application.skills = req.body.skills;
			application.keywords = req.body.keywords;
			
			if (req.body.password!="")
			{
				application.password = req.body.password;
			}
			
			var problem = application.validateInput(req, res);
			if (problem)
			{
				req.flash('error',problem);

				return res.render('admin/edit-application',{
					application: application,
					
					errors: req.flash('error')
				});
			}
			
			Application.findOne({email:req.params.email},function(err,existingApplication){
				if(err) return next(err);
				if(existingApplication && existingApplication._id.toString()!=req.params.id.toString()){
					req.flash('error','###application### ###alreadyexists###');

					return res.render('admin/edit-application',{
						application:application,
						
						errors: req.flash('error')
					});
				} else {
					application.save( 
						function(err, results) {
							if(err) return next(err);
							if (!results)
							{
								req.flash('error', '###application### ###not### ###edited###!');
								return res.redirect(res.locals.referer);
							}
							application.on('es-indexed', function(err, result){
								if (err) return next(err);
								

								req.flash('success', '###application### ###edited###');
								
								
								//return res.redirect('/application/' + req.params.id);
												
								return res.redirect(res.locals.referer);
							});
						}
					);
				}
			});	

		}
	);
});

router.get('/delete-application/:id',function(req,res,next){
	

	Application.findById(req.params.id, function(err,application){
		if(err) return next(err);
		if (!application)
		{
			return res.resultmessage('error', '###application### ###id### ###undefined###!');
			//return res.redirect("/admin/list-applications");
		}
		return res.render('admin/delete-application',{
			entry:application,
			
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});

router.post('/delete-application/:id',function(req,res,next){
	
	
	
	Application.findById({_id:req.params.id}, function(err, application) {
		if(err) return next(err);
		if (!application)
		{
			return res.resultmessage('error', '###application### ###id### ###undefined###!');
			//return res.redirect("/admin/list-applications");
		}
		else
		{
			application.remove(function(err, application) {
				 if (err) {
					console.log(err);
					return next(err);
				 }  

				if (req.query && req.query.stay && req.query.stay=="true")
				{
					req.flash('success', '###application### ###removed###');
					return res.redirect(res.locals.referer);
				}
				return res.resultmessage('success', '###application### ###removed###');
		   });
		}
   });
});

//JSON.stringify(data)
module.exports=router;
