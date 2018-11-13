var /*path = require('path'),
	templatesDir   = path.resolve(__dirname,'..','email_templates'), 
    emailTemplates = require('email-templates'),*/
    nodemailer     = require('nodemailer');

module.exports = function(){
	this.initEmail = function($callback){
		//check protocol type
		var transport = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: {
				// user: "jendela.eksperimen@gmail.com",
				// pass: "43lW9rj2!"
				user: "jendela.eksperimen@gmail.com",
				pass: "43lW9rj2!"

			},
			logger: false
		});

		$callback(transport);
	}

	this.sendEmail = function(/*$slug,*/$data, $callback){
		/*var $slug =$slug;
		var $data = $data;*/
		this.initEmail(function(mytransport){
			/*emailTemplates(templatesDir, function(err, template) {
				if (err) {
				    console.log(err);
				} else {
				  	template($slug, $data, function(err, html, text) {
						if (err) {
							console.log(err);
						} else {*/
							mytransport.sendMail({
								from: 'Goodday <donotreplay@goodday.com>',
								to: $data.email,
								subject: $data.subject,
								html: $data.html,
								// generateTextFromHTML: true,
								text: $data.text
							}, function(err, responseStatus) {
								$callback(err, responseStatus);
							});
						/*}
    				});
				}
			});*/
		});
	}
	
	return this;
}
