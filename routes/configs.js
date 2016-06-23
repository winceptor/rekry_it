//var router= require('express').Router();
var fs = require('fs');

var initconfigs = function(configlist) {
	var missingfiles = false;
	for (var i=0; i<configlist.length; i++)
	{
		var filename = configlist[i];
		try {
			var data = fs.accessSync('../config/'+filename+'.js', fs.F_OK, function(err, data){
				if (err) {
					console.log(err);
					return false; 
				}
			});
			return true;
		} catch (e) {
			fs.createReadStream('../config/' + filename+'.default.js').pipe(fs.createWriteStream('../config/' + filename+'.js'));
			console.log('No ' + filename+'.js file! Please fill out newly created ./config/'+filename);
			missingfiles = true;
		}
	}
	return missingfiles;
}

module.exports= initconfigs;
