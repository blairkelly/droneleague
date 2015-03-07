//vehicle
var config = require('./config');
var socket = require('socket.io-client')(config.serveraddress);
var serialport_lib = require("serialport");

serialport_lib.list(function (err, ports) {
    ports.forEach(function(port) {
        console.log(port.comName);
        console.log(port.pnpId);
        console.log(port.manufacturer);
    });
});

console.log("Serial address: " + config.serialaddress);

var serialport_module = serialport_lib.SerialPort
var sport = null;
var sport_connected = false;
var cmds = '';

var send_cmds = function () {
    if (sport_connected && cmds) {
        sport.write(cmds);
        //console.log(cmds);
    }
    cmds = '';
}
var add_cmd = function (cmd) {
    if (cmd) {
        cmds += cmd + ' ';
    }
}

var axes_ctrl = function (axes, value) {
    value = (parseFloat(value) + 1) / 2;

    if (axes == '2') {
        //RX
        var pwmval = Math.floor(1200 + ((1800 - 1200) * value));
        add_cmd('W'+pwmval);
    }
}
var throttle_ctrl = function (throttle, value) {
    value = parseFloat(value);
    if (throttle == 'RT') {
        var pwmval = Math.floor(1473 + ((1969 - 1473) * value));
        add_cmd('T'+pwmval);
    }
    if (throttle == 'LT') {
        var pwmval = Math.floor(1473 - ((1473 - 974) * value));
        add_cmd('T'+pwmval);
    }
}

var btn_states = {
    B: false,
    X: false,
    Y: true,
}

var btn_ctrl = function (btn, value) {
    var state = (value === '1');
    //console.log(btn, value, state);
    if (btn == 'Y' && state) {
        btn_states.Y = !btn_states.Y;

        if (btn_states.Y) {
            add_cmd('H1');
        }
        else {
            add_cmd('H0');
        }
    }

    if (btn == 'X' && state) {
        btn_states.X = !btn_states.X;

        if (btn_states.X) {
            add_cmd('F1');
        }
        else {
            add_cmd('F0');
        }
    }

    if (btn == 'B' && state) {
        btn_states.B = !btn_states.B;

        if (btn_states.B) {
            add_cmd('B1');
        }
        else {
            add_cmd('B0');
        }
    }
}

socket.on('connect', function () {
    console.log('socket connected');
    socket.emit('is_drone', true);

    socket.on('sdc', function (data) {
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
        //console.log(data);
        send_cmds();
    });

    socket.on('disconnect', function () {
        console.log('socket disconnected');
    });
});



var create_serialport_listeners = function () {
    sport.on("open", function () {
        sport_connected = true;
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

            console.log(data);

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
    sport.on("close", function () {
         sport_connected = false;
    });

}

setTimeout(function () {
    console.log("Opening serialport...");
    sport = new serialport_module(config.serialaddress, {
        baudrate: 57600,
        parser: serialport_lib.parsers.readline("\r\n")
    });
    create_serialport_listeners();
}, 1000);
