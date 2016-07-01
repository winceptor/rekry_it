//check for configs before loading anything, create new configs if missing
var checkconfigs = require('./routes/configs');
var configs = ["secret","config","languages"];
if (!checkconfigs(configs)){
	console.log("Aborting! Check ./config files and restart!");
	return;
}
else
{
	console.log("Configs OK. Proceeding with load...");
}

var secret =require('./config/secret');
var config =require('./config/config');

//load the rest of ware if no problems with config files
var compression = require('compression')

var express= require('express');
var morgan = require ('morgan');
var mongoose= require('mongoose');
var bodyParser= require ('body-parser');
var ejs= require('ejs');
var ejsmate=require('ejs-mate');
var session=require ('express-session');
var cookieParser=require('cookie-parser');
var flash =require('express-flash');
var MongoStore= require('connect-mongo')(session);
var passport=require('passport');
var countries = require('country-list')();

var User= require('./models/user');
//var Field = require('./models/field');
var Job = require('./models/job');
var Category = require('./models/category');

var mappingRoutes = require('./routes/mapping');
var languageRoutes = require('./routes/languages');
var categoryRoutes = require('./routes/categories');

var mainRoutes=require('./routes/main');
var userRoutes=require('./routes/user');
var adminRoutes=require('./routes/admin');

var apiRoutes=require('./api/api');

var http = require('http');
var https = require('https');

var fs = require('fs');
var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('sslcert/server.cert', 'utf8');

var credentials = {key: privateKey, cert: certificate};

var app =express();
mongoose.connect(secret.db_database,function(err){
	if(err){
		console.log(err);
	}else {
		console.log("connected to the database");
	}

});

//middleware (compression first)
app.use(compression());

app.use(express.static(__dirname+'/public'));
app.use(morgan('short'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.engine('ejs',ejsmate);
app.set('view engine','ejs');
app.use(cookieParser());
app.use(session({
	resave:true,
	saveUninitialized:true,
	secret:secret.db_secretKey,
	store:new MongoStore({ url:secret.db_database, autoReconnect:true})
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req,res,next){
	res.locals.user=req.user;
	next();
});

//using format dd.mm.yyyy for date
function InputToDate(input)
{	
	if (input && input!="" && input.length>3)
	{
		var datenow = new Date();
		var parts = input.split(/\W/);
		if (parts && parts.length==3)
		{
			var yyyy = parts[2];
			var mm = parts[1];
			var dd = parts[0];
			if (yyyy>1970 && yyyy<2038 && mm>0 && mm<13 && dd>0 && dd<32)
			{
				var date = new Date(parts[2], parts[1]-1, parts[0]);
				return date.toISOString();
			}
		}
		return "";
	}
	return "";
}
function DateToInput(date) {
	if (!date || date=="" || date.length<3)
	{
		return "";
	}
	var date = new Date(Date.parse(date));
	var dd = date.getDate(); 
	var mm = date.getMonth()+1; 
	var yyyy = date.getFullYear(); 
	if(dd<10){dd="0"+dd} 
	if(mm<10){mm="0"+mm} 
	//return yyyy+"-"+mm+"-"+dd;
	return dd + "." + mm + "." + yyyy;
}
function CheckDateInput(input)
{
	return input == DateToInput(InputToDate(input)) ;
}

app.use(function(req, res, next) {
	var referrer = req.header('Referer') || "/";
	res.locals.returnpage = referrer;
	
	res.locals.localhostadmin = secret.localhostadmin;
	res.locals.server_host = secret.server_host;
		
	//res.locals.jobfields = jobfields;
	//res.locals.jobtypes = config.jobtypes;
	//res.locals.studytypes = config.studytypes;
	
	res.locals.searchlimit = config.default_searchlimit;
	res.locals.listlimit = config.default_listlimit;
	res.locals.sort = config.default_sort;
	
	res.locals.logfile = config.log_filename;
	
	res.locals.InputToDate = InputToDate;
	res.locals.DateToInput = DateToInput;
	//res.locals.CheckDateInput = CheckDateInput;
	
	res.locals.remoteip = req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
	 
	res.locals.countries = countries.getNames();
	
	res.locals.captchasite = secret.captcha_sitekey;
	res.locals.captchakey = secret.captcha_secretkey;
	next();
});

app.use(function(req, res, next) {	
	//remove last / for canonical rel link url
	var canonicalpath = req.path;
	if (canonicalpath.slice(-1)=="/")
	{
		canonicalpath = canonicalpath.slice(0, -1);
	}
	res.locals.canonicalurl = secret.server_host + canonicalpath;
	
	next();
});

app.use(languageRoutes);
app.use(categoryRoutes);

app.use(mainRoutes);
app.use('/user',userRoutes);
app.use('/admin',adminRoutes);
app.use('/api',apiRoutes);

app.get('/denied',function(req,res){
	res.status(403).render('main/denied',{errors: req.flash('error'), message:req.flash('success')});
});

app.use(function(req,res,next){
	var msg = res.locals.trans("Page not found");
	return res.status(404).render('main/missing',{title: msg, errors: req.flash('error'), message:req.flash('success')});
});

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(secret.server_port, function(err){
	if(err) throw err;
	console.log("server is running on port "+ secret.server_port);
});
httpsServer.listen(secret.server_sslport, function(err){
	if(err) throw err;
	console.log("server is running on sslport "+ secret.server_sslport);
});
