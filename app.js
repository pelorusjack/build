'use strict';
require('dotenv').config();
var express = require('express'),
	http = require('http'),
	app = express(),
        ipfilter = require('express-ipfilter').IpFilter,
 	spawn = require('child_process').spawn,
 	exec = require('child_process').exec,
        IncomingWebhook = require('@slack/client').IncomingWebhook;
var url = process.env.SLACK_WEBHOOK_URL || '';
var webhook = new IncomingWebhook(url);

var controlServerIP = process.env.CONTROL_SERVER_IP || '127.0.0.1'
var output = [];

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
    console.log("Received build request from Control server: "  +  new Date());
    console.log(JSON.stringify(req.body.state));
    var state = req.body.state;
    if (state)
    { 
       console.log(process.cwd() + '/pull_and_build.sh');
       var deploy = spawn('bash', [ './pull_and_build.sh', '2>&1', 'out.log']);
    
    deploy.stderr.on('data', function (data) {
          console.log('stderr: ' + data);
          output.push(data);
    });


    deploy.stdout.on('data', function (data) {
  	  console.log(''+data);
          output.push(data);
    });

    deploy.on('close', function (code) {
      console.log('Child process exited with code ' + code);
      console.log('Original state: ' + state);
      webhook.send(output.join('\n'), function(err, header, statusCode, body) {
        if (err) {
          console.log('Error:', err);
        } else {
          console.log('Received', statusCode, 'from Slack');
        }
      });
      
      if (state === 'notrunning') {
        //server was not up and running before build, so shutdown afterwards
        console.log('Server was down. Shutting down: '  +  new Date());
        exec('sudo poweroff'); 
        //spawn('sh', [ 'sudo', 'poweroff' ]); 
      } else {
        console.log('Server was up. Not shutting down: '  +  new Date());
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
