//https://github.com/expressjs/morgan#log-file-rotation

var FileStreamRotator = require('file-stream-rotator')

var express= require('express');

var router= express.Router();

var fs = require('fs')
var morgan = require('morgan')
var path = require('path')

var logDirectory = path.join("./", 'log')

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// create a rotating write stream
var accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(logDirectory, '%DATE%.log'),
  frequency: 'daily',
  verbose: false
})

// setup the logger
router.use(morgan('[:date[clf]] :remote-addr :remote-user :method :url :status - :response-time ms', {stream: accessLogStream}))

router.use('/log',function(req,res,next){
	if (!res.locals.zeroadmins && (!req.user || !req.user.admin)) { return res.redirect("/denied"); }
	express.static(logDirectory)(req,res,next);
});


router.get('/log',function(req,res,next){
	if (!res.locals.zeroadmins && (!req.user || !req.user.admin)) { return res.redirect("/denied"); }
	
	var files = fs.readdirSync(logDirectory, 'utf8');
	
	return res.render('admin/logs',{
		data: files
	});
	
	/*
	var filename = res.locals.logfile;
	
	res.writeHead(200, {'Content-Type': 'text/plain'});
	try {
		var data = fs.accessSync('./log/'+filename, fs.F_OK, function(err, data){
			if (err) {
				console.log(err);
				return false; 
			}
		});
		var data = fs.readFileSync('./log/'+filename, 'utf8', function(err, data){
			if (err) {
				console.log(err);
				return false; 
			}
		});
		res.end(data);
		return true;
	} catch (e) {
		//console.log(e);
		res.end('Could not read ' + filename + ' file!');
	}
	return false;*/
});

module.exports= router;
