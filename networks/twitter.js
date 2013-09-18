/*jshint proto:true */
/**
 * Twitter
 */

var events = require('events');
var twitter = require('ntwitter');

var Twitter = function(config) {
    var self = this;

    this.config = config;
    events.EventEmitter.call(this);

    // setup twitter access
    this.twit = new twitter(config.api);

};

Twitter.prototype.start = function() {
    var self = this;
    this.twit.stream('user', { with: 'user' }, function(stream) {
        self.emit('connected');
        stream.on('data', function (data) {
            if (data.id) {
                self.emit('data', {
                    type: 'twitter',
                    data: data
                });
            }
        });
        stream.on('end', function (response) {
            self.emit('end', response);
        });
        stream.on('destroy', function (response) {
            self.emit('destroy');
        });
    });
};

Twitter.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Twitter;
