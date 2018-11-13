var express = require('express');
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var validator = require('express-validator');
var csrf = require('csurf');
var helmet = require('helmet');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var config = require('./config/config');
var db_config = require('./config/database');
var ioServer = require('socket.io');
var http = require('http');
var https = require('https');
var generate_ssl = require('self-signed');

// ================================================
// SOCKET IO
// ================================================

pems = generate_ssl({
    name: 'localhost',
    city: 'city',
    state: 'state',
    organization: 'organization',
    unit: 'unit'
}, {
    keySize: 1024,
    expire: 2 * 365 * 24 * 60 * 60 * 1000
});

option = {
    key: pems.private, //fs.readFileSync('/etc/httpd/ssl/apache.key'),
    cert: pems.cert //fs.readFileSync('/etc/httpd/ssl/apache.crt')
};
global.io = new ioServer({
  'origins':'*:*'
});
var httpSocket = http.createServer(app);
var httpsSocket = https.createServer(option, app);
httpSocket.listen(config.port_io_http, function() {
    console.log('socket io is listening on HTTP port ' + this.address().port);
});
httpsSocket.listen(config.port_io_https, function() {
    console.log('socket io is listening on HTTPS port ' + this.address().port);
});
io.set("origins", '*:*');
io.attach(httpSocket);
io.attach(httpsSocket);

// ================================================

var routes = require('./routes/index');
var users = require('./routes/users');
var admins = require('./routes/admin');
// var developer = require('./routes/developer');

var session = require('express-session');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo/es5')(session);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json({limit:1024*1024*20, type:'application/json'}));
app.use(bodyParser.urlencoded({ extended:false,limit:1024*1024*20 }));

if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sesOpt.cookie.secure = true // serve secure cookies
}

//session option
var url_auth = '';
if(db_config.database[app.get('env')].username !='' && db_config.database[app.get('env')].password !=''){
    url_auth = db_config.database[app.get('env')].username+':'+db_config.database[app.get('env')].password+'@';
}
var sesOpt = {
    secret : config.secret_session,
    name : config.use_session_id_name,
    resave: true,
    cookie : { path: '/', httpOnly: true,  secure: false, /*domain: ''*/ }, //maxAge: new Date(Date.now()+3600000), BUG cannot regenerate session
    saveUninitialized: true,
    //domain:  '.' + app.get('domain').replace('http://', '').replace('https://', ''),
    store : new MongoStore({
        url: 'mongodb://'+url_auth+db_config.database[app.get('env')].host+':'+db_config.database[app.get('env')].port+'/'+db_config.database[app.get('env')].name,
        collection:"mongo_session"
    }),
};

app.use(session(sesOpt));
app.use(multipartMiddleware);
// app.use(csrf({ cookie: true })); // bug: "token error :invalid csrf token" skali gk cocok csrf slamanya gk cocok sampai di restart server;
app.use(validator());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());//  BUAT APA NI ?

//load helpers
var helpers = require('./lib/helpers')(app, config);

//load routes
app.use('/', routes);
app.use('/users', users);
// app.use('/developer', developer);
app.use('/'+config.admin_url, admins);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    res.send('404 not found')
    //next(err);
});

// error handlers  OPEN LATER
// app.use(function(err, req, res, next){
//     if (err.code == 'EBADCSRFTOKEN'){
//         res.status(500).json({error_code:'0012',status:false,msg: "token error :"+err.message});
//         return;
//     } else {
//         next();
//     }
// });

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
