var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	mongoosePaginate = require('mongoose-paginate'),
	bcrypt = require('bcryptjs'),
    SALT_WORK_FACTOR = 10;

var userScheme = new mongoose.Schema({
    id : {type: Schema.Types.ObjectId},
    name	 : {type:String},
    email	 : {type:String, index: { unique: true }},
    pass   : {type:String},
	phone   : {type:String,minlength:10,maxlength:15},
	dob 	:{type:Date,'default':Date.now},
    city : {type:String},
    group : {type:String, 'default':'user'},
    reset_token : {type:String},
    reset_expires : {type:Date},
	datecreated :{type:Date,'default':Date.now},
});

userScheme.pre('save', function(next) {
    var user = this;
	// only hash the password if it has been modified (or is new)
	if (!user.isModified('pass')) return next();
	// generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
	    if (err) return next(err);
	    // hash the password using our new salt
	    bcrypt.hash(user.pass, salt, function(err, hash) {
	        if (err) return next(err);
	        // override the cleartext password with the hashed one
	        user.pass = hash;
	        next();
	    });
	});
});

userScheme.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.pass, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

userScheme.plugin(mongoosePaginate);
module.exports = mongoose.model('users', userScheme);