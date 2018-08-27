var express = require('express');
var router = express.Router();
var DB = require('../helper/mysql_connect');
var geolib = require('geolib');
var ip = require('ip');
var PASSPORT = require('passport');
var FB = require('passport-facebook').Strategy;
var geoip = require('geoip-lite');
var session = require('express-session');


router.use(PASSPORT.initialize());
PASSPORT.use(new FB({
  clientID: '270778270313692',
  clientSecret: 'd797e1e50260e4cbde69ec8add9d5d9e',
  callbackURL: '/auth/facebook/callback',
  enableProof: true,
  profileFields: ['id','name','name_format','picture','short_name','email']
},
  function (accessToken, refreshToken, user, done) {
    done(null, user);
  }
));

PASSPORT.serializeUser(function (user, done) {
  done(null,user);
});

PASSPORT.deserializeUser(function (params) {
  done(null,user);
});

router.get('/auth/facebook', PASSPORT.authenticate('facebook',{scope: ['email']}));

router.get('/auth/facebook/callback', PASSPORT.authenticate('facebook'), function (req,res) {
  return res.json({
    status: "OK",
    message: "Auth success!",
    user: req.user,
    id: req.user.id
  });
});

router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/home', function (req,res) {
  res.redirect('/home.html');
});


router.post('/do-register', function (req,res) {
  var email = req.body.email;
  var password = req.body.password;
  
  var q = 'SELECT * FROM user WHERE email = ?';
  DB.query(q, email,function(err,results){
    if(err){
      return res.json({
        status: "ERROR",
        message: err.message
      });
    }else if(results.length > 0){
      return res.json({
        status: "Email registered",
        message: "Email already registered"
      });

    }else{
      var sql = 'INSERT INTO user(email,password) values(?,?)';
      var data = [email,password];

      DB.query(sql, data,function (err) {
        if(err){
         //callback -> handler.js (request.done)
          return res.json({
            status: "ERROR",
            message: err.message
          });
        }
        
        return res.json({
          status: "ok",
          message: "Register success"
        });
      });
    }
  });


  
});

function authMiddleware(req,res,done) {

  var email = req.body.email;
  var password = req.body.password;

  var sql = "SELECT * FROM user WHERE email = ? and password = ?";

  var data = [email,password];

  DB.query(sql, data, function (err,results) {
    if(err){
      return res.json({
        status: "ERROR",
        message: err.message
      });
    } else if (results.length == 0) {
      return res.json({
        status: "Unauthorized",
        message: "Invail email or password!."
      });
    } else {
      // berhasil authenticate
      console.log(results[0]);
      res.locals.id = results[0].id;
      done();
    }
  });
}

function verifyAuth(req,res,next) {
  
  var user_id = req.body.user_id;

  if(!user_id){
    return res.json({
      status: "Unauthorized!",
      message: "Please include user_id field!"
    });
  }

  var sql = "SELECT * FROM user WHERE id = ?";
  var data = [user_id];
  
  DB.query(sql,data,function (err, results){
    if(err){
      return res.json({
        status: "ERROR",
        message: err.message
      })
    } else if(results.length == 0) {
      return res.json({
        status: "Unauthorized!",
        message: "There is no registered user associated with given user_id!"
      });
    }
    res.locals.id = user_id;
    next();
  });
}

router.post('/authenticate', authMiddleware, function(req,res){
  
  return res.json({
    status: "OK",
    message: "Authorized!",
    user_id: res.locals.id
  });
});

router.post('/shareGeoLoc',verifyAuth,function(req,res){
  
  var lat = req.body.lat;
  var long = req.body.long;
  var user_id = res.locals.id;
  
  //cek lokasi udah ada atau belum
  var q = 'SELECT * FROM location WHERE user_id = ?';
  DB.query(q, user_id,function(err,results){
    if(err){
      return res.json({
        status: "ERROR",
        message: err.message
      });
    }else if(results.length >= 1){
      var sql = 'UPDATE location SET latitude = ? , longitude = ? WHERE user_id = ?';
      var data = [lat,long,user_id];

      DB.query(sql, data,function (err) {
        if(err){
          return res.json({
            status: "ERROR",
            message: err.message
          });
        }
        
        return res.json({
          status: "Success",
          message: "Update location success!"
        });
      });
    }else{
      var sql = 'INSERT INTO location(user_id,latitude,longitude) values(?,?,?)';
      var data = [user_id,lat,long];

      DB.query(sql, data,function (err) {
        if(err){
          return res.json({
            status: "ERROR",
            message: err.message
          });
        }
        
        return res.json({
          status: "Success",
          message: "You've shared your location, You can see people around you on 'Near Me' menu"
        });
      });
    }
    
    
  });

});


router.post('/near-me',function(req,res){
  //get my loc
  var sql = 'SELECT * FROM location WHERE user_id = ?';
  DB.query(sql, req.body.id,function(err,results){
    if(err){
      return res.json({
        status: "ERROR",
        message: err.message
      });
    }else if(results.length>0){
      var myLat = results[0].latitude;
      var myLong = results[0].longitude;
      var q = 'SELECT * FROM location lc, user usr WHERE lc.user_id <> ? AND usr.id = lc.user_id ';
      var data = req.body.id;
      DB.query(q,data,function(err,rows){
          if(err){
            return res.json({
              status: "ERROR",
              message: err.message
            });
          }

          //hasil
          var hasil = new Array();
          for(var i=0;i<rows.length;i++){
            var data = new Object();
            data.email = rows[i].email;
            data.latitude = rows[i].latitude;
            data.longitude = rows[i].longitude;
            data.distance = geolib.getDistance({
              'latitude':myLat, 'longitude':myLong 
            },{
              'latitude':rows[i].latitude, 'longitude':rows[i].longitude
            });
            hasil.push(data);
          }
          return res.send(hasil);
        });
    }else{
      return res.json({
        status: "Not Found",
        message: "You must share your location too"
      });
    }
  });

});

router.get('/index',function(req, res, next){
  res.redirect('index.html');
});
router.get('/sign-up',function(req, res, next){
  res.redirect('sign-up.html');
});

router.get('/tes',function(req,res){
  return res.json({tes:"as"});
});

module.exports = router;
