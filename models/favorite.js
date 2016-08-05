var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

var FavoriteSchema = new Schema({
	application:{ type: String, default: '' },
	date:{ type: Date, default: Date.now },
	job: {type:Schema.Types.ObjectId, ref:'Job'},
	user: {type:Schema.Types.ObjectId, ref:'User'},
	employer: {type:Schema.Types.ObjectId, ref:'User'},
	automatic:{ type: Boolean, default: false }
});

FavoriteSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});

module.exports = mongoose.model('Favorite', FavoriteSchema);
