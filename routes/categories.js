var router = require('express').Router();

var Category = require('../models/category');
var Job = require('../models/job');

var config = require('../config/config');

var cats = {};
var catnames = {"other":"Other", "field":"Job field", "type":"Job type", "level":"Study level"};

var loadcategories = function(callback) {
	Category.find({}, function(err, results) {
		if (err) return next(err);
		if (results)
		{
			for (k in results)
			{
				var result = results[k];
				
				var name = result.name;
				var cat = result.category;
				var id = result._id;
				if (id && id!="")
				{
					cats[cat] = cats[cat] || ["Other"];
					name = name.toString();
					if (cats[cat].indexOf(name)<0)
					{
						cats[cat].push(name);
					}
					
					//jobfields[id] = field;
				}
			}
		}
	});
	//console.log("Loaded categories");
}
loadcategories();

router.get('/admin/reload-cats', function(req, res, next) {
	if (!req.user || !req.user.admin) { return res.render('main/denied'); }
	var result = loadcategories();
	res.setHeader("Access-Control-Allow-Origin", "*");
	return res.send(JSON.stringify(result, null, '\t'))
});

router.use(function(req, res, next) {
	res.locals.jobfields = cats.field || [];
	res.locals.jobtypes = cats.type || [];
	res.locals.studytypes = cats.level || [];
	
	res.locals.cats = cats || {};
	res.locals.catnames = catnames || {};
	
	res.locals.loadcategories = loadcategories;
	
	loadcategories();
	
	next();
});

module.exports= router;