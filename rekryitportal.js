console.log("###############################");
console.log("Starting service: rekryitportal");
console.log("###############################");

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

var config =require('./config/config');
var wip = config.wip || false;
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

var helmet = require('helmet')

var User= require('./models/user');
var Job = require('./models/job');
var Category = require('./models/category');

var core = require('./routes/core');

var files = require('./routes/files');
var logger = require('./routes/logger');

var translator = require('./routes/translator');
var catparser = require('./routes/catparser');

var mapping = require('./routes/mapping');
var categories = require('./routes/categories');

var mainRoutes=require('./routes/main');
var managerRoutes=require('./routes/manager');
//var employerRoutes=require('./routes/employer');
var userRoutes=require('./routes/user');
var adminRoutes=require('./routes/admin');

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

//basic middleware (compression first)
app.use(compression({level: 3}));

app.use(helmet());

app.use(express.static(__dirname+'/public'));

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

//core middleware
app.use(core);
app.use(logger);

//additional core middleware
app.use(translator);
app.use(catparser);

//custom middlewares
app.use(files);
app.use(categories);
//app.use(documents); //not used

//pages
app.use(mainRoutes);
//app.use('/employer',employerRoutes);
app.use('/manager',managerRoutes);
app.use('/user',userRoutes);
app.use('/admin',adminRoutes);


//denied page
app.get('/denied',function(req,res){
	var content = "###error###" + " 403 - " + "###denied###";
	return res.status(403).render('main/message',{result: 'error', content: content, closable: false});
});

//crashtest page
if (wip) {
	app.get('/crash', function(req, res) {
		if (!res.locals.hasadmin) { return res.denied("###denied###"); }
		  process.nextTick(function () {
			throw new Error;
		  });
	})
	
	app.get('/restart', function(req, res) {
		if (!res.locals.hasadmin) { return res.denied("###denied###"); }
		process.exit(0);
	})
	
	
}

//missing page
app.use(function(req,res,next){
	var content = "###error###" + " 404 - " + "###missing###";
	return res.status(404).render('main/message',{result: 'error', content: content, closable: false});
});

//server start
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
