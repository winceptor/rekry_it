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

router.get('/admin/reload-trans', function(req, res, next) {
	var result = loadlanguages();
	res.setHeader("Access-Control-Allow-Origin", "*");
	return res.send(JSON.stringify(result, null, '\t'))
});

router.use(function(req, res, next) {
	//console.log('Cookies: ', req.cookies);
	if (req.cookies && req.cookies.language)
	{
		res.cookie('language', req.cookies.language, { maxAge: 365 * 24 * 60 * 60 });
		res.locals.language = req.cookies.language;
	}
	else
	{
		res.cookie('language', config.default_language, { maxAge: 365 * 24 * 60 * 60 });
		res.locals.language = config.default_language;
	}

	res.locals.languages = languages;
	
	res.locals.trans = function(input, lang)	{
		var lang = lang || res.locals.language;
		var languages = res.locals.languages;
		if (input)
		{
			if (lang && languages[lang] && languages[lang][input])
			{
				return languages[lang][input];
			}
			
			//handle missing string
			console.log("untranslated:" + lang + ":" + input);
			
			languages[lang] = languages[lang] || {};
			languages[lang][input] = languages[lang][input] || input;

			var fileoutput = JSON.stringify(languages, null, '\t');
			fs.writeFileSync('./config/languages.js', fileoutput, 'utf8', function(err) {
				if(err) {
					return console.log(err);
				}
			}); 
				
			//fallback just in case
			return languages[lang][input] || input;
		}
		return "";
	}
	
	next();
});

module.exports= router;