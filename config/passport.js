var FacebookStrategy = require('passport-facebook').Strategy;

module.exports = function(passport) {
    passport.use(new FacebookStrategy({
            clientID        : '1494136717561593',
            clientSecret    : 'deb7f211e2d0e299eac1c812e48d583b',
            callbackURL     : 'http://paint.jeremyfroment.fr/auth/facebook/callback',
            profileFields   : ['id, last_name, first_name, gender, email, birthday, location, website, picture']
        },
        function(token, refreshToken, profile, done) {
            process.nextTick(function() {
                return done(null, {
                    id:         profile._json.id,
                    nom:        profile._json.last_name,
                    prenom:     profile._json.first_name,
                    email:      profile._json.email,
                    birthdate:  profile._json.birthday,
                    ville:      profile._json.location.name,
                    profilepic: profile._json.picture.data.url,
                    website:    (profile._json.website)?profile._json.website:"",
                    sexe:       (profile._json.gender == "male") ? "H" : "F"
                });
            });
        }));
};