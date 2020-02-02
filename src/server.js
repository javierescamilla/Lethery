let express = require("express");
let morgan = require("morgan");
let mongoose = require("mongoose");
let uuid = require("uuid4");
let app = express();
let bodyParser = require("body-parser");
let jsonParser = bodyParser.json();

let { UserMethods } = require("./users/user-model");
let { DATABASE_URL, PORT } = require("./config");

mongoose.Promise = global.Promise;

app.use(express.static("public"));
app.use(morgan("dev"));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/users/:userId", (req, res) => {
  let userId = req.params.userId;
  UserMethods.getUser({ userId: userId })
    .then(userResponse => {
      return res.status(200).json(userResponse);
    })
    .catch(error => {
      res.statusMessage = "Something went wrong with the DB. Try again later.";
      return res.status(500).json({
        status: 500,
        message: "Something went wrong with the DB. Try again later."
      });
    });
});

app.post("/users", jsonParser, (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let shippingAddress = req.body.shippingAddress;
  let shippingZipCode = req.body.shippingZipCode;
  let shippingCity = req.body.shippingCity;
  let shippingState = req.body.shippingState;
  let shippingCountry = req.body.shippingCountry;
  let billingAddress = req.body.billingAddress;
  let billingZipCode = req.body.billingZipCode;
  let billingCity = req.body.billingCity;
  let billingState = req.body.billingState;
  let billingCountry = req.body.billingCountry;

  if (!email | !password | !firstName | !lastName) {
    res.statusMessage = "Missing field in body";
    return res.status(406).json({
      message: "Missing field in body",
      status: 406
    });
  }

  let newUser = {
    userId: uuid(),
    email: email,
    password: password,
    firstName: firstName,
    lastName: lastName,
    shippingAddress: shippingAddress,
    shippingZipCode: shippingZipCode,
    shippingCity: shippingCity,
    shippingState: shippingState,
    shippingCountry: shippingCountry,
    billingAddress: billingAddress,
    billingZipCode: billingZipCode,
    billingCity: billingCity,
    billingState: billingState,
    billingCountry: billingCountry
  };
  console.log();
  UserMethods.postUser(newUser)
    .then(userResponse => {
      return res.status(201).json(userResponse);
    })
    .catch(err => {
      res.statusMessage = "Something went wrong with the data base";
      return res.status(500).json({
        error: "Something went wrong with the data base",
        status: 500
      });
    });
});

let server;

function runServer(port, databaseUrl) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, response => {
      if (response) {
        return reject(response);
      } else {
        server = app
          .listen(port, () => {
            console.log("App is running on port " + port);
            resolve();
          })
          .on("error", err => {
            mongoose.disconnect();
            return reject(err);
          });
      }
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing the server");
      server.close(err => {
        if (err) {
          return reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

runServer(PORT, DATABASE_URL).catch(err => {
  console.log(err);
});

module.exports = { app, runServer, closeServer };
