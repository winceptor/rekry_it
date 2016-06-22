var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

var FieldSchema = new Schema({
  field: { type: String, default: '', unique: true}
});

FieldSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});

module.exports = mongoose.model('Field', FieldSchema);
