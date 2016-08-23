var respawn = require('respawn')

var monitor = respawn(['node', 'rekryitportal.js'], {
  name: 'rekryitportal',         // set monitor name
  env: {ENV_VAR:'test'}, // set env vars
  cwd: '.',              // set cwd
  maxRestarts:60,        // how many restarts are allowed within 60s
                         // or -1 for infinite restarts
  sleep:1000,            // time to sleep between restarts,
  kill:30000            // wait 30s before force killing after stopping
})

monitor.on('stdout', function(data) {
	process.stdout.write(data.toString());
})

monitor.on('stderr', function(data) {
	process.stdout.write(data.toString());
})


monitor.on('start', function(data) {
	console.log("Started: rekryitportal.js");
})


monitor.start() // spawn and watch

process.on('SIGTERM', function () {
	monitor.stop(function() {
		 process.exit(0);
	})
});