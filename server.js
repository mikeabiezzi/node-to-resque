var http  = require('http');
var redis = require('redis');

var QUEUE_NAME = 'default';
var CLASS_NAME = 'SomeJob';

var client = redis.createClient();
var job_queue = [];

function sendToRedis() {
  count = job_queue.length;
  if( count > 0 ) {
    var jobs = job_queue.splice( 0, count );
    client.multi( jobs ).exec();
    console.log( count + ' record(s) processed' );
  }
}

function buildJob( data ) {
  var params = {
    'class': CLASS_NAME,
    args: [ {"id": data} ]
  };

  return [
    'rpush',
    'resque:queue:'+ QUEUE_NAME,
    JSON.stringify( params )
   ];
}

http.createServer(function( req, res ) {

 if( req.url !== '/api/redis/add' ) {
   res.writeHead(404);
   res.end('Not found');
   return;
 }

 var buffer = '';

  req.on('data', function(chunk) {
    buffer += chunk;
  });

  req.on('end', function() {
    job_queue.push( buildJob( buffer ) );
    res.writeHead(200);
    res.end();
  });

}).listen( 3000);

setInterval( sendToRedis, 1000 );
