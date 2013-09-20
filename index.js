/**
 * Social Junkie
 */
var socket = require('socket.io');
var fs = require('fs');

var config = require('./config');

var availableNetworks = {
    'twitter': require('./networks/twitter'),
    'flickr': require('./networks/flickr')
};

// Start socket.io
var io = socket.listen(config.port);
io.set('log level', 1);

config.networks.forEach(function(network) {
    if (network.type in availableNetworks) {
        feed = new availableNetworks[network.type](network);
        feed.on('connected', function() {
            console.log(network.type + ' connected');
        });
        feed.on('data', function(data) {
            console.log(data);
            io.sockets.emit(config.channel, data);
        });
        feed.start();
    } else {
        throw new Error('Network '+network.type+' is not available');
    }
});
