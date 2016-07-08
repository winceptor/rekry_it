var router = require('express').Router();
var Category = require('../models/category');
var Job = require('../models/job');
var User = require('../models/user');

router.post('/list-categories',function(req,res,next){
	res.redirect('/admin/list-categories');
});
router.get('/list-categories',function(req,res,next){
	var query = req.query.q || "";
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_listlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	var searchproperties = {"query" : {	"match_all" : {} } };
	
	var querystring = query.split(" ").join(" AND ");
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "OR"}};
	}
	Category.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: "category"},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			var total = results.hits.total;
			return res.render('admin/list-categories',{
				data:hits,
				query:query, 
				page:page, 
				number:num, 
				total:total, 
				errors: req.flash('error'), message:req.flash('success')
			});
	});
});


router.get('/edit-category/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';

	Category.findById(req.params.id, function(err,category){
		if(err) return next(err);
		if (!category)
		{
			return console.log("error null category: " + req.params.id);
		}
		return res.render('admin/edit-category',{
			category:category,
			returnpage:encodeURIComponent(referrer), 
			errors: req.flash('error'), message:req.flash('success')
		});
	});

});


router.post('/edit-category/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	
	var returnpage = req.query.r || referrer;
	
	var id = req.params.id;
	
	Category.findById(id, function(err,category){
		if(err) return next(err);
		if (!category)
		{
			return console.log("error null category: " + id);
		}
		var oldname = category.name;
		//var oldcategory = category.category;
		category.name = req.body.name;
		category.category = req.body.category;
		
		Category.findOne({name:req.body.name, category:req.body.category},function(err,cat){

			if(cat && cat._id.toString()!=id.toString() ){
				req.flash('error','###category### ###alreadyexists###');

				return res.render('admin/edit-category',{
					category: category,
					errors: req.flash('error'), message:req.flash('success')
				});
			} else {		
				category.save(function(err) {
					if (err) return next(err);
					category.on('es-indexed', function(err, result){
						if (err) return next(err);
						//console.log("Renamed category:" + oldname + "->" + req.body.name);
						req.flash('success', '###category### ###edited###');
						
						//setInterval(function() {
							return res.redirect("/category/" + id);	
						//},1000);
						
						//return res.redirect("/admin/list-categories");	 
					});
				});
				/*
					
				//var querystring = "category:(" + oldname + ")";
				//searchproperties = {query_string: {query: querystring}};
				if (category.category=="field")
				{
					Job.find({field : oldname},
						function(err, results){
							if(err) return next(err);
							if (results)
							{
								results.forEach(function(job) { 
									job.field = req.body.name;
												
									job.save(function(err, results) {
										if(err) return next(err);
									});
								});
							}
						}
					)
					
					User.find({fieldOfStudy : oldname},
						function(err, results){
							if(err) return next(err);
							if (results)
							{
								results.forEach(function(user) { 
									user.fieldOfStudy = req.body.name;
												
									user.save(function(err, results) {
										if(err) return next(err);
									});
								});
							}
						}
					)
				}
				
				if (category.category=="type")
				{
					Job.find({type : oldname},
						function(err, results){
							if(err) return next(err);
							if (results)
							{
								results.forEach(function(job) { 
									job.type = req.body.name;
												
									job.save(function(err, results) {
										if(err) return next(err);
									});
								});
							}
						}
					);
				}
				
				if (category.category=="level")
				{
					User.find({typeOfStudies : oldname},
						function(err, results){
							if(err) return next(err);
							if (results)
							{
								results.forEach(function(user) { 
									user.typeOfStudies = req.body.name;
												
									user.save(function(err, results) {
										if(err) return next(err);
									});
								});
							}
						}
					)
				}
				*/
			}
		});
	});

});

router.get('/delete-category/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';

	Category.findById(req.params.id, function(err,category){
		if(err) return next(err);
		if (!category)
		{
			return console.log("error null category: " + req.params.id);
		}
		return res.render('admin/delete-category',{
			entry:category,
			returnpage:encodeURIComponent(referrer),
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});

router.post('/delete-category/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	//console.log(req.returnpage + ":" + res.returnpage + ":" + res.locals.returnpage);
	var returnpage = req.query.r || referrer;
	Category.findById({_id:req.params.id}, function(err, category) {
		if(err) return next(err);
		if (!category)
		{
			req.flash('error', '###category### ###not### ###removed###');
			return res.redirect(referrer);
		}
		else
		{
			category.remove(function(err, category) {
				 if (err) {
					console.log(err);
					return next(err);
				 }  
				req.flash('success', '###category### ###removed###');
				//console.log("req.query:" + req.query )
				return res.redirect("/admin/list-categories");	 
		   });
		}
   });
});


router.get('/add-category',function(req,res,next){
  return res.render('admin/add-category',{category:false, errors: req.flash('error'), message:req.flash('success')});
});

router.post('/add-category', function(req, res, next) {
	var referrer = req.header('Referer') || '/';

	var category = new Category();
	category.name = req.body.name;
	category.category = req.body.category;

	Category.findOne({name:req.body.name, category:req.body.category},function(err,cat){

		if(cat){
			req.flash('error','###category### ###alreadyexists###');

			return res.render('admin/add-category',{
				category: category,
				errors: req.flash('error'), message:req.flash('success')
			});
		} else {
			category.save(function(err) {
				if (err) return next(err);
				category.on('es-indexed', function(err, result){
				if (err) return next(err);
					req.flash('success', '###category### ###added###');
					return res.redirect("/admin/list-categories");
				});
			});
		}
	});
});


router.get('/fix-cats',function(req,res,next){
	Category.find({}, function(err, result) {
		if (err) return next(err);
		var num = result.length;
		Category.search(
			{"query" : {	"match_all" : {} } },
			{hydrate: true, from: 0, size: num},
			function(err, results){
				if(err) return next(err);
				
				var hits = results.hits.hits;
				var total = results.hits.total;
			
				var total = results.length;
				var catnames = res.locals.catnames;
				var clean = 0;
				var error = 0;
				var changed = 0;
				var problematic = "";
				for (var i=0; i<hits.length; i++)
				{
					var id = i;
					var test = hits[i];
					if (test)
					{
						clean++;
						
						for (k in catnames)
						{
							console.log(test.category + "==" + catnames[k]);
							if (test.category.toString()==catnames[k])
							{
								test.category = k;
								test.save(function(err, result) {
									if(err) return next(err);
									if (!result)
									{
										console.log("some error");
									}
								});
								changed++;
							}
						}
						
						
					}
					else
					{
						error++;
						problematic += id + " ";
					}

				}

				return res.send(JSON.stringify({total: total,clean: clean, error: error, changed: changed, problematic: problematic}));
			}
		);
	});
});

//JSON.stringify(data)
module.exports=router;
