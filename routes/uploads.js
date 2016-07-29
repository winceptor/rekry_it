var express= require('express');

var router= express.Router();

var fs = require('fs');

var mkdirp = require('mkdirp');

var path = require('path');

var uploadDirectory = path.join("./", 'uploads');
var uploadTemp = path.join(uploadDirectory, 'temp');

fs.existsSync(uploadDirectory) || fs.mkdirSync(uploadDirectory);

var multer = require('multer');

var User = require('../models/user');

router.use('/uploads',function(req,res,next){
	if ( !(res.locals.zeroadmins || req.user && (req.user.employer || req.user.admin)) ) { return res.redirect("/denied"); }
	express.static(uploadDirectory)(req,res,next);
});

router.get('/uploads/*?',function(req,res,next){
	if ( !(res.locals.zeroadmins || req.user && (req.user.employer || req.user.admin)) ) { return res.redirect("/denied"); }
	var folder = req.params[0] || "";
	var directory = path.join(uploadDirectory, folder);
	
	if (!fs.existsSync(directory)) { return res.redirect("/denied"); }
	
	var files = fs.readdirSync(directory, 'utf8');
	
	var data = [];
	
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
	
	return res.render('admin/uploads',{
		data: data,
		folder: folder,
		total: files.length,
		number: files.length
	});
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
			return res.redirect("/denied"); 
		}
	}
	else {
		directory = path.join(uploadDirectory, "public");
		file = path.join(directory, filepath);
	}
	
	 res.sendFile(file, {root: './'});
});

router.post('/uploadcv', multer({ dest: uploadTemp}).single('file'), function(req,res, next){
	if (!req.user) { return res.redirect("/denied"); }
	
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
						
						
						//return res.slowredirect('/profile/' + req.params.id);
										
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

router.post('/uploads/*?', multer({ dest: uploadTemp}).single('file'), function(req,res){
	var filepath = req.params[0] || "";
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
	
	var targetfolder = path.join(uploadDirectory, req.body.folder);
	
	fs.existsSync(targetfolder) || mkdirp.sync(targetfolder);
	 
	fs.renameSync(file.path, path.join(targetfolder, file.originalname));

	res.redirect("/uploads/" + filepath);
	//res.end('success');
	
	next();
});

module.exports= router;
