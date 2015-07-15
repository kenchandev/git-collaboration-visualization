var passport = require('passport');
var GithubStrategy = require('passport-github').Strategy;
// var User = require('./user.js')
var config = require('./oauth.js')

function UserWithAccess(_id, oauthID, name, username, type, created, __v, accessToken){
  this._id = _id;
  this.oauthID = oauthID;
  this.name = name;
  this.username = username;
  this.type = type;
  this.created = created;
  this.__v = __v;
  this.accessToken = accessToken;
}

// config
module.exports = passport.use(new GithubStrategy({
   clientID: config.github.clientID,
   clientSecret: config.github.clientSecret,
   callbackURL: config.github.callbackURL
 },
 function(accessToken, refreshToken, profile, done) {
   User.findOne({ oauthID: profile.id }, function(err, user) {
     if(err) { console.log(err); }
     if (!err && user != null) {
        console.log('\n\n\nAccess Token:', accessToken);
        console.log('\n\n\n\nInformation from GitHub\n\n\n\n', profile);
        console.log('\n\n\n Refresh Token:', refreshToken);
        console.log('user:', user);
        var tokenedUser = new UserWithAccess(user._id, user.oauthID, user.name, profile.username, profile._json.type, user.created, user.__v, accessToken);
        console.log('\n\n\n\nInformation from GitHub\n\n\n\n', tokenedUser);
       done(null, tokenedUser);
     } else {
       var user = new User({
         oauthID: profile.id,
         name: profile.displayName,
         created: Date.now()
       });
       user.save(function(err) {
         if(err) { 
           console.log(err); 
         } else {
           console.log("saving user ...");
           done(null, user);
         }
       });
     }
   });
  }
));
