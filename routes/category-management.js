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
	var num = req.query.n || res.locals.searchlimit;
	var frm = Math.max(0,page*num-num);
	
	var searchproperties = {"query" : {	"match_all" : {} } };
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
	
	Category.findById(req.params.id, function(err,category){
		if(err) return next(err);
		if (!category)
		{
			return console.log("error null category: " + req.params.id);
		}
		var oldname = category.name;
		//var oldcategory = category.category;
		category.name = req.body.name;
		//category.category = req.body.category;
		
		Category.findOne({name:req.body.name, category:req.body.category},function(err,cat){

			if(cat && cat._id!=req.params.id ){
				req.flash('error','Category with that name already exists');

				return res.render('admin/edit-category',{
					category: category,
					errors: req.flash('error'), message:req.flash('success')
				});
			} else {		
				category.save(function(err) {
					if (err) return next(err);
					console.log("Renamed category:" + oldname + "->" + req.body.name + " total:" + results.length);
					req.flash('success', 'Successfully edited category');
					return res.redirect(returnpage);
				});
				
					
				//var querystring = "category:(" + oldname + ")";
				//searchproperties = {query_string: {query: querystring}};
				if (category.category=="Job field")
				{
					Job.find({field : oldname},
						function(err, results){
							if(err) return next(err);
						}
					).forEach(function(job) { 
						job.field = req.body.name;
									
						job.save(function(err, results) {
							if(err) return next(err);
						});
					});
					
					User.find({fieldOfStudy : oldname},
						function(err, results){
							if(err) return next(err);
						}
					).forEach(function(user) { 
						user.fieldOfStudy = req.body.name;
									
						user.save(function(err, results) {
							if(err) return next(err);
						});
					});
				}
				
				if (category.category=="Job type")
				{
					Job.find({type : oldname},
						function(err, results){
							if(err) return next(err);
						}
					).forEach(function(job) { 
						job.type = req.body.name;
									
						job.save(function(err, results) {
							if(err) return next(err);
						});
					});
				}
				
				if (category.category=="Study level")
				{
					User.find({typeOfStudies : oldname},
						function(err, results){
							if(err) return next(err);
						}
					).forEach(function(user) { 
						user.typeOfStudies = req.body.name;
									
						user.save(function(err, results) {
							if(err) return next(err);
						});
					});
				}
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
			category:category,
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
			req.flash('error', 'Failed to delete category!');
			return res.redirect(referrer);
		}
		else
		{
			category.remove(function(err, category) {
				 if (err) {
					console.log(err);
					return next(err);
				 }  
				req.flash('success', 'Successfully deleted category');
				//console.log("req.query:" + req.query )
				return res.redirect(returnpage);	 
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
			req.flash('error','Category with that name already exists');

			return res.render('admin/add-category',{
				category: category,
				errors: req.flash('error'), message:req.flash('success')
			});
		} else {
			category.save(function(err) {
				if (err) return next(err);
				req.flash('success', 'Successfully added category');
				return res.redirect(referrer);
			});
		}
	});
});

//JSON.stringify(data)
module.exports=router;
