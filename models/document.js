var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

var DocumentSchema = new Schema({
  name: { type: String, default: '', unique: true},
  date:{ type: Date, default: Date.now },
  content: { type: String, default: ''}
});

DocumentSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});

module.exports = mongoose.model('Document', DocumentSchema);
