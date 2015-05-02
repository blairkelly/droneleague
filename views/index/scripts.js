/* sockets */
var socket = io.connect('//'+window.location.hostname+':'+window.location.port);

var emit = function (to_emit) {
    if (socket.connected) {
        socket.emit('sdc', to_emit);
    }
}

var gS = {
    startPolling: function() {
        if (!gS.ticking) {
            console.log("Starting Poll...");
            gS.tick_counter = 0;
            gS.tick_skip = 10;
            gS.axesCenterThreshold = 0.162;
            gS.axesThreshold = 0.01; //percent change
            gS.gamepadConnected = false; 
            gS.ticking = true;
            gS.tick();
        }
    },

    stopPolling: function() {
        gS.ticking = false;
        console.log("Poll stopped");
    },

    tick: function() {
        gS.pollStatus();
        gS.scheduleNextTick();
    },

    scheduleNextTick: function() {
        if (gS.ticking) {
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(gS.tick);
            } else if (window.mozRequestAnimationFrame) {
                window.mozRequestAnimationFrame(gS.tick);
            } else if (window.webkitRequestAnimationFrame) {
                window.webkitRequestAnimationFrame(gS.tick);
            }
        }    
    },

    axesTranslate: function (value) {
        var newValue = value;
        var pt = gS.axesCenterThreshold;
        var nt = -pt;
        if (value > nt && value < pt) {
            newValue = 0;
        } else {
            if (value <= nt) {
                newValue = -((value - nt) / (-1 - nt));
            } else if (value >= pt) {
                newValue = (value - pt) / (1 - pt);
            }
            if (value <= (-1 - (nt / 2))) {
                newValue = -1;
            } else if (value >= (1 - (pt / 2))) {
                newValue = 1;
            }
        }
        return newValue;
    },

    axesCompare: function (_old, _new) {
        if (_old != _new) {
            var change = Math.abs(_new - _old);
            if (change >= gS.axesThreshold) {
                return true;
            } else {
                return false;
            }
            
        } else {
            return false;
        }
    },

    insertCmd: function (str, cat, itm, val) {
        if (str) {
            str+=' ';
        }
        if (typeof(val) == "boolean") {
            if (val) {
                val = 1;
            } else {
                val = 0;
            }
        } else {
            val = val.toFixed(4);
        }
        return (str + cat + '/' + itm + '/' + val);
    },

    watchGamepad: function (gp) {
        //trying to reduce socket latency:
        if (gS.tick_counter < gS.tick_skip) {
            var gpsd = '';

            /* Axes */
            if ( gS.axesCompare(gS.oa[0], gS.axesTranslate(gp.axes[0])) ) {
                //left stick, left & right
                //left is negative, right is positive
                gS.oa[0] = gS.axesTranslate(gp.axes[0]);
                gpsd = gS.insertCmd(gpsd, 'a', 0, gS.oa[0]);
                $('.display_axes .leftx>span').text(gS.oa[0]);
                //console.log("leftX: " + gS.oa[0]);
            }
            if ( gS.axesCompare(gS.oa[1], gS.axesTranslate(gp.axes[1])) ) {
                //left stick, up & down
                //up is negative, down is positive
                gS.oa[1] = gS.axesTranslate(gp.axes[1]);
                gpsd = gS.insertCmd(gpsd, 'a', 1, gS.oa[1]);
                $('.display_axes .lefty>span').text(gS.oa[1]);
                //console.log("leftY: " + gS.oa[1]);
            }
            if ( gS.axesCompare(gS.oa[2], gS.axesTranslate(gp.axes[2])) ) {
                //right stick, left & right
                gS.oa[2] = gS.axesTranslate(gp.axes[2]);
                gpsd = gS.insertCmd(gpsd, 'a', 2, gS.oa[2]);
                $('.display_axes .rightx>span').text(gS.oa[2]);
                //console.log("rightX: " + gS.oa[2]);
            }
            if ( gS.axesCompare(gS.oa[3], gS.axesTranslate(gp.axes[3])) ) {
                //right stick, up & down
                gS.oa[3] = gS.axesTranslate(gp.axes[3]);
                gpsd = gS.insertCmd(gpsd, 'a', 3, gS.oa[3]);
                $('.display_axes .righty>span').text(gS.oa[3]);
                //console.log("rightY: " + gS.oa[3]);
            }

            /* Throttles */
            //don't appear to need filtering atm
            if (gS.throttles.LT != gp.buttons[6].value) {
                gS.throttles.LT = gp.buttons[6].value;
                gpsd = gS.insertCmd(gpsd, 't', 'LT', gS.throttles.LT);
                $('.display_throttles .lt>span').text(gS.throttles.LT);
            }
            if (gS.throttles.RT != gp.buttons[7].value) {
                gS.throttles.RT = gp.buttons[7].value;
                gpsd = gS.insertCmd(gpsd, 't', 'RT', gS.throttles.RT);
                $('.display_throttles .rt>span').text(gS.throttles.RT);
            }

            /* Buttons */
            if (gS.ob.A != gp.buttons[0].pressed) {
                gS.ob.A = gp.buttons[0].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'A', gS.ob.A);
            }
            if (gS.ob.B != gp.buttons[1].pressed) {
                gS.ob.B = gp.buttons[1].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'B', gS.ob.B);
            }
            if (gS.ob.X != gp.buttons[2].pressed) {
                gS.ob.X = gp.buttons[2].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'X', gS.ob.X);
            }
            if (gS.ob.Y != gp.buttons[3].pressed) {
                gS.ob.Y = gp.buttons[3].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'Y', gS.ob.Y);
            }
            if (gS.ob.LB != gp.buttons[4].pressed) {
                gS.ob.LB = gp.buttons[4].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'LB', gS.ob.LB);
            }
            if (gS.ob.RB != gp.buttons[5].pressed) {
                gS.ob.RB = gp.buttons[5].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'RB', gS.ob.RB);
            }
            if (gS.ob.select != gp.buttons[8].pressed) {
                gS.ob.select = gp.buttons[8].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'select', gS.ob.select);
            }
            if (gS.ob.start != gp.buttons[9].pressed) {
                gS.ob.start = gp.buttons[9].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'start', gS.ob.start);
            }
            if (gS.ob.L3 != gp.buttons[10].pressed) {
                gS.ob.L3 = gp.buttons[10].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'L3', gS.ob.L3);
            }
            if (gS.ob.R3 != gp.buttons[11].pressed) {
                gS.ob.R3 = gp.buttons[11].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'R3', gS.ob.R3);
            }
            if (gS.ob.DU != gp.buttons[12].pressed) {
                gS.ob.DU = gp.buttons[12].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'DU', gS.ob.DU);
            }
            if (gS.ob.DD != gp.buttons[13].pressed) {
                gS.ob.DD = gp.buttons[13].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'DD', gS.ob.DD);
            }
            if (gS.ob.DL != gp.buttons[14].pressed) {
                gS.ob.DL = gp.buttons[14].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'DL', gS.ob.DL);
            }
            if (gS.ob.DR != gp.buttons[15].pressed) {
                gS.ob.DR = gp.buttons[15].pressed;
                gpsd = gS.insertCmd(gpsd, 'b', 'DR', gS.ob.DR);
            }

            if (gpsd != '') {
                emit(gpsd);
            }

            gS.tick_counter = 0;
        }
        gS.tick_counter++;
    },

    pollStatus: function() {
        var gamepadlist = navigator.getGamepads();
        if (gS.gamepadConnected) {
            if (gamepadlist[gS.gamepadIndex]) {
                gS.watchGamepad(gS.gp);
            } else {
                console.log('gamepad disconnected');
                gS.gamepadConnected = false;
                gS.gamepadIndex = null;
            }
        } else {
            for (var i=0; i<=gamepadlist.length; i++) {
                if (gamepadlist[i]) {
                    if(gamepadlist[i].id.indexOf('Xbox 360') > -1) {
                        console.log('Xbox controller connected');
                        gS.gamepadConnected = true;
                        gS.gamepadIndex = i;
                        var gp = gS.gp = gamepadlist[i];
                        console.log(gp);
                        gS.oa = [0, 0, 0, 0];
                        gS.axes = [gp.axes[0], gp.axes[1], gp.axes[2], gp.axes[3]];
                        gS.throttles = {
                            LT: gp.buttons[6].value,
                            RT: gp.buttons[7].value,
                        }
                        gS.ob = {
                            A: gp.buttons[0].pressed,
                            B: gp.buttons[1].pressed,
                            X: gp.buttons[2].pressed,
                            Y: gp.buttons[3].pressed,
                            LB: gp.buttons[4].pressed,
                            RB: gp.buttons[5].pressed,
                            select: gp.buttons[8].pressed,
                            start: gp.buttons[9].pressed,
                            L3: gp.buttons[10].pressed,
                            R3: gp.buttons[11].pressed,
                            DU: gp.buttons[12].pressed,
                            DD: gp.buttons[13].pressed,
                            DL: gp.buttons[14].pressed,
                            DR: gp.buttons[15].pressed,
                        };
                    } else {
                        console.log('UNKNOWN CONTROLLER CONNECTED');
                        gS.gamepadConnected = true;
                        gS.gamepadIndex = i;
                        var gp = gS.gp = gamepadlist[i];
                        console.log(gp);
                        gS.oa = [0, 0];
                        gS.axes = [gp.axes[0], gp.axes[1]];
                    }
                }
            }
        }
    },
}

gS.startPolling();

$('.start').click(function () {
    gS.startPolling();
});
$('.stop').click(function () {
    gS.stopPolling();
});