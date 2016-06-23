var router = require('express').Router();
var Field = require('../models/field');
var Job = require('../models/job');
var User = require('../models/user');

router.post('/list-fields',function(req,res,next){
	res.redirect('/admin/list-fields');
});
router.get('/list-fields',function(req,res,next){
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
	Field.search(
		searchproperties,
		{hydrate: true, from: frm, size: num},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			var total = results.hits.total;
			return res.render('admin/list-fields',{
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


router.get('/edit-field/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';

	Field.findById(req.params.id, function(err,field){
		if(err) return next(err);
		if (!field)
		{
			return console.log("error null field: " + req.params.id);
		}
		return res.render('admin/edit-field',{
			field:field,
			returnpage:encodeURIComponent(referrer), 
			errors: req.flash('error'), message:req.flash('success')
		});
	});

});


router.post('/edit-field/:id',function(req,res,next){
	Field.findById(req.params.id, function(err,field){
		if(err) return next(err);
		if (!field)
		{
			return console.log("error null field: " + req.params.id);
		}
		field.field = req.body.field;
		
		field.save(function(err, results) {
			if(err) return next(err);
			if (!results)
			{
				return console.log("error null field");
			}
			//console.log(req.returnpage +":"+ res.returnpage);

			req.flash('success', 'Successfully edited field');
			//console.log("req.query:" + req.query )
			
			return res.redirect('/field/' + req.params.id);
							
			//return res.redirect(returnpage);	
		});
	});

});

router.get('/delete-field/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';

	Field.findById(req.params.id, function(err,field){
		if(err) return next(err);
		if (!field)
		{
			return console.log("error null field: " + req.params.id);
		}
		return res.render('admin/delete-field',{
			field:field,
			returnpage:encodeURIComponent(referrer)
		});
	});
});

router.post('/delete-field/:id',function(req,res,next){
	var referrer = req.header('Referer') || '/';
	//console.log(req.returnpage + ":" + res.returnpage + ":" + res.locals.returnpage);
	var returnpage = req.query.r || referrer;
	Field.findById({_id:req.params.id}, function(err, field) {
		if(err) return next(err);
		if (!field)
		{
			req.flash('error', 'Failed to delete field!');
			return res.redirect(referrer);
		}
		else
		{
			field.remove(function(err, field) {
				 if (err) {
					console.log(err);
					return next(err);
				 }  
				req.flash('success', 'Successfully deleted field');
				//console.log("req.query:" + req.query )
				return res.redirect(returnpage);	 
		   });
		}
   });
});



router.post('/list-types',function(req,res,next){
	res.redirect('/admin/list-types');
});
router.get('/list-types',function(req,res,next){
	var query = req.query.q || "";
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.searchlimit;
	var frm = Math.max(0,page*num-num);
	
	var searchproperties = {"query" : {	"match_all" : {} } };
	if (query!="")
	{
		searchproperties = {query_string: {query: query}};
	}
	Field.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: "date:desc"},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			var total = results.hits.total;
			return res.render('admin/list-types',{data:hits, query:query, page:page, number:num, total:total, errors: req.flash('error'), message:req.flash('success')});
	});
});


router.get('/add-field',function(req,res,next){
  return res.render('admin/add-field',{field:false, message:req.flash('success')});
});

router.post('/add-field', function(req, res, next) {
	var referrer = req.header('Referer') || '/';

  var field = new Field();
  field.field = req.body.field;
  field.type = req.body.type;

  field.save(function(err) {
    if (err) return next(err);
    req.flash('success', 'Successfully added a field');
    return res.redirect(referrer);
  });
});

//JSON.stringify(data)
module.exports=router;
