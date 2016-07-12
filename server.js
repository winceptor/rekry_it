//check for configs before loading anything, create new configs if missing
var checkconfigs = require('./routes/configs');
var configs = ["secret","config","languages"];
if (!checkconfigs(configs)){
	console.log("Problem with config files! Check ./config files and restart!");
	return;
}
else
{
	console.log("Configs OK. Proceeding with load...");
}

var secret =require('./config/secret');

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
var countries = require('country-list')().getNames();

var User= require('./models/user');
var Job = require('./models/job');
var Category = require('./models/category');

var translator = require('./routes/translator');
var catparser = require('./routes/catparser');

var mappingRoutes = require('./routes/mapping');
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
app.use(compression({level: 0}));

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
	res.locals.fatalerror = function(req, res, err) {
		return res.status(400).render('main/error',{title: "Something went terribly wrong! Please contact administrator!", message: err});
	}
	next();
});

app.use(function(req, res, next) {	
	res.locals.user=req.user;

	res.locals.countries = countries;
	
	res.locals.localhostadmin = secret.localhostadmin;
	res.locals.server_host = secret.server_host;
	res.locals.captchasite = secret.captcha_sitekey;
	res.locals.captchakey = secret.captcha_secretkey;

	//remove last / for canonical rel link url
	var canonicalpath = req.path;
	if (canonicalpath.slice(-1)=="/")
	{
		canonicalpath = canonicalpath.slice(0, -1);
	}
	res.locals.canonicalurl = secret.server_host + canonicalpath;
	
	next();
});

app.use(translator);
app.use(catparser);

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
