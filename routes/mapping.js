var User= require('../models/user');
var Job = require('../models/job');
var Category = require('../models/category');
var Application = require('../models/application');
var Document = require ('../models/document');

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

Application.createMapping(function(err,mapping){
	if(err){
		console.log('error creatingMapping');
		console.log(err);
	} else {
		console.log('Mapping created for application');
		console.log(mapping);
	}
});
var stream =Application.synchronize();
var count4=0;
var errors4=0;
stream.on('data',function(err, doc){
	//console.log("Indexed "+count4+" application documents with "+errors4+" errors");
	count4++;
});
stream.on('close',function(){
	console.log("Indexed "+count4+" application documents with "+errors4+" errors");
});
stream.on('error',function(err){
	console.log(err);
	errors4++;
});

Document.createMapping(function(err,mapping){
	if(err){
		console.log('error creatingMapping');
		console.log(err);
	} else {
		console.log('Mapping created for document');
		console.log(mapping);
	}
});
var stream =Document.synchronize();
var count5=0;
var errors5=0;
stream.on('data',function(err, doc){
	//console.log("Indexed "+count5+" application documents with "+errors5+" errors");
	count5++;
});
stream.on('close',function(){
	console.log("Indexed "+count5+" text documents with "+errors5+" errors");
});
stream.on('error',function(err){
	console.log(err);
	errors5++;
});

module.exports= false;