var router = require('express').Router();
var fs = require('fs');

var config = require('../config/config');

var languages = {};
var loadlanguages = function(callback) {
	var data = fs.readFileSync('./config/languages.js', 'utf8', function(err, data){
		if (err) {
			console.log(err);
			return false; 
		}
	});
	languages = JSON.parse(data);
	//console.log(languages);
	console.log("Loaded translation file");
	return languages;
}
loadlanguages();

router.use(function(req, res, next) {
	//console.log('Cookies: ', req.cookies);
	if (req.cookies && req.cookies.language && languages[req.cookies.language])
	{
		res.cookie('language', req.cookies.language, { maxAge: 365 * 24 * 60 * 60 });
		res.locals.language = req.cookies.language;
	}
	else
	{
		res.cookie('language', config.default_language, { maxAge: 365 * 24 * 60 * 60 });
		res.locals.language = config.default_language;
	}
	
	res.locals.default_language = config.default_language;

	res.locals.languages = languages;

	res.locals.languagecode = languages[res.locals.language].languagecode || "en";
		
	var translate = function(input, lang)
	{
		var lang = lang || res.locals.language;
		var deflang = res.locals.default_language;
		
		if (input)
		{
			var output = input;
			var dict = languages[lang] || {};
			var defdict = languages[deflang];
								
			for (k in defdict)
			{
				if (output && output!="" && output.replace)
				{
					var reg = "###" + k + "###";
					var tr = dict[k] || defdict[k];
					var rex = new RegExp(reg, "g");
					//var rep = "<span class='translated' id='" + reg + "'>" + tr + "</span>";
					output = output.replace(rex, tr);
				}
			}
			return output;
		}
		return input;
	}
	
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
	if (!req.user || !req.user.admin) { return res.render('main/denied'); }
	var result = loadlanguages();
	res.setHeader("Access-Control-Allow-Origin", "*");
	return res.send(JSON.stringify(result, null, '\t'))
});

router.get('/language/:language',function(req,res){

	var referrer = req.header('Referer') || '/';
	var language = req.params.language;
	
	if (res.locals.languages[language])
	{
		res.cookie('language', language, { maxAge: 365 * 24 * 60 * 60 });
		loadlanguages();
	}
	res.redirect(referrer);
});



module.exports= router;