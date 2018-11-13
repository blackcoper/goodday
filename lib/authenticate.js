module.exports = function(user, redir) {
	return function(req, res, next){
		if(req.session.loged_in && req.session.user_group==user){
			next();
		}else{
			res.redirect(redir)
		}
	}
}