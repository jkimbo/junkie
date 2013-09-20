/*jshint proto:true */
/**
 * Flickr
 */

var events = require('events'),
    crypto = require('crypto'),
    request = require('request'),
    open = require('open'),
    Q = require('q'),
    _ = require('lodash');

var Flickr = function(config) {
    var self = this;

    var defaults = {
        baseUrl: 'http://api.flickr.com/services/rest'
    };

    this.config = _.extend(defaults, config);
    events.EventEmitter.call(this);

    // default args
    this.args = {
        format: 'json',
        nojsoncallback: '1',
        api_key: this.config.api.key
    };

    // setup twitter access
    //this.flickr = new FlickrAPI(config.api.key, config.api.secret);
};

// Generate API signature from shared secret
Flickr.prototype.generateSignature = function(params) {
    var argument_pairs = [];
    for (var key in params) {
        argument_pairs[argument_pairs.length] = [key, params[key]];
    }

    argument_pairs.sort(function(a,b) {
        if ( a[0]== b[0] ) return 0 ;
        return a[0] < b[0] ? -1 : 1;
    });

    var args = "";
    for (var i=0; i < argument_pairs.length; i++) {
        args += argument_pairs[i][0];
        args += argument_pairs[i][1];
    }
    var sig = this.config.api.secret + args;
    return crypto.createHash('md5').update(sig).digest("hex");
    //return md5.md5(sig);
};

// Make api request
Flickr.prototype.query = function(method, args, cb) {
    if (!args) args = {};

    args = _.extend(args, this.args);
    args.method = method;
    var args_string = this.generateUrl(args);

    var p;

    if (!cb) {
        p = Q.defer();
    } else {
        if (typeof cb !== 'function') {
            throw new Error('Callback must be a function');
        }
    }

    // make request
    request(
        {
            url: this.config.baseUrl + args_string,
            json: true
        },
        function(error, response, body) {
            if (error) {
                throw error;
            }

            if (!cb) {
                p.resolve({
                    response: response,
                    body: body
                });
            } else {
                cb(response, body);
            }
        }
    );

    if (!cb) {
        return p.promise;
    }
};

// Generate API request url
Flickr.prototype.generateUrl = function(args) {
    if (!args) args = {};

    args.api_sig = this.generateSignature(args);

    args_string = "?";
    for (var key in args) {
        args_string += (key + "=" + args[key]);
        args_string += "&";
    }

    return args_string;
};

// Authenticate against api
// Returns promise with auth_token in it
Flickr.prototype.authenticate = function() {
    var p = Q.defer();
    var self = this;

    // Get hold of a 'frob' (requires the method to be signed, does not require
    // authentication)
    this.query('flickr.auth.getFrob')
    .then(function(data) {
        self.frob = data.body.frob._content;

        var auth_link = 'http://flickr.com/services/auth/' +
            self.generateUrl(
                {
                    api_key: self.config.api.key,
                    perms: 'read',
                    frob: self.frob
                }
            );

        console.log(
            'Opening the following link in your browser: ',
            auth_link
        );

        open(auth_link);

        // now wait for user to signify that it is ready to carry on
        var stdin = process.stdin, stdout = process.stdout;

        stdin.resume();
        stdout.write("Carry on? ");

        stdin.once('data', function(data) {
            data = data.toString().trim();

            // Get auth token
            self.query('flickr.auth.getToken', { frob: self.frob })
            .then(function(data) {
                self.auth_token = data.body.auth.token._content;
                p.resolve(self.auth_token);
            }).fail(function(error) {
                p.reject(error);
            });
        });
    }).fail(function(error) {
        throw error;
    });

    return p.promise;
};

Flickr.prototype.start = function() {
    var self = this;

    var auth = this.authenticate();
    auth.then(function(auth_token) {
        self.emit('connected');
        // Get recently updated photos
        self.query(
            'flickr.photos.recentlyUpdated',
            {
                auth_token: auth_token,
                min_date: 1364792400
            }
        ).then(function(data) {
            console.log(data.body);
        });
        // Start timer
    }).fail(function(error) {
        throw error;
    });
};

Flickr.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Flickr;