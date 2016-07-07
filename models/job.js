var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema= mongoose.Schema;

//http://stackoverflow.com/questions/30524483/set-default-date-in-mongoose-document-to-now-some-increment
var displayLength = function()
{
	//one month default value
    var timeObject = new Date();
    timeObject.setTime(timeObject.getTime() + 1000 * 60 * 60 * 24 * 30);
    return timeObject;
};

var JobSchema=new Schema({
  field:{type: String, default: 'Other'},
  type: {type: String, default: 'Other'},
  title:{ type: String, default: 'Untitled' },
  company:{ type: String, default: '' },
  address:{ type: String, default: '' },
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
  featured:{ type: Boolean, default: false },
  hidden:{ type: Boolean, default: false }
});

JobSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});

module.exports=mongoose.model('Job',JobSchema);
