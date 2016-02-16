var express = require('express');
var router = express.Router();
var expValidator = require('express-validator');
var validator = require('validator');
var request = require('request');

router.use(expValidator({
  customValidators: {
    isValidName: function(input) {
      if( input.match(/^[\w\&\/\.\(\)\-\,\'\s]+$/) ){
        return true
      } else {
        return false
      }
    },
    isValidAddress: function(input) {
      if( input.match(/^[\w\#\.\,\;\:\'\s]+$/) ){
        return true
      } else {
        return false
      }
    },
    isValidCityTown: function(input) {
      if( input.match(/^[\w\-\,\.\;\'\&\/\.\(\)\s]+$/) ){
        return true
      } else {
        return false
      }
    },
    isValidZip: function(input) {
      if( input.match(/(^\d{5}$)|(^\d{5}-\d{4}$)/) ){
        return true
      } else {
        return false
      }
    },
    maxLength: function(input, max) {
      if(input.lenght > max) {
        return false;
      } else {
        return true;
      }
    }
  }
}));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('register', {
    title: 'Register',
    usstates: getStates(),
    cssfile: 'register'
  });
});

/* GET confirm Page. */
router.get('/confirm', function(req, res) {
  res.redirect('/');
});


/* GET Userlist page. */
router.get('/registeredusers', function(req, res) {
  var db = req.db;
  var collection = db.get('usercollection');
  collection.find({},{},function(e,docs){
    res.render('registeredusers', {
      userlist: docs,
      title: 'Registered User Report',
      cssfile: 'registeredusers'
    });
  });
});

/* GET Register Page. */
router.get('/register', function(req, res) {
  res.render('register', {
    title: 'Register',
    usstates: getStates(),
    cssfile: 'register'
  });
});

/* POST to Add User Service */
router.post('/', function(req, res) {

  // Set internal DB variable
  var db = req.db;

  // Get form values and clean.
  var firstName = cleanInput(req.body.firstname);
  var lastName = cleanInput(req.body.lastname);
  var address1 = cleanInput(req.body.address1);
  var address2 = cleanInput(req.body.address2);
  var city = cleanInput(req.body.city);
  var state = req.body.state;
  var zip = cleanInput(req.body.zip);
  var country = req.body.country;

  // Set date time for
  var dt = new Date();
  var month = dt.getMonth() + 1;
  if ( month < 10 ) {
    month = "0" + month.toString();
  }
  var dtarry = dt.toString().split(" ");
  var ts = dtarry[3] + "-" + month + "-" + dtarry[2] + " " + dtarry[4];

  var errors = [];

  // google reCAPTCHA
  var recaptcha = req.body["g-recaptcha-response"];
  var captchaSecret = process.env.CAPTCHASECRET;
  request({
    url: 'https://www.google.com/recaptcha/api/siteverify',
    method: 'POST',
    qs: {secret: captchaSecret, response: recaptcha},
    headers: {
      'Content-Type': 'application/json',
    }
  }, function (error, response, body) {
    if(error) {
      errors.push({error: "captcha", msg: "Captcha error. Try Again."});
    }
    var obj = JSON.parse(body);
    if(obj.success == "false") {
      errors.push({error: "captcha", msg: "Captcha: Are you sure your human? If so try again!"});
    }

    // validate fields.
    req.assert('firstname', "First name is invalid. Valid characters are: a-z A-Z 0-9 space & / . ( ) - , '").isValidName();
    req.assert('firstname', "First is too long. Max is 35.").maxLength(35);

    req.assert('lastname', "Last name is invalid. Valid characters are: a-z A-Z 0-9 space & / . ( ) - , '").isValidName();
    req.assert('lastname', "Last is too long. Max is 35.").maxLength(35);

    if(!address1 == '') {
      req.assert('address1', "Address 1 is invalid. Valid characters are: a-z A-Z 0-9 space # . , ; : '").isValidAddress();
      req.assert('address1', "Address 1 is too long.").maxLength(50);

    }
    if(!address2 == '') {
      req.assert('address2', "Address 2 is invalid. Valid characters are: a-z A-Z 0-9 space # . , ; : '").isValidAddress();
      req.assert('address2', "Address 2 is too long.").maxLength(50);
    }
    if(!city == '') {
      req.assert('city', "City is invalid. Valid characters are: a-z A-Z 0-9 space - , . ; ' & / ( )").isValidCityTown();
      req.assert('city', "Address 1 is too long.").maxLength(25);
    }
    if(!zip == '') {
      req.assert('zip', "Zip code is invalid or wrong format. Valid characters are: 0-9 - format: ##### or #####-####").isValidZip();
    }

    errors = req.validationErrors();

    // If any errors render with error messages.
    if ( errors.length > 0) {
      res.render("register", {
        title: "Register",
        message: '',
        errors: errors,
        usstates: getStates(),
        cssfile: 'register',
        post: req.body
      });
    }
    else {
      // No errors found. Continue with putting data in to db.
      // Set collection
      var collection = db.get('usercollection');

      // Submit to db

      collection.insert({
        "firstname" : firstName,
        "lastname" : lastName,
        "address1" : address1,
        "address2" : address2,
        "city" : city,
        "state" : state,
        "zip" : zip,
        "country" : country,
        "date" : ts
      }, function (err, doc) {
        if (err) {
          // if fail return error
          errors.push({error: "db", msg: "Sorry your registration in down. Please try again later."});
          res.render("register", {
            title: "Register",
            message: '',
            errors: errors,
            usstates: getStates(),
            cssfile: 'register'
          });
          res.send("There was a problem!");
        }
        else { // if no error on putting data into db then show confirm page.
          res.render('confirm', {
            title: "Confirmation",
            name: firstName,
            cssfile: 'confirm'
          });
        }
      });
    }
  });


});

function cleanInput(input) {
  var output = input;
  output = validator.stripLow(output);
  output = validator.escape(output);
  output = validator.trim(output);
  output = validator.blacklist(output, '\\[\\]');
  return output;
}

function getStates() {
  var states = [ {'val': '', 'statename': 'Select One'},
         {'val': 'AK', 'statename': 'Alaska'},
         {'val': 'AL', 'statename': 'Alabama'},
         {'val': 'AR', 'statename': 'Arkansas'},
         {'val': 'AZ', 'statename': 'Arizona'},
         {'val': 'CA', 'statename': 'California'},
         {'val': 'CO', 'statename': 'Colorado'},
         {'val': 'CT', 'statename': 'Connecticut'},
         {'val': 'DE', 'statename': 'Delaware'},
         {'val': 'FL', 'statename': 'Florida'},
         {'val': 'GA', 'statename': 'Georgia'},
         {'val': 'HI', 'statename': 'Hawaii'},
         {'val': 'IA', 'statename': 'Iowa'},
         {'val': 'ID', 'statename': 'Idaho'},
         {'val': 'IL', 'statename': 'Illinois'},
         {'val': 'IN', 'statename': 'Indiana'},
         {'val': 'KS', 'statename': 'Kansas'},
         {'val': 'KY', 'statename': 'Kentucky'},
         {'val': 'LA', 'statename': 'Louisiana'},
         {'val': 'MA', 'statename': 'Massachusetts'},
         {'val': 'MD', 'statename': 'Maryland'},
         {'val': 'ME', 'statename': 'Maine'},
         {'val': 'MI', 'statename': 'Michigan'},
         {'val': 'MN', 'statename': 'Minnesota'},
         {'val': 'MO', 'statename': 'Missouri'},
         {'val': 'MS', 'statename': 'Mississippi'},
         {'val': 'MT', 'statename': 'Montana'},
         {'val': 'NC', 'statename': 'NorthCarolina'},
         {'val': 'ND', 'statename': 'NorthDakota'},
         {'val': 'NE', 'statename': 'Nebraska'},
         {'val': 'NH', 'statename': 'NewHampshire'},
         {'val': 'NJ', 'statename': 'NewJersey'},
         {'val': 'NM', 'statename': 'NewMexico'},
         {'val': 'NV', 'statename': 'Nevada'},
         {'val': 'NY', 'statename': 'NewYork'},
         {'val': 'OH', 'statename': 'Ohio'},
         {'val': 'OK', 'statename': 'Oklahoma'},
         {'val': 'OR', 'statename': 'Oregon'},
         {'val': 'PA', 'statename': 'Pennsylvania'},
         {'val': 'RI', 'statename': 'RhodeIsland'},
         {'val': 'SC', 'statename': 'SouthCarolina'},
         {'val': 'SD', 'statename': 'SouthDakota'},
         {'val': 'TN', 'statename': 'Tennessee'},
         {'val': 'TX', 'statename': 'Texas'},
         {'val': 'UT', 'statename': 'Utah'},
         {'val': 'VA', 'statename': 'Virginia'},
         {'val': 'VT', 'statename': 'Vermont'},
         {'val': 'WA', 'statename': 'Washington'},
         {'val': 'WI', 'statename': 'Wisconsin'},
         {'val': 'WV', 'statename': 'WestVirginia'},
         {'val': 'WY', 'statename': 'Wyoming'} ];
  return states;
}

module.exports = router;
