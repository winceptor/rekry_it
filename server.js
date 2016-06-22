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

var secret =require('./config/secret');
var config =require('./config/config');

var User= require('./models/user');
var Field = require('./models/field');
var Job = require('./models/job');
var Type = require('./models/type');

var mappingRoutes = require('./routes/mapping');
var languageRoutes = require('./routes/languages');
var mainRoutes=require('./routes/main');
var userRoutes=require('./routes/user');
var adminRoutes=require('./routes/admin');
var apiRoutes=require('./api/api');

var app =express();
mongoose.connect(secret.db_database,function(err){
	if(err){
		console.log(err);
	}else {
		console.log("connected to the database");
	}

});

//middleware
app.use(express.static(__dirname+'/public'));
app.use(morgan('dev'));
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


function DateToInput(date) {
	var date = new Date(Date.parse(date));
	var dd = date.getDate(); 
	var mm = date.getMonth()+1; 
	var yyyy = date.getFullYear(); 
	if(dd<10){dd="0"+dd} 
	if(mm<10){mm="0"+mm} 
	return yyyy+"-"+mm+"-"+dd;
}

var jobfields = {};
/*
Job.find({}, function(err, jobs) {
	if (err) return next(err);
	if (jobs)
	{
		for (k in jobs)
		{
			var field = jobs[k].field;
			if (field && field!="")
			{
				field = field.toString();
				if (jobfields.indexOf(field)<0)
				{
					jobfields.push(field);
				}
			}
		}
	}
});
*/
Field.find({}, function(err, fields) {
	if (err) return next(err);
	if (fields)
	{
		for (k in fields)
		{
			var field = fields[k].field;
			var id = fields[k]._id;
			if (field && field!="")
			{
				field = field.toString();
				/*if (jobfields.indexOf(field)<0)
				{
					jobfields.push(field);
				}
				*/
				jobfields[id] = field;
			}
		}
	}
});

app.use(function(req, res, next) {
	var referrer = req.header('Referer') || "/";
	res.locals.returnpage = referrer;
	
	res.locals.localhostadmin = secret.localhostadmin;
		
	res.locals.jobfields = jobfields;
	res.locals.jobtypes = config.jobtypes;
	res.locals.studytypes = config.studytypes;
	
	res.locals.searchlimit = config.default_searchlimit;
	res.locals.listlimit = config.default_listlimit;
	res.locals.sort = config.default_sort;
	
	res.locals.DateToInput = DateToInput;
	
	res.locals.remoteip = req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
	 
	res.locals.countries = countries.getNames();
	
	next();
});

app.use(function(req, res, next) {
	Field.find({}, function(err, jobfields) {
		if (err) return next(err);
		//res.locals.jobfields = jobfields;
		next();
	});
});


app.use(languageRoutes);
app.use(mainRoutes);
app.use('/user',userRoutes);
app.use('/admin',adminRoutes);
app.use('/api',apiRoutes);
	
app.get('/',function(req,res){
	res.render('main/index',{errors: req.flash('error'), message:req.flash('success')});
});

app.get('/denied',function(req,res){
	res.render('main/denied',{errors: req.flash('error'), message:req.flash('success')});
});

app.use(function(req,res,next){
	return res.render('main/missing',{errors: req.flash('error'), message:req.flash('success')});
});

app.listen(secret.server_port, function(err){
	if(err) throw err;
	console.log("server is running on port "+ secret.server_port);
});
