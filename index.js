/**
 * Social Junkie
 */
var socket = require('socket.io'),
    Buffer = require('./buffer'),
    _ = require('lodash'),
    fs = require('fs');

var config = require('./config');

var availableNetworks = {
    'twitter': require('./networks/twitter'),
    'flickr': require('./networks/flickr')
};

var buffer = new Buffer(_.keys(availableNetworks));

// Start socket.io
var io = socket.listen(config.port);
io.set('log level', 1);

// When a browser is connected to a socket
io.sockets.on('connection', function (socket) {
    // Give the browser the buffered data
    buffer.getAll().forEach(function(data) {
        socket.emit(config.channel, data);
    });
});

config.networks.forEach(function(network) {
    if (network.type in availableNetworks) {
        feed = new availableNetworks[network.type](network);
        feed.on('connected', function() {
            console.log(network.type + ' connected');
        });
        feed.on('data', function(data) {
            // Add to buffer
            buffer.add(network.type, data);

            // Emit to all sockets
            io.sockets.emit(
                config.channel,
                {
                    type: network.type,
                    data: data
                }
            );
        });
        feed.start();
    } else {
        throw new Error('Network '+network.type+' is not available');
    }
});
