var port            = process.env.PORT || 80;
var express         = require('express');
var morgan          = require('morgan');
var logger          = require('log4js').getLogger('Server');
var bodyParser      = require('body-parser');
var mysql           = require('mysql');
var session         = require('express-session');
var passport        = require('passport');
var favicon         = require('serve-favicon');
var passwordHasher  = require('password-hasher');
var app             = express();
var infoConnexion   = {
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'pictionnary',
    port     : 3306
};

// SET
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// USE
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(morgan('combined'));
app.use(passport.initialize());
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(session({ secret: 'pictionnary', resave: true, saveUninitialized: true }));
app.use(favicon(__dirname + '/public/img/favicon.ico'));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

// CONNEXION
require('./config/passport.js')(passport);

// ROUTES
require('./app/routes.js')(app, mysql, infoConnexion, passport, passwordHasher);

app.use(function(req, res) {
    res.render('404', { url: req.url, user: req.session.user});
});

app.listen(port);

logger.info('Serveur démarré :  http://localhost:' + port);