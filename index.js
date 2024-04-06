const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("./db/config");
const users = require("./db/users");
const product = require("./db/product");
const app = express();
const jwtkey = "e-comm";

app.use(express.json());
app.use(cors());

app.post("/register", async (req, resp) => {
  let data = await users(req.body);
  let result = await data.save();
  result = result.toObject();
  delete result.password;
  jwt.sign({ result }, jwtkey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      return resp.send(
        "Something went wrong. Please try again after some time!"
      );
    }
    return resp.send({ result, auth: token });
  });
});

app.post("/login", async (req, resp) => {
  try {
    let data = await users.findOne(req.body).select("-password");
    if (req.body.email && req.body.password) {
      if (data) {
        jwt.sign({ data }, jwtkey, { expiresIn: "2h" }, (err, token) => {
          if (err) {
            return resp.send(
              "Something went wrong. Please try again after some time!"
            );
          }
          return resp.send({ data, auth: token });
        });
      }
    } else {
      return resp.send("No user found");
    }
  } catch (error) {
    return resp.send("Internal server errro ");
  }
});

app.post("/add-product", async (req, resp) => {
  let data = new product(req.body);
  let result = await data.save();
  resp.send(result);
});

app.get("/products", async (req, resp) => {
  let data = await product.find();
  if (data.length > 0) {
    resp.send(data);
  } else {
    resp.send("No product found");
  }
});

app.delete("/product/:id", async (req, resp) => {
  let data = await product.deleteOne({ _id: req.params.id });
  resp.send(data);
});

app.get("/product/:id", async (req, resp) => {
  try {
    let product_data = await product.findOne({ _id: req.params.id });
    if (product_data) {
      return resp.send({
        success: true,
        mesaage: "Data found",
        data: product_data,
      });
    } else {
      return resp.send({ success: false, message: "No data found" });
    }
  } catch (error) {
    console.log(error);
    return resp.json({ message: "Internal server error" });
  }
});

app.put("/product/:id", async (req, resp) => {
  let data = await product.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  resp.send(data);
});

app.get("/search/:key", async (req, resp) => {
  let result = await product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
    ],
  });
  resp.send(result);
});

function verifyToken(req, resp, next) {
  let token = req.headers["Authorization"];
  if (token) {
    token = token.split(" ")[1];
    console.log("middleware called if", token);
    jwt.verify(token, jwtkey, (err, valid) => {
      if (err) {
        resp.status(401).send("Please provide valid token");
      } else {
        next();
      }
    });
  } else {
    resp.status(403).send("Please add token with header");
  }
}

app.listen(5500, () => {
  console.log("Server is running on port", 5500);
});
