//var router= require('express').Router();
var fs = require('fs');

var initconfigs = function(configlist) {
	var initok = true;
	for (var i=0; i<configlist.length; i++)
	{
		var filename = configlist[i];
		try {
			var data = fs.accessSync('./config/' + filename + '.js', fs.F_OK, function(err, data){
				if (err) {
					console.log(err);
					initok = false;
				}
			});
		} catch (e) {
			var data = fs.readFileSync('./config/defaults/' + filename + '.default.js', 'utf8', function(err, data){
				if (err) {
					console.log(err);
					initok = false;
				}
			});
			fs.writeFileSync('./config/' + filename + '.js', data, 'utf8', function(err, data){
				if (err) {
					console.log(err);
					initok = false;
				}
			});
			
			console.log('No ' + filename+'.js file! Please check newly created ./config/'+filename);
		}
	}
	return initok;
}

module.exports= initconfigs;
