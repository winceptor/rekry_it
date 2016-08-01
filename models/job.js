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
  field:{type:Schema.Types.ObjectId, ref:'Category'},
  type:{type:Schema.Types.ObjectId, ref:'Category'},
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
  views:{ type: Number, default: 0 },
  apps:{ type: Number, default: 0 },
  featured:{ type: Boolean, default: false },
  hidden:{ type: Boolean, default: false }
});

JobSchema.methods.validateInput=function(req, res){
	var emailregex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
	var error = "";
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

JobSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});

module.exports=mongoose.model('Job',JobSchema);
