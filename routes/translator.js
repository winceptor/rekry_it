var router = require('express').Router();
var fs = require('fs');

var config = require('../config/config');

var languages_db = {};
var loadlanguages = function(callback) {
	try {
		var data = fs.readFileSync('./config/languages.js', 'utf8', function(err, data){
			if (err) {
				console.log(err);
				return false; 
			}
		});
		languages_db = JSON.parse(data);
		//console.log(languages);
		console.log("Loaded translation file");
		return languages_db;
	}
	catch (err)
	{
		languages_db = {};
		console.log("Failed to load translation file!");
		console.log(err);
		return languages_db;
	}
}
loadlanguages();

router.use(function(req, res, next) {
	//console.log('Cookies: ', req.cookies);
	if (req.cookies && req.cookies.language && languages_db[req.cookies.language])
	{
		res.cookie('language', req.cookies.language, { maxAge: 365 * 24 * 60 * 60 * 1000 });
		res.locals.language = req.cookies.language;
	}
	else
	{
		res.cookie('language', config.default_language, { maxAge: 365 * 24 * 60 * 60 * 1000 });
		res.locals.language = config.default_language;
	}
	
	res.locals.default_language = config.default_language;
	
	res.locals.language_choices = config.language_choices;

	res.locals.languages = languages_db;
	
	res.locals.languagecode = "en";
	if (languages_db[res.locals.language])
	{
		res.locals.languagecode = languages_db[res.locals.language].languagecode || res.locals.languagecode;
	}
	
	var translate = function(input, lang)
	{
		var lang = lang || res.locals.language;
		var deflang = res.locals.default_language;
		
		if (input)
		{
			
			
			var output = input;
			var dict = languages_db[lang] || {};
			var defdict = languages_db[deflang] || {};
			
			var directtr = dict[input] || defdict[input];
			if (directtr) { return directtr; }
								
			for (k in defdict)
			{
				if (output && output!="" && output.replace)
				{
					var reg = "###" + k + "###";
					var tr = dict[k] || defdict[k];
					
					//var rep = "<span class='translated' id='" + reg + "'>" + tr + "</span>";
					var rex = new RegExp(reg, "g");
					output = output.replace(rex, tr);
				}
			}
			return output;
		}
		return input;
	}
	
	//expose function for other modules and ejs templates
	res.locals.trans = translate;
	
	//preserve original send function
	res.send0 = res.send;
	
	//translate html before calling original res.send again
	res.send = function(html) {
		var translated = translate(html);
		return res.send0(translated);
	}
	
	next();
});

router.get('/language/reload-trans', function(req, res, next) {
	if (!res.locals.hasadmin) { return res.denied("###denied###"); }
	var result = loadlanguages();
	res.setHeader("Access-Control-Allow-Origin", "*");
	return res.send(JSON.stringify(result, null, '\t'))
});

router.get('/language/:language',function(req,res){

	var language = req.params.language;
	
	if (res.locals.languages[language])
	{
		res.cookie('language', language, { maxAge: 365 * 24 * 60 * 60 });
		//loadlanguages();
	}
	res.redirect(res.locals.referer);
});



module.exports= router;