var app = module.parent.exports.app;
var io = module.parent.exports.io;

var drone_socket = null;

app.get('/', function (req, res) {
	res.render('index/index.jade');
});

io.on('connection', function(socket) {
	console.log("socket io connection!");
	
	socket.on('sdc', function (data) {
		if (drone_socket) {
			drone_socket.emit('sdc', data);
		}
	});

	socket.on('is_drone', function (data) {
		console.log("This socket is a DRONE.");
		drone_socket = socket;
		drone_socket.is_drone = true;
	});

	socket.on('disconnect', function () {
		console.log('socket disconnected');

		if (socket.is_drone) {
			console.log('drone disconnected');
			drone_socket = null;
		}
	});
});