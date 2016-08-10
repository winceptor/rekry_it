var mongoose =require('mongoose');
var mongoosastic = require('mongoosastic');
var bcrypt =require ('bcrypt-nodejs');
var Schema= mongoose.Schema;

/* the user schema attributes /characteristics /fields */

var UserSchema =new Schema({
	admin:{ type: Boolean, default: false },
	employer:{ type: Boolean, default: false },
	manager:{ type: Boolean, default: false },
	name:{ type: String, default: '###unnamed###' },
	email:{type: String, unique: true, lowercase:true},
	verified:{ type: Boolean, default: false },
	password : { type: String, default: '' },
	dateOfBirth:{ type: Date, default: Date.now },
	date:{ type: Date, default: Date.now },
	country:{ type: String, default: '' },
	gender:{ type: String, default: '' },
	fieldOfStudy:{type:Schema.Types.ObjectId, ref:'Category'},
	yearOfStudies:{ type: String, default: '' },
	typeOfStudies:{type:Schema.Types.ObjectId, ref:'Category'},
	typeOfJob:{ type: String, default: '' },
	skills:{ type: String, default: '' },
	keywords:{ type: String, default: '' },
	phone:{ type: String, default: '' },
	address:{ type: String, default: '' },
	lastlogin:{ type: Date, default: Date.now },
	lastip:{ type: String, default: '' },
	cv:{ type: String, default: '' },
	photo:{ type: String, default: '' },
	subscribe:{ type: Boolean, default: false },
	studysub:{ type: Boolean, default: false },
	recruitsub:{ type: Boolean, default: false },
	keywordsub:{ type: Boolean, default: false },
	emailsub:{ type: Boolean, default: false },
	//http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	verifyToken: String,
	verifyExpires: Date		
});
/*Hash the password before we save it to the database */
UserSchema.pre('save',function(next){
	var user=this;
	if (!user.isModified('password')) return next ();
	bcrypt.genSalt(10,function(err,salt){
		if(err) return next(err);
		bcrypt.hash(user.password, salt,null,function(err,hash) {
			if(err) return next (err);
			user.password=hash;
			next();
		});
	});
});

/* compare password in the database and the ones that the user type in */
UserSchema.methods.comparePassword=function(password){
	return bcrypt.compareSync(password,this.password);
}

UserSchema.methods.processForm=function(req, res, signup){
	var hasadmin = res.locals.hasadmin;
	
	if (hasadmin)
	{
		this.admin = req.body.admin || (res.locals.zeroadmins && signup);
		this.manager = req.body.manager;		
		this.employer = req.body.employer;	
	}

	this.name = req.body.name;	
	this.email = req.body.email;
	this.phone = req.body.phone;
	
	if (signup || req.body.password && req.body.password!="")
	{
		this.password = req.body.password;
	}
	
	this.skills = req.body.skills;
	
	this.dateOfBirth = res.locals.InputToDate(req.body.dateOfBirth);
	this.country = req.body.country;
	this.address = req.body.address;
	this.gender = req.body.gender;
	
	this.fieldOfStudy = req.body.fieldOfStudy || null;
	this.yearOfStudies = req.body.yearOfStudies;
	
	this.typeOfStudies = req.body.typeOfStudies || null;
	
	this.typeOfJob = req.body.typeOfJob || "";
	
	if (req.body.typeOfJob && req.body.typeOfJob!=null && req.body.typeOfJob.length>0)
	{
		this.typeOfJob = typeof req.body.typeOfJob=="string" ? req.body.typeOfJob.split(",").join(", ") : req.body.typeOfJob.join(", ");
	}
	
	this.keywords = req.body.keywords;
	
	this.subscribe = req.body.subscribe || false;
	
	this.studysub = req.body.studysub || false;
	this.recruitsub = req.body.recruitsub || false;
	this.keywordsub = req.body.keywordsub || false;
	
	this.emailsub = req.body.emailsub || false;
	
	var error = "";
	var isvalidemailhost = function(emailstring) {
		var hosts = res.locals.emailhosts || [];
		var domain = emailstring.substring(emailstring.lastIndexOf("@") +1);
		//return (emailstring.indexOf("@thedomain.com", emailstring.length - "@thedomain.com".length) !== -1);
		return (hosts.indexOf(domain) > -1);
	}
	
	if (signup && req.body.password && req.body.password=="")
	{
		error += "<br>###required###: ###password###";
	}
	if (req.body.password && req.body.password!="")
	{
		if (req.body.password != req.body.passwordcheck)
		{
			error += '<br>###passwordmustmatch###';
		}
		
		if (req.body.password.length < 5)
		{
			error += '<br>###passwordtooshort###';
		}
		
		var passwordregex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{5,}$/;
		if (passwordregex.test(req.body.password)==false)
		{
			error += '<br>###passwordtooweak###';
		}	
	}
	
	if (!this.name || this.name==null || this.name=="")
	{
		error += '<br>###required###: ###name###';
	}
	
	if (!this.email || this.email==null || this.email=="")
	{
		error += '<br>###required###: ###email###';
	}
	else
	{
		var emailregex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
		if (this.email.length < 3 || emailregex.test(this.email)==false)
		{
			error += '<br>###email### ###invalid###';
		}
		if (!this.verified && !isvalidemailhost(this.email)) 
		{
			error += '<br>###email### ###denied###';
		}
	}
	
	
	if (!this.fieldOfStudy || this.fieldOfStudy==null || this.fieldOfStudy=="")
	{
		error += '<br>###required###: ###jobfield###';
	}
	if (!this.typeOfStudies || this.typeOfStudies==null || this.typeOfStudies=="")
	{
		error += '<br>###required###: ###studylevel###';
	}
	
	return error;
}

UserSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});
module.exports=mongoose.model('User',UserSchema) ;
