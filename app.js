'use strict';
require('dotenv').config();
var express = require('express'),
	http = require('http'),
	app = express(),
        ipfilter = require('express-ipfilter').IpFilter,
 	spawn = require('child_process').spawn;
var controlServerIP = process.env.CONTROL_SERVER_IP

// Whitelist the following IPs
var ips = ['127.0.0.1','::1', controlServerIP];
 
// Create the server 
app.use(ipfilter(ips, {mode: 'allow'}));
app.use(express.bodyParser());

// all environments
app.set('port', process.env.PORT || 8080);

app.get('/', function (req, res, next) {
	res.send('Hello World!')
})

app.post('/build/', function (req, res) {
    console.log(JSON.stringify(req.body.state));
    var state = req.body.state;
    if (state)
    { 
       deploy = spawn('sh', [ './pull_and_build.sh' ]);
    

    deploy.stdout.on('data', function (data) {
  	  console.log(''+data);
    });

    deploy.on('close', function (code) {
      console.log('Child process exited with code ' + code);
      console.log('state' + state);
      if (state === 'notrunning') {
        //server was not up and running before build, so shutdown afterwards
        console.log('shutting down');
        spawn('sh', [ 'poweroff' ]); 
      }
    });
    res.json(200, {message: 'Hook received from control server!'})
    } else {
      res.json(400, {message: 'Hook from control server missing data!'})
    }
  }
);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
