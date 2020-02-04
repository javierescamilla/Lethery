let express = require("express");
let morgan = require("morgan");
let mongoose = require("mongoose");
let uuid = require("uuid4");
let AWS = require("aws-sdk");
let app = express();
let bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
const saltRounds = 10;
let jsonParser = bodyParser.json();

let { UserMethods } = require("./users/user-model");
let { ProductMethods } = require("./products/products-model");
let { OrderMethods } = require("./orders/order-model");
let { DATABASE_URL, PORT } = require("./config");

const s3 = new AWS.S3();

mongoose.Promise = global.Promise;

app.use(express.static("public"));
app.use(morgan("dev"));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
  if (req.method === "OPTIONS") {
  return res.send(204);
  }
  next();
 });

function encryptPassword(password) {
  var salt = bcrypt.genSaltSync(saltRounds);
  var hash = bcrypt.hashSync(password, salt);
  return hash;
}

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

app.get("/products", (req, res) => {
  const { category, name, minRange, maxRange, newest } = req.query;
  const PRODUCTS_PER_PAGE = 6
  let params = {};
  let priceRange = {};
  if (category) {
    params["category"] = category;
  }
  if (name) {
    params["name"] = name;
  }
  if (minRange) {
    priceRange["$gte"] = minRange;
    params["price"] = priceRange;
  }
  if (maxRange) {
    priceRange["$lte"] = maxRange;
    params["price"] = priceRange;
  }
  if (minRange & maxRange) {
    params["price"] = priceRange;
  }
  if(newest){
    ProductMethods.getNumberOfProducts(PRODUCTS_PER_PAGE)
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

app.get("/orders", (req, res) => {
  let params = {};
  let token = req.headers.authorization;
  token = token.split(" ")

  let decoded

  try {
    decoded = jwt.verify(token[1], 'gsfbsandfkams75rfdkjne28ednks');
    console.log(decoded)
  } catch(err) {
    return res.status(406).json({
      message: "Invalid token",
      status: 406
    });
  }

  let userId = decoded['userId']

  if (!userId) {
    res.statusMessage = "Missing userId";
    return res.status(406).json({
      message: "Missing userId",
      status: 406
    });
  }
  params["userId"] = userId;
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
});

app.post("/users", jsonParser, (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let isAdmin = req.body.isAdmin;
  let shippingAddress = req.body.shippingAddress;
  let shippingZipCode = req.body.shippingZipCode;
  let shippingCity = req.body.shippingCity;
  let shippingState = req.body.shippingState;
  let shippingCountry = req.body.shippingCountry;

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
    isAdmin : isAdmin,
    shippingAddress: shippingAddress,
    shippingZipCode: shippingZipCode,
    shippingCity: shippingCity,
    shippingState: shippingState,
    shippingCountry: shippingCountry
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
  let token = req.headers.authorization;
  token = token.split(" ")

  try {
    var decoded = jwt.verify(token[1], 'gsfbsandfkams75rfdkjne28ednks');
    console.log(decoded)
  } catch(err) {
    return res.status(406).json({
      message: "Invalid token",
      status: 406
    });
  }

  if(decoded['isAdmin'] != true){
    return res.status(406).json({
      message: "User must have admin privileges",
      status: 406
    });
  }

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
  let items = req.body.items;
  let total = req.body.total;
  let timestamp = req.body.timestamp;
  let token = req.headers.authorization;
  token = token.split(" ")

  let decoded

  try {
    decoded = jwt.verify(token[1], 'gsfbsandfkams75rfdkjne28ednks');
  } catch(err) {
    return res.status(406).json({
      message: "Invalid token",
      status: 406
    });
  }

  let userId = decoded['userId']

  let newOrder = {
    userId: userId,
    items: {
      productId: items["productId"],
      price: items["price"],
      name: items["name"],
      category: items["category"],
      description: items["description"],
      imageUrl: items["imageUrl"],
      color: items["color"],
      ammount: items["ammount"]
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
      console.log(err);
      return res.status(500).json({
        error: "Something went wrong with the data base",
        status: 500
      });
    });
});

app.put("/users/:userId", jsonParser, (req, res) => {
  let updatedUserId = req.params.userId;

  if (!updatedUserId) {
    res.statusMessage = "Missing userId";
    return res.status(406).json({
      error: "Missing userId",
      status: 406
    });
  }

  UserMethods.modifyUserInfo({ userId: updatedUserId }, req.body)
    .then(userResponse => {
      res.status(201).json(userResponse);
    })
    .catch(err => {
      res.statusMessage = "Something went wrong with the data base";
      return res.status(500).json({
        error: "Something went wrong with the data base",
        status: 500
      });
    });
});

app.put("/products/:productId", jsonParser, (req, res) => {
  let updatedProductId = req.params.productId;

  if (!updatedProductId) {
    res.statusMessage = "Missing productId";
    return res.status(406).json({
      error: "Missing productId",
      status: 406
    });
  }

  ProductMethods.modifyProduct({ productId: updatedProductId }, req.body)
    .then(productResponse => {
      res.status(201).json(productResponse);
    })
    .catch(err => {
      res.statusMessage = "Something went wrong with the data base";
      return res.status(500).json({
        error: "Something went wrong with the data base",
        status: 500
      });
    });
});

app.delete("/users/:userId", (req, res) => {
  let userId = req.params.userId;
  if (!userId) {
    res.statusMessage = "Missing field id";
    return res.status(406).json({
      error: "Missing id",
      status: 406
    });
  }
  UserMethods.deleteUser({ userId: userId })
    .then(userResponse => {
      res.status(201).json(userResponse);
    })
    .catch(err => {
      res.statusMessage = "Something went wrong with the data base";
      return res.status(500).json({
        error: "Something went wrong with the data base",
        status: 500
      });
    });
});

app.delete("/products/:productId", (req, res) => {
  let productId = req.params.productId;
  let token = req.headers.authorization;
  token = token.split(" ")

  try {
    var decoded = jwt.verify(token[1], 'gsfbsandfkams75rfdkjne28ednks');
    console.log(decoded)
  } catch(err) {
    return res.status(406).json({
      message: "Invalid token",
      status: 406
    });
  }

  if(decoded['isAdmin'] != true){
    return res.status(406).json({
      message: "User must have admin privileges",
      status: 406
    });
  }
  if (!productId) {
    res.statusMessage = "Missing field id";
    return res.status(406).json({
      error: "Missing id",
      status: 406
    });
  }
  ProductMethods.deleteProduct({ productId: productId })
    .then(productResponse => {
      res.status(201).json(productResponse);
    })
    .catch(err => {
      res.statusMessage = "Something went wrong with the data base";
      return res.status(500).json({
        error: "Something went wrong with the data base",
        status: 500
      });
    });
});

app.post("/login", jsonParser, (req, res) => {
  let email = req.body.email;
  let typedPassword = req.body.password;
  var privateKey = "gsfbsandfkams75rfdkjne28ednks";
  //var MINUTE = 60;
  //let privateKey = process.environ.privateKey;

  UserMethods.getUser({ email: email })
    .then(userResponse => {
      let hash = userResponse["password"];
      let userId = userResponse["userId"];
      let isAdmin = !!userResponse["isAdmin"];
      let user = {
        userId: userId,
        isAdmin: isAdmin,
      };
      console.log(user)
      var token = jwt.sign(user, privateKey, { expiresIn: '3000s' });
      let object = {
        token : token,
        isAdmin: isAdmin
      }
      let status = bcrypt.compareSync(typedPassword, hash);
      if (status) {
        return res.status(200).json(object);
      } else {
        res.statusMessage = "Wrong password"
        return res.status(401).send()
      }
    })
    .catch(err => {
      res.statusMessage = "The user does not exist";
      return res.status(500).json({
        error: "The user does not exist",
        status: 500
      });
    });
});

app.get("/s3-signed-url", (req, res) => {
  const { imageName } = req.query;

  if (!imageName) {
    res.statusMessage = "The imageName parameter is required";
    return res.status(406).send();
  }

  const params = {
    Bucket: "final-project-web-dev",
    Key: `images/${imageName}`,
    ContentType: "image/*",
    Expires: 300
  };

  s3.getSignedUrlPromise("putObject", params)
    .then(url => res.status(201).json({ url }))
    .catch(err => {
      res.statusMessage = "Internal server error";
      return res.status(501).send();
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
