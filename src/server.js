let express = require("express");
let morgan = require("morgan");
let mongoose = require("mongoose");
let uuid = require("uuid4");
let app = express();
let bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
let jsw = require('jsonwebtoken')
const saltRounds = 10;
let jsonParser = bodyParser.json();

let { UserMethods } = require("./users/user-model");
let { ProductMethods } = require("./products/products-model");
let { OrderMethods } = require("./orders/order-model");
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

function encryptPassword(password){
    var salt = bcrypt.genSaltSync(saltRounds);
    var hash = bcrypt.hashSync(password, salt);
    return hash;
}

app.get("/users/:userId", (req, res) => {
  let userId = req.params.userId;
  UserMethods.getUser({ userId : userId })
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

app.get("/products",(req, res) => {
    const {category, name, minRange, maxRange} = req.query
    let params = {}
    let priceRange = {}
    if(category){
        params['category'] = category
    }
    if(name){
        params['name'] = name
    }
    if(minRange){
        priceRange['$gt'] = minRange
        params['price'] = priceRange
    }
    if(maxRange){
        priceRange['$lt'] = maxRange
        params['price'] = priceRange
    }
    if(minRange & maxRange){
        params['price'] = priceRange
    }
    ProductMethods.getProducts(params)
      .then(productResponse => {
        return res.status(200).json(productResponse);
      })
      .catch(error => {
        res.statusMessage = "Something went wrong with the DB. Try again later.";
        return res.status(500).json({
          status: 500,
          message: "Something went wrong with the DB. Try again later."
        });
      });
  });

app.get("/orders/:userId", (req, res) =>{
    let userId = req.params.userId;
    let params = {}
    if(!userId){
        res.statusMessage = "Missing userId";
        return res.status(406).json({
          message: "Missing userId",
          status: 406
        });    
    }
    params['userId'] = userId;
    OrderMethods.getOrdersByUser(params)
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
})

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
    password: encryptPassword(password),
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

app.post("/products", jsonParser, (req, res) => {

    let price = req.body.price;
    let name = req.body.name;
    let category = req.body.category;
    let description = req.body.description;
    let imageUrl = req.body.imageUrl;
  
    if (!name) {
      res.statusMessage = "Missing field: name in body";
      return res.status(406).json({
        message: "Missing field: name in body",
        status: 406
      });
    }
  
    let newProduct = {
      productId: uuid(),
      price: price,
      name: name,
      category: category,
      description: description,
      imageUrl: imageUrl
    };
  
    ProductMethods.postProduct(newProduct)
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

app.post("/orders", jsonParser, (req, res) => {

    let userId = req.body.userId;
    let items = req.body.items;
    let total = req.body.total;
    let timestamp = req.body.timestamp;
  
    let newOrder = {
      userId: userId,
      items: {
        productId : items["productId"], 
        price : items["price"], 
        name : items["name"],
        category : items["category"],
        description : items["description"],
        imageUrl : items["imageUrl"],
        color : items["color"],
        ammount : items["ammount"]
      },
      total: total,
      timestamp: timestamp
    };
  
    OrderMethods.postSortedOrder(newOrder)
      .then(userResponse => {
        return res.status(201).json(userResponse);
      })
      .catch(err => {
        res.statusMessage = "Something went wrong with the data base";
        console.log(err)
        return res.status(500).json({
          error: "Something went wrong with the data base",
          status: 500
        });
      });
  });

app.put('/users/:userId', jsonParser, (req, res) => {
    let updatedUserId = req.params.userId;

    if(!updatedUserId){
        res.statusMessage = "Missing userId";
        return res.status(406).json({
           "error" : "Missing userId",
           "status" : 406
       });
    }

    UserMethods.modifyUserInfo({ userId : updatedUserId }, req.body)
       .then(userResponse => {
           res.status(201).json(userResponse);
       })
       .catch(err => {
           res.statusMessage = "Something went wrong with the data base";
           return res.status(500).json({
               "error" : "Something went wrong with the data base",
               "status" : 500
           });
       });
});

app.put('/products/:productId', jsonParser, (req, res) => {
    let updatedProductId = req.params.productId;

    if(!updatedProductId){
        res.statusMessage = "Missing productId";
        return res.status(406).json({
           "error" : "Missing productId",
           "status" : 406
       });
    }

    ProductMethods.modifyProduct({ productId : updatedProductId }, req.body)
       .then(productResponse => {
           res.status(201).json(productResponse);
       })
       .catch(err => {
           res.statusMessage = "Something went wrong with the data base";
           return res.status(500).json({
               "error" : "Something went wrong with the data base",
               "status" : 500
           });
       });
});

app.delete('/users/:userId', (req, res) => {
    let userId = req.params.userId;
    if(!userId){
        res.statusMessage = "Missing field id";
        return res.status(406).json({
           "error" : "Missing id",
           "status" : 406
       });
    }
    UserMethods.deleteUser({ userId : userId })
       .then(userResponse => {
           res.status(201).json(userResponse);
       })
       .catch(err => {
           res.statusMessage = "Something went wrong with the data base";
           return res.status(500).json({
               "error" : "Something went wrong with the data base",
               "status" : 500
           });
       });
});

app.delete('/products/:productId', (req, res) => {
    let productId = req.params.productId;
    if(!productId){
        res.statusMessage = "Missing field id";
        return res.status(406).json({
           "error" : "Missing id",
           "status" : 406
       });
    }
    ProductMethods.deleteProduct({ productId : productId })
       .then(productResponse => {
           res.status(201).json(productResponse);
       })
       .catch(err => {
           res.statusMessage = "Something went wrong with the data base";
           return res.status(500).json({
               "error" : "Something went wrong with the data base",
               "status" : 500
           });
       });
});

app.post("/login", jsonParser, (req, res) => {

    let email = req.body.email;
    let typedPassword = req.body.password;
  
    UserMethods.getUser({email : email})
      .then(userResponse => {
        let hash = userResponse['password']
        let status = bcrypt.compareSync(typedPassword, hash);
        return res.status(200).json(status);
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