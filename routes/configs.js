//var router= require('express').Router();
var fs = require('fs');

var initconfigs = function(configlist) {
	var initok = true;
	for (var i=0; i<configlist.length; i++)
	{
		var filename = configlist[i];
		try {
			var data = fs.accessSync('./config/'+filename+'.js', fs.F_OK, function(err, data){
				if (err) {
					console.log(err);
					initok = false;
				}
			});
		} catch (e) {
			fs.createReadStream('./config/defaults/' + filename+'.default.js').pipe(fs.createWriteStream('./config/' + filename+'.js'));
			console.log('No ' + filename+'.js file! Please check newly created ./config/'+filename);
			initok = false;
		}
	}
	return initok;
}

module.exports= initconfigs;
