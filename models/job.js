var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema= mongoose.Schema;

//http://stackoverflow.com/questions/30524483/set-default-date-in-mongoose-document-to-now-some-increment
var displayLength = function()
{
    var today = new Date();
	//add one month as default value
	var newdate = new Date(today.getFullYear(), today.getMonth()+1, today.getDate());
	
    /*timeObject.setTime(timeObject.getTime() + 1000 * 60 * 60 * 24 * 30);
	timeObject.setHours(0);
	timeObject.setMinutes(0);
	timeObject.setSeconds(0);*/
    return newdate;
};

var JobSchema=new Schema({
	user: {type:Schema.Types.ObjectId, ref:'User'},
  field:{ type: String, default: '' },
  type:{ type: String, default: '' },
  title:{ type: String, default: 'Untitled' },
  company:{ type: String, default: '' },
  address:{ type: String, default: '' },
  phone:{ type: String, default: '' },
  date:{ type: Date, default: Date.now },
  displayDate:{ type: Date, default: displayLength },
  startDate:{ type: Date, default: Date.now },
  endDate:{ type: Date, default: Date.now },
  email:{ type: String, default: '', lowercase:true },
  skills:{ type: String, default: '' },
  description:{ type: String, default: '' },
  logo:{ type: String, default: '' },
  beginning:{ type: String, default: '' },
  duration:{ type: String, default: '' },
  payment:{ type: String, default: '' },
  views:{ type: Number, default: 0 },
  apps:{ type: Number, default: 0 },
  featured:{ type: Boolean, default: false },
  hidden:{ type: Boolean, default: false }
});

JobSchema.methods.fillForm=function(req, res){
	this.hidden = req.body.hidden || false;
	this.featured = req.body.featured || false;
	this.title = req.body.title;
	
	this.type = req.body.type || "";
	if (req.body.type && req.body.type!=null && req.body.type.length>0)
	{
		this.type = typeof req.body.type=="string" ? req.body.type.replace(/[,| |, ]+/g," ") : req.body.type.join(" ");
	}
	
	this.field = req.body.field || "";
	if (req.body.field && req.body.field!=null && req.body.field.length>0)
	{
		this.field = typeof req.body.field=="string" ? req.body.field.replace(/[,| |, ]+/g," ") : req.body.field.join(" ");
	}

	
	this.company = req.body.company;
	this.address = req.body.address;
	this.phone = req.body.phone;
	//this.startDate = res.locals.InputToDate(req.body.startDate);
	//this.endDate = res.locals.InputToDate(req.body.endDate);
	this.email = req.body.email;
	this.skills = req.body.skills;
	this.beginning = req.body.beginning;
	this.duration = req.body.duration;
	
	this.payment = req.body.payment;
	this.description = req.body.description;
	
	if (req.body.displayDate!="")
	{
		this.displayDate = res.locals.InputToDate(req.body.displayDate);
	}

	if ( req.user && (!this.user || this.user=="") )
	{
		this.user = req.user._id;
	}
};

JobSchema.methods.validateInput=function(req, res){
	var emailregex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
	var error = "";
	if (!this.email || this.email==null || this.email=="")
	{
		//error += '<br>###required###: ###email###';
		this.email = "";
	}
	else
	{
		var emailregex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
		if (this.email.length < 3 || emailregex.test(this.email)==false)
		{
			error += '<br>###email### ###invalid###';
		}
	}
	if (!this.title || this.title==null || this.title=="")
	{
		error += '<br>###required###: ###title###';
	}	
	if (!this.field || this.field==null || this.field=="")
	{
		error += '<br>###required###: ###jobfield###';
	}
	if (!this.type || this.type==null || this.type=="")
	{
		error += '<br>###required###: ###jobtype###';
	}
	
	return error;
}

JobSchema.methods.processForm=function(req, res){
	this.fillForm(req, res);
	return this.validateInput(req, res);
}

JobSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});

module.exports=mongoose.model('Job',JobSchema);
