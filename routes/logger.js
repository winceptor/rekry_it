//https://github.com/expressjs/morgan#log-file-rotation

var FileStreamRotator = require('file-stream-rotator')

var express= require('express');

var router= express.Router();

var fs = require('fs')
var morgan = require('morgan')
var path = require('path')

var logDirectory = path.join("./", 'log')

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// create a rotating write stream
var accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(logDirectory, '%DATE%.log'),
  frequency: 'daily',
  verbose: false
})

// setup the logger
router.use(morgan('[:date[clf]] :remote-addr :remote-user :method :url :status - :response-time ms', {stream: accessLogStream}))

module.exports= router;
