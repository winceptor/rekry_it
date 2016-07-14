var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

var ApplicationSchema = new Schema({
	application:{ type: String, default: '' },
	date:{ type: Date, default: Date.now },
	job: {type:Schema.Types.ObjectId, ref:'Job'},
	user: {type:Schema.Types.ObjectId, ref:'User'} 
});

ApplicationSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});

module.exports = mongoose.model('Application', ApplicationSchema);
