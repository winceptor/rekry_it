var router = require('express').Router();

var Document = require('../models/document');


router.use(function(req, res, next) {
		

	res.getdocument = function(docname, cb, fb) {
		var name = docname;

		Document.findOne({name:name},function(err,doc){
			if(err) return next(err);
			if (!doc)
			{
				doc = new Document();
				doc.name = name;
				
				doc.save(function(err,doc){
					if(err) return next (err);
					console.log("Created missing document: " + name);
				});
				
			}
			return cb(null, doc, fb);
		});
	}
	
	next();
});

module.exports=router;