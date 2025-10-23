const User = require('../Models/UserSchema');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      // Find user by email
      const user = await User.findOne({ Email: email });
      if (!user) {
        return done(null, false, { message: 'Account does not exist' });
      }

      if(!user.Authenticated)  return done(null, false, { message: 'Account is not Authenticated' });

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.Password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// Serialize user
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id);
  done(null, user.id); 
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
    console.log('Deserializing user:', id);
  } catch (err) {
    done(err);
  }
});


module.exports = passport;
