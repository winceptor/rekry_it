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
	Category.search(
		searchproperties,
		{hydrate: true, from: frm, size: num},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			var total = results.hits.total;
			return res.render('admin/list-categories',{
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
		category.name = req.body.name;
		category.category = req.body.category;
		
		Category.findOne({name:req.body.name},function(err,cat){

			if(cat && cat._id!=req.params.id ){
				req.flash('error','Category with that name already exists');

				return res.render('admin/edit-category',{
					category: category,
					errors: req.flash('error'), message:req.flash('success')
				});
			} else {
				category.save(function(err) {
					if (err) return next(err);
					req.flash('success', 'Successfully edited category');
					return res.redirect(returnpage);
				});
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

	Category.findOne({name:req.body.name},function(err,cat){

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
