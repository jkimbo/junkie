/**
 * Buffer
 */
var _ = require('lodash');

var Buffer = function(buckets, options) {
    this.options = options || {};
    this.buckets = {};

    buckets.forEach(_.bind(function(bucket) {
        this.buckets[bucket] = [];
    }, this));

    var defaults = {
        'max': 40
    };

    this.options = _.extend(defaults, this.options);
};

/**
 * Add data to bucket
 */
Buffer.prototype.add = function(bucket, data) {
    if (!(bucket in this.buckets)) {
        throw new Error('Bucket ' + bucket + ' is not defined');
    }

    if (_.isArray(data)) {
        this.buckets[bucket] = _.union(this.buckets[bucket], data);
    } else {
        this.buckets[bucket].push(data);
    }
    this.limitBucket(bucket);
    return this.buckets[bucket];
};

/**
 * Get data from bucket
 */
Buffer.prototype.get = function(bucket) {
    if (!(bucket in this.buckets)) {
        throw new Error('Bucket ' + bucket + ' is not defined');
    }

    return this.buckets[bucket];
};

/**
 * Get all the data from the buffer
 */
Buffer.prototype.getAll = function() {
    var data = [];
    for (var bucket in this.buckets) {
        data.push(
            {
                type: bucket,
                data: this.get(bucket)
            }
        );
    }
    return data;
};

/**
 * Limit bucket
 * Reduce size of bucket until it is within the max size
 */
Buffer.prototype.limitBucket = function(bucket) {
    if (this.buckets[bucket].length > this.options.max) {
        var diff = this.buckets[bucket].length - this.options.max;
        for (var i = 0; i < diff; i++) {
            this.buckets[bucket].splice(0, 1);
        }
    }
};

module.exports = Buffer;
