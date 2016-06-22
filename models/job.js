var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema= mongoose.Schema;


var JobSchema=new Schema({
  field:{type:Schema.Types.ObjectId, ref:'Field'},
  type: { type: String, default: '' },
  title:{ type: String, default: '' },
  company:{ type: String, default: '' },
  address:{ type: String, default: '' },
  date:{ type: Date, default: Date.now },
  startDate:{ type: String, default: Date.now },
  endDate:{ type: String, default: Date.now },
  email:{ type: String, default: '' },
  skills:{ type: String, default: '' },
  description:{ type: String, default: '' }
});

JobSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});

module.exports=mongoose.model('Job',JobSchema);
