var User= require('../models/user');
var Job = require('../models/job');
var Category = require('../models/category');

User.createMapping(function(err,mapping){
	if(err){
		console.log('error creatingMapping');
		console.log(err);
	} else {
		console.log('Mapping created for user');
		console.log(mapping);
	}
});
var stream =User.synchronize();
var count1=0;
var errors1=0;
stream.on('data',function(err, doc){
	//console.log("Indexed "+count1+" user documents with "+errors1+" errors");
	count1++;
});
stream.on('close',function(){
	console.log("Indexed "+count1+" user documents with "+errors1+" errors");
});
stream.on('error',function(err){
	console.log(err);
	errors1++;
});


Job.createMapping(function(err,mapping){
	if(err){
		console.log('error creatingMapping');
		console.log(err);
	} else {
		console.log('Mapping created for job');
		console.log(mapping);
	}
});
var stream =Job.synchronize();
var count2=0;
var errors2=0;
stream.on('data',function(err, doc){
	//console.log("Indexed "+count2+" job documents with "+errors2+" errors");
	count2++;
});
stream.on('close',function(){
	console.log("Indexed "+count2+" job documents with "+errors2+" errors");
});
stream.on('error',function(err){
	console.log(err);
	errors2++;
});


Category.createMapping(function(err,mapping){
	if(err){
		console.log('error creatingMapping');
		console.log(err);
	} else {
		console.log('Mapping created for category');
		console.log(mapping);
	}
});

var stream =Category.synchronize();
var count3=0;
var errors3=0;
stream.on('data',function(err, doc){
	//console.log("Indexed "+count3+" field documents with "+errors3+" errors");
	count3++;
});
stream.on('close',function(){
	console.log("Indexed "+count3+" category documents with "+errors3+" errors");
});
stream.on('error',function(err){
	console.log(err);
	errors3++;
});

module.exports= false;