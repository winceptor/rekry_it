var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

var FeedbackSchema = new Schema({
	feedback:{ type: String, default: '' },
	date:{ type: Date, default: Date.now },
	user: {type:Schema.Types.ObjectId, ref:'User'},
	email:{ type: String, default: '' }
});

FeedbackSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
