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
            if (self.filterTweet(data)) {
                self.emit('data', data);
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

Twitter.prototype.filterTweet = function(tweet) {
    var check = true;
    var self = this;
    if (typeof tweet.entities !== 'undefined' && tweet.entities.user_mentions.length > 0) {
      _.each(tweet.entities.user_mentions, function(mention) {
        if (mention.id == self.config.user) {
          check = false;
          return false;
        }
      });
    }

    if (typeof tweet.retweeted_status !== 'undefined') {
      check = false;
    }

    if (typeof tweet.source !== 'undefined' && tweet.source.id !== self.config.user) {
      check = false;
    }

    return check;
};

Twitter.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Twitter;
