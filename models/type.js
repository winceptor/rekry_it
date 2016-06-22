var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

var CategorySchema = new Schema({
  field: { type: String, default: '', unique: true, lowercase: false}
});

CategorySchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});

module.exports = mongoose.model('Category', CategorySchema);
