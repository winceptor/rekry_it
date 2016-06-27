var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

var TypeSchema = new Schema({
  name: { type: String, default: '', unique: true}
});

TypeSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});

module.exports = mongoose.model('Type', TypeSchema);
