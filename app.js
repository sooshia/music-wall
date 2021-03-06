/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , app = express.createServer()
  , io = require('socket.io').listen(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { layout: false });
  app.use(express.limit('15mb'));
  app.use(express.bodyParser({uploadDir: __dirname + '/public/tmp'}));  
  app.use(express.static(__dirname + '/public'));
  app.use(express.methodOverride());
  app.use(express.logger({ buffer: 5000}));
  app.use(express.favicon());
  app.use(app.router);
});

var clients = 0
  , readiness = 0;

io.sockets.on('connection', function(socket) {
    clients += 1;
    socket.join('music-wall');
    socket.on('keydown', function(data) { socket.broadcast.emit('keydown', data); socket.emit('keydown', data); });
    socket.on('click',   function(data) { socket.broadcast.emit('click',   data); socket.emit('click',   data); });
    socket.on('thumb',   function(data) { socket.broadcast.emit('thumb',   data); socket.emit('thumb',   data); });
    socket.on('upload',  function(data) { routes.extractTitle(data, socket); });
    socket.on('ready',   function() { 
        readiness += 1; 
        console.log('clients : ' + clients + ', readiness : ' + readiness);
        if (readiness == clients) {
            socket.broadcast.emit('play'); socket.emit('play'); 
            readiness = 0;
        }
    });
    socket.on('disconnect', function()  { clients -= 1; });
});


// Routes
app.get('/', routes.index);
app.get('/about', routes.about);
app.get('/changelog', routes.changelog);
app.post('/upload', routes.upload);

app.listen(4040);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
