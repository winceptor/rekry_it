var mongoose =require('mongoose');
var mongoosastic = require('mongoosastic');
var bcrypt =require ('bcrypt-nodejs');
var Schema= mongoose.Schema;

/* the user schema attributes /characteristics /fields */

var UserSchema =new Schema({
	admin:{ type: Boolean, default: false },
	name:{ type: String, default: 'noname' },
	email:{type: String, unique: true, lowercase:true},
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
	
	lastlogin:{ type: Date, default: Date.now },
	lastip:{ type: String, default: '' },
	
	//http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/
	resetPasswordToken: String,
	resetPasswordExpires: Date	
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


UserSchema.methods.validateInput=function(req, res, requirepass){
	var error = "";
	if (requirepass && req.body.password && req.body.password=="")
	{
		problem += "<br>###required###: ###password###";
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
	}
	
	
	if (this.admin)
	{
		var admin = req.user && req.user.admin;
		var remoteip = req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
		var localadmin = res.locals.localhostadmin && (remoteip=="localhost" || remoteip=="127.0.0.1" || remoteip=="::ffff:127.0.0.1");
		if (admin || localadmin || res.locals.zeroadmins) {
			//ok
		}
		else
		{
			error += '<br>###admin### ###user### ###not### ###added###';
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
