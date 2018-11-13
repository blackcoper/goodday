var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var cityScheme = new mongoose.Schema({
    id   : {type: Schema.Types.ObjectId},
    name : {type: String},
});

module.exports = mongoose.model('cities', cityScheme);