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


UserSchema.methods.validateInput=function(req, res){
	var error = "";
	if (req.body.password && req.body.password=="")
	{
		if (req.body.password != req.body.passwordcheck)
		{
			error = 'Passwords must match!';
		}
		
		var minpasslength = 6;
		if (req.body.password.length<minpasslength)
		{
			error = 'Password is too short!';
		}	
	}

	
	var emailregex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
	if (this.email.length < 3 || emailregex.test(this.email)==false)
	{
		error = 'Invalid email!';
	}
	
	if (this.admin)
	{
		var admin = req.user && req.user.admin;
		var remoteip = req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
		var localadmin = res.locals.localhostadmin && (remoteip=="localhost" || remoteip=="127.0.0.1" || remoteip=="::ffff:127.0.0.1");
		if (admin || localadmin) {
			//ok
		}
		else
		{
			error = 'Unable to create admin account!';
		}
	}
	
	return error;
}

UserSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});
module.exports=mongoose.model('User',UserSchema) ;
