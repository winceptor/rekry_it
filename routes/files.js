var express= require('express');

var router= express.Router();

var fs = require('fs');

var mkdirp = require('mkdirp');

var path = require('path');

var rootdir = path.join("./", '');

var uploadDirectory = path.join("./", 'uploads');
var logDirectory = path.join("./", 'log');
var publicDirectory = path.join("./", 'public');
var uploadTemp = path.join("./", 'temp');
var publicuploadDirectory = path.join(publicDirectory, 'uploads');

fs.existsSync(uploadDirectory) || fs.mkdirSync(uploadDirectory);
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
fs.existsSync(publicDirectory) || fs.mkdirSync(publicDirectory);
fs.existsSync(uploadTemp) || fs.mkdirSync(uploadTemp);
fs.existsSync(publicuploadDirectory) || fs.mkdirSync(publicuploadDirectory);

var multer = require('multer');

var User = require('../models/user');



router.use('/files/public/*?', function(req,res,next){
	
	var filepath = req.params[0] || "";
	var directory = path.join(publicDirectory, filepath);
	
	var dirfolder = filepath.split("/")[0];
	
	//console.log("filepath:" + filepath);
	
	if (filepath.length==0 || filepath.slice(-1)=="/" || fs.existsSync(directory) && fs.statSync(directory).isDirectory())
	{
		next();
	}
	else
	{
		res.redirect("/" + filepath);
	}
});

router.use('/files',function(req,res,next){
	if (!res.locals.hasadmin) { return res.denied("###denied###"); }
	//express.static(rootdir)(req,res,next);
	next();
});

var explosedfolders = ["uploads", "log", "public"];
//expose selected folders to allow file read

router.use('/files/uploads',function(req,res,next){
	express.static(uploadDirectory)(req,res,next);
});
router.use('/files/log',function(req,res,next){
	express.static(logDirectory)(req,res,next);
});

router.get('/files/*?',function(req,res,next){
	var folder = req.params[0] || "";
	//var directory = path.join(uploadDirectory, folder);
	var directory = path.join("./", folder);
	
	var dirfolder = folder.split("/")[0];
	
	if (!fs.existsSync(directory) || (folder.length>0 && folder.slice(-1)!="/") || !fs.statSync(directory).isDirectory() || (dirfolder!="" && explosedfolders.indexOf(dirfolder) < 0)) { return res.denied("###denied###"); }
	
	var files = fs.readdirSync(directory, 'utf8');
	
	var data = [];
	
	if (directory==path.join("./", ""))
	{
		for (k in explosedfolders)
		{
			var file = explosedfolders[k];
			var filepath = path.join(directory, file);
			var stats = fs.statSync(filepath);
			var isdir = stats.isDirectory();
			var entry = {file: file, stats: stats, dir: isdir, folder: folder};
			data.unshift(entry);
		}
	}
	else
	{
		for (k in files)
		{
			var file = files[k];
			var filepath = path.join(directory, file);
			var stats = fs.statSync(filepath);
			var isdir = stats.isDirectory();
			var entry = {file: file, stats: stats, dir: isdir, folder: folder};
			if (isdir) {
				data.unshift(entry);
			}
			else
			{
				data.push(entry);
			}
	}
	}
	
	

	
	return res.render('admin/files',{
		data: data,
		folder: folder,
		total: files.length,
		number: files.length,
		denied: false 
	});
});

router.post('/remove/*?',function(req,res,next){
	if (!res.locals.hasadmin) { return res.denied("###denied###"); }
	
	var filepath = req.params[0] || "";
	var file = path.join("./", filepath);
	
	var fileparts = filepath.split("/");
	var filename = fileparts[fileparts.length-1];
	var dirfolder = fileparts[0];
	
	
	if (!fs.existsSync(file) || (dirfolder!="" && explosedfolders.indexOf(dirfolder) < 0) || filename==res.locals.logfile) { return res.denied("###denied###"); }
	
	fs.unlinkSync(file);
	
	return res.redirect(res.locals.referer);
});

