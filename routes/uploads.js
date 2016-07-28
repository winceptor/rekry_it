var express= require('express');

var router= express.Router();

var fs = require('fs');

var mkdirp = require('mkdirp');

var path = require('path');

var uploadDirectory = path.join("./", 'uploads');
var uploadTemp = path.join(uploadDirectory, 'temp');

fs.existsSync(uploadDirectory) || fs.mkdirSync(uploadDirectory);

var multer = require('multer');

router.use('/uploads',function(req,res,next){
	if ( !(res.locals.zeroadmins || req.user && (req.user.employer || req.user.admin)) ) { return res.redirect("/denied"); }
	express.static(uploadDirectory)(req,res,next);
});

router.get('/uploads/*?',function(req,res,next){
	if ( !(res.locals.zeroadmins || req.user && (req.user.employer || req.user.admin)) ) { return res.redirect("/denied"); }
	var folder = req.params[0] || "";
	var directory = path.join(uploadDirectory, folder);
	
	var files = fs.readdirSync(directory, 'utf8');
	
	var data = [];
	
	for (k in files)
	{
		var file = files[k];
		var filepath = path.join(directory, file);
		var stats = fs.statSync(filepath);
		
		data.push({file: file, stats: stats, dir: stats.isDirectory(), folder: folder});
	}
	
	return res.render('admin/uploads',{
		data: data,
		folder: folder,
		total: files.length,
		number: files.length
	});
});

router.use('/upload',function(req,res,next){
	if ( !(res.locals.zeroadmins || req.user && (req.user.employer || req.user.admin)) ) { return res.redirect("/denied"); }
	next();
});
router.post('/upload', multer({ dest: uploadTemp}).single('file'), function(req,res){
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

	//res.redirect("/uploads/" + req.body.folder);
	res.end('success');
	
	next();
});

module.exports= router;
