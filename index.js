/**
 * Social Junkie
 */
var socket = require('socket.io');

var config = require('./config');

var availableNetworks = {
    'twitter': require('./networks/twitter')
};

// Start socket.io

config.networks.forEach(function(network) {
    if (network.type in availableNetworks) {
        feed = new availableNetworks[network.type](network);
        feed.on('connected', function() {
            console.log(network.type + ' connected');
        });
        feed.on('data', function(data) {
            console.log(data);
        });
        feed.start();
    } else {
        throw new Error('Network '+network.type+' is not available');
    }
});