router.get('/file/*?',function(req,res,next){
	var filepath = req.params[0] || "";
	
	var uid = req.query.uid || null;
	
	var directory = "";
	var file = "";
	if (uid) {
		if (req.user && (req.user.id==uid || req.user.admin || req.user.employer) ) {
			directory = path.join(uploadDirectory, "users");
			directory = path.join(directory, uid);
			file = path.join(directory, filepath);
		} else { 
			return res.denied("###denied###"); 
		}
	}
	else {
		directory = path.join(uploadDirectory, "public");
		file = path.join(directory, filepath);
	}
	
	 res.sendFile(file, {root: './'});
});

router.post('/uploadcv', multer({ dest: uploadTemp}).single('file'), function(req,res, next){
	if (!req.user) { return res.denied("###denied###"); }
	
	var uid = req.user.id || null;
	
	var targetfolder = "";
	if (uid) {
		targetfolder = path.join(uploadDirectory, "users");
		targetfolder = path.join(targetfolder, uid);
	}
	else {
		targetfolder = path.join(uploadDirectory, "public");
	}
	
	var file = req.file || null;
	var folder = req.body.folder;
	
	fs.existsSync(targetfolder) || mkdirp.sync(targetfolder);
	
	var filename = file.originalname || "curriculum_vitae.pdf";
	
	var maxfilesize = 10000000;
	if (file.size>maxfilesize || (file.mimetype!="application/pdf" && file.mimetype!="application/x-pdf") || path.extname(file.originalname)!=".pdf" ){
		req.flash('error', '###cv### ###not### ###uploaded###!');
		fs.unlinkSync(file.path);
		return res.redirect(res.locals.referer);
	}
	
	if (uid)
	{
		User.findById(uid, function(err,profile){
			if(err) return next(err);
			if (!profile)
			{
				req.flash('error', '###user### ###id### ###undefined###!');
				return res.redirect(res.locals.referer);
			}
			
			if (profile.cv && profile.cv!="") {
				var oldcv = path.join(targetfolder, profile.cv);
				
				if (fs.existsSync(oldcv)){
					fs.unlinkSync(oldcv);
				}
			}
			
			profile.cv = filename;
			
			fs.renameSync(file.path, path.join(targetfolder, filename));
			
			profile.save( 
				function(err, results) {
					if(err) return next(err);
					if (!results)
					{
						req.flash('error', '###cv### ###not### ###uploaded###!');
						return res.redirect(res.locals.referer);
					}
					profile.on('es-indexed', function(err, result){
						if (err) return next(err);
						

						req.flash('success', '###cv### ###uploaded###');
						
						
						//return res.redirect('/profile/' + req.params.id);
										
						return res.redirect("/user/profile");
					});
				}
			);
		});
	}
	else
	{
		return res.redirect("/user/profile");
	}
	
	//res.end('success');
	

});


router.post('/upload', multer({ dest: uploadTemp}).single('file'), function(req,res){
	if (!res.locals.hasadmin) { return res.denied("###denied###"); }
	//var filepath = req.params[0] || "";
	//console.log(req.body); //form fields
	/* example output:
	{ title: 'abc' }
	 */
	//console.log(req.file); //form files
	/* example output:
            { fieldname: 'upl',
              originalname: 'grumpy.png',
              encoding: '7bit',
              mimetype: 'image/png',
              destination: './uploads/',
              filename: '436ec561793aa4dc475a88e84776b1b9',
              path: 'uploads/436ec561793aa4dc475a88e84776b1b9',
              size: 277056 }
	 */
	var file = req.file || null;
	var folder = req.body.folder;
	
	if (file)
	{
		var targetfolder = path.join("./", req.body.folder);
	
		fs.existsSync(targetfolder) || mkdirp.sync(targetfolder);
	 
		fs.renameSync(file.path, path.join(targetfolder, file.originalname));
	
	}
	//var targetfolder = path.join(uploadDirectory, req.body.folder);

	return res.redirect(res.locals.referer);
	//res.end('success');
	
	//next();
});

module.exports= router;
