var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	mongoosePaginate = require('mongoose-paginate');

var experimentScheme = new mongoose.Schema({
    id 		: {type: Schema.Types.ObjectId},
    user	: {type: Schema.Types.ObjectId, ref:'users'},
    options	: {type:Schema.Types.Mixed},
	datecreated : {type:Date,'default':Date.now},
});

experimentScheme.plugin(mongoosePaginate);
module.exports = mongoose.model('experiments', experimentScheme);
