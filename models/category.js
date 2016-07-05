var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

var CategorySchema = new Schema({
  name: { type: String, default: '', unique: false},
  category: { type: String, default: 'other'}
});

CategorySchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});

module.exports = mongoose.model('Category', CategorySchema);
