var router = require('express').Router();

var Document = require('../models/document');

/*
var textdocuments = {};
var reloadtextdocuments = function()
{
	var num = 10000;
	var searchproperties = {"query" : {	"match_all" : {} } };
	Document.search(
		searchproperties, 
		{size: num},
		function(err, results){
			if (err) return console.log(err);
			if (results)
			{
				hits1 = results.hits.hits.map(function(hit){
					var dat = hit._source;
					dat._id = hit._id;
					return dat;
				});
			}
			for (k in results) {
				var doc = results[k];
				textdocuments[doc.name] = doc;
			}
		}
	);	
}
reloadtextdocuments();
*/

router.use(function(req, res, next) {
		
	//res.locals.reloadtextdocuments = reloadtextdocuments;
	
	//res.locals.textdocuments = textdocuments;
	
	res.getdocument = function(docname, cb, fb) {
		var name = docname;
		
		//var name = docname + ":" + res.locals.language;
		//var fallback = docname + ":" + res.locals.default_language;

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
				
				//textdocuments.name = doc;
			}
			return cb(null, doc, fb);
			/*
			if (doc && doc.content && doc.content!="")
			{
				return cb(null, doc, fb);
			}
			else
			{
				Document.findOne({name:fallback},function(err,fbdoc){
					if(err) return next(err);
					if (fbdoc && fbdoc.content && fbdoc.content!="")
					{
						doc.content = fbdoc.content + '<br><span class="text-muted small text-spacing">###untranslated###</span>';
					}
					return cb(null, doc, fb);
				});
			}
			doc.content = '<span class="text-muted small text-spacing">###empty###</span>';
			return cb(null, doc, fb);
			*/
		});

	}
	
	next();
});

module.exports=router;