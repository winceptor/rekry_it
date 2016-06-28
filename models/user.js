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
	fieldOfStudy:{ type: String, default: '' },
	yearOfStudies:{ type: String, default: '' },
	typeOfStudies:{ type: String, default: '' },
	typeOfJob:{ type: String, default: '' },
	skills:{ type: String, default: '' },
	keywords:{ type: String, default: '' },

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


UserSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});
module.exports=mongoose.model('User',UserSchema) ;
