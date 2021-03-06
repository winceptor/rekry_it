var router = require('express').Router();

var Document = require('../models/document');

var getdocument = function(docname, cb, fb) {
	var name = docname;

	Document.findOne({name:name},function(err,doc){
		if(err) return cb(err);
		if (!doc)
		{
			doc = new Document();
			doc.name = name;
			
			doc.save(function(err,doc){
				if(err) return cb(err);
				console.log("Created missing document: " + name);
			});
			
		}
		return cb(null, doc, fb);
	});
}

module.exports=getdocument;