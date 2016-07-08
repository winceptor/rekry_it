var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

var CategorySchema = new Schema({
  name: { type: String, default: 'Untitled', unique: false},
  category: { type: String, default: 'other'},
  date:{ type: Date, default: Date.now },
  jobs: [{type:Schema.Types.ObjectId, ref:'Job'}],
  users: [{type:Schema.Types.ObjectId, ref:'User'}] 
});

CategorySchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});

module.exports = mongoose.model('Category', CategorySchema);
