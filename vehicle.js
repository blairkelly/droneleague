//vehicle
var config = require('./config');
var socket = require('socket.io-client')('http://10.0.1.8:3000');
var serialport_lib = require("serialport");

serialport_lib.list(function (err, ports) {
    ports.forEach(function(port) {
        console.log(port.comName);
        console.log(port.pnpId);
        console.log(port.manufacturer);
    });
});

console.log("Serial address: " + config.serialaddress);

var sp = serialport_lib.SerialPort
var sport = null;

/*
var axes_ctrl = function (axes, value) {
    value = (parseFloat(value) + 1) / 2;

    if (axes == '2') {
        //RX
        
    }
}
var throttle_ctrl = function (throttle, value) {
    value = parseFloat(value);
    if (throttle == 'RT') {

    }
    if (throttle == 'LT') {

    }
}
var btn_ctrl = function (btn, value) {
    var state = (value === 'true');
    if (btn == 'B') {
        
    }
}
*/

socket.on('connect', function () {
    console.log('socket connected');
    socket.emit('is_drone', true);

    socket.on('sdc', function (data) {
        /*
        var split_data = data.split(' ');
        for (var i=0; i<split_data.length; i++) {
            var rcmd = split_data[i].split('/');
            if (rcmd[0] == 'a') {
                axes_ctrl(rcmd[1], rcmd[2]);
            } else if (rcmd[0] == 't') {
                throttle_ctrl(rcmd[1], rcmd[2]);
            } else if (rcmd[0] == 'b') {
                btn_ctrl(rcmd[1], rcmd[2]);
            }
        }
        */
    });

    socket.on('disconnect', function () {
        console.log('socket disconnected');
    });
});



var create_serialport_listeners = function () {
    sport.on("open", function () {
        console.log('opened serial port');

        //sport.write('p0\r');

        sport.on('data', function (data) {
            var pairs = data.split('&');
            var pieces = null;
            var params = {};

            for(var i = 0; i<pairs.length; i++) {
                pieces = pairs[i].split('=');
                params[pieces[0]] = pieces[1];
            }

            //if (params.powerswitchtail) {
            //    pst_status = parseInt(params.powerswitchtail);
            //}

            /*
            io.sockets.emit('info', {
                meatpi: params,
                gt1: gt1,
                gt2: gt2,
                t0: t0,
                t1: t1,
                pst_status: pst_status,
                pst_ctrl: pst_ctrl,
            });
            */
        });
    });
}

setTimeout(function () {
    console.log("Opening serialport...");
    sport = new sp(config.serialaddress, {
        baudrate: 57600,
        parser: serialport_lib.parsers.readline("\r\n")
    });
    create_serialport_listeners();
}, 5000);
