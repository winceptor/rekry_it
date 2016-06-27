var router = require('express').Router();

var Category = require('../models/category');
var Job = require('../models/job');

var config = require('../config/config');

var category = {};
var categories = ["Other", "Job field", "Job type", "Study level"];

var loadcategories = function(callback) {
	Category.find({}, function(err, cats) {
		if (err) return next(err);
		if (cats)
		{
			for (k in cats)
			{
				var name = cats[k].name;
				var cat = cats[k].category;
				var id = cats[k]._id;
				if (id && id!="")
				{
					category[cat] = category[cat] || [];
					name = name.toString();
					if (category[cat].indexOf(name)<0)
					{
						category[cat].push(name);
					}
					
					//jobfields[id] = field;
				}
			}
		}
	});
	console.log("Loaded categories");
}
loadcategories();

router.get('/admin/reload-cats', function(req, res, next) {
	var result = loadcategories();
	res.setHeader("Access-Control-Allow-Origin", "*");
	return res.send(JSON.stringify(result, null, '\t'))
});

router.use(function(req, res, next) {
	
	
	res.locals.jobfields = category["Job field"] || [];
	res.locals.jobtypes = category["Job type"] || [];
	res.locals.studytypes = category["Study level"] || [];
	
	res.locals.category = category;
	res.locals.categories = categories || [];
	
	res.locals.loadcategories = loadcategories;
	
	loadcategories();
	
	next();
});

module.exports= router;