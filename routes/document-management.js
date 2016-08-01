var router = require('express').Router();

var Document = require('../models/document');

router.post('/list-documents',function(req,res,next){
	res.redirect('/admin/list-documents');
});
router.get('/list-documents',function(req,res,next){
	var query = req.query.q || "";
	var page = req.query.p || 1;
	var num = req.query.n || res.locals.default_listlimit;
	num = Math.min(num, 1000);
	var frm = Math.max(0,page*num-num);
	
	var query = req.query.q;

	var querystring = "";
	
	if (query)
	{
		querystring += query + " ";
	}

	var searchproperties = {"query" : {	"match_all" : {} } };
	if (querystring!="")
	{
		searchproperties = {query_string: {query: querystring, default_operator: "AND"}};
	}
	Document.search(
		searchproperties,
		{hydrate: true, from: frm, size: num, sort: "name:asc"},
		function(err, results){
			if(err) return next(err);
			var hits = results.hits.hits;
			hits = hits.filter(function(e){return e}); 
			var total = results.hits.total-results.hits.hits+hits.length;
	
			return res.render('admin/list-documents',{
				data:hits,
				query:query, 
				page:page, 
				number:num, 
				total:total, 
				errors: req.flash('error'), message:req.flash('success')
			});

		}
	);
});


router.get('/edit-document/:id',function(req,res,next){
	

	Document.findById(req.params.id, function(err,document){
		if(err) return next(err);
		if (!document)
		{
			req.flash('error', '###document### ###id### ###undefined###!');
			return res.redirect(res.locals.referer);
		}
		//console.log("document:" + document);
		return res.render('admin/edit-document',{
			document:document,
			
			errors: req.flash('error'), message:req.flash('success')
		});
	});

});


router.post('/edit-document/:id',function(req,res,next){
	
		
	
	//console.log("req.body.admin:" + req.body.admin);	
	
	Document.findById(req.params.id,function(err,document){
			if(err) return next(err);
	
			document.content = req.body.textcontent;
			document.date = new Date();
			
			document.save( 
				function(err, results) {
					if(err) return next(err);
					if (!results)
					{
						req.flash('error', '###document### ###not### ###edited###!');
						return res.redirect(res.locals.referer);
					}
					document.on('es-indexed', function(err, result){
						if (err) return next(err);
						

						req.flash('success', '###document### ###edited###');
						
						
						//return res.redirect('/document/' + req.params.id);
						return res.redirect("/admin/list-documents");	
					});
				}
			);


		}
	);
});

router.get('/delete-document/:id',function(req,res,next){
	

	Document.findById(req.params.id, function(err,document){
		if(err) return next(err);
		if (!document)
		{
			req.flash('error', '###document### ###id### ###undefined###!');
			return res.redirect(res.locals.referer);
		}
		return res.render('admin/delete-document',{
			document:document,
			
			errors: req.flash('error'), message:req.flash('success')
		});
	});
});

router.post('/delete-document/:id',function(req,res,next){
	
	Document.findById({_id:req.params.id}, function(err, document) {
		if(err) return next(err);
		if (!document)
		{
			req.flash('error', '###document### ###not### ###removed###!');
			return res.redirect(res.locals.referer);
		}
		else
		{
			document.remove(function(err, document) {
				 if (err) {
					console.log(err);
					return next(err);
				 }  
				req.flash('success', '###document### ###removed###');
				
				return res.redirect("/admin/list-documents");	 
		   });
		}
   });
});

//JSON.stringify(data)
module.exports=router;
