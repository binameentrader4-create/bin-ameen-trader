const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

app.use(express.json());

const productsFile = path.join(__dirname, "../products.json");

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "CHANGE-ME-1234";

const sessions = new Set();

function readProducts() {
  try {
    return JSON.parse(fs.readFileSync(productsFile, "utf8"));
  } catch (error) {
    return [];
  }
}

function writeProducts(products) {
  fs.writeFileSync(
    productsFile,
    JSON.stringify(products, null, 2)
  );
}

function auth(req, res, next) {
  const token = (req.headers.authorization || "")
    .replace("Bearer ", "")
    .trim();

  if (!sessions.has(token)) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  next();
}

/* LOGIN */
app.post("/api/login", (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      error: "Wrong password"
    });
  }

  const token = crypto.randomBytes(24).toString("hex");

  sessions.add(token);

  res.json({
    token
  });
});

/* GET PRODUCTS */
app.get("/api/products", (req, res) => {
  res.json(readProducts());
});

/* ADD PRODUCT */
app.post("/api/products", auth, (req, res) => {
  const products = readProducts();

  const product = {
    id: Date.now(),
    ...req.body
  };

  products.push(product);

  writeProducts(products);

  res.json(product);
});

/* EDIT PRODUCT */
app.put("/api/products/:id", auth, (req, res) => {
  const products = readProducts();

  const index = products.findIndex(
    product => String(product.id) === String(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({
      error: "Product not found"
    });
  }

  products[index] = {
    ...products[index],
    ...req.body,
    id: products[index].id
  };

  writeProducts(products);

  res.json(products[index]);
});

/* DELETE PRODUCT */
app.delete("/api/products/:id", auth, (req, res) => {
  const products = readProducts().filter(
    product => String(product.id) !== String(req.params.id)
  );

  writeProducts(products);

  res.status(204).end();
});

/* CUSTOMER PAGE */
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/index.html")
  );
});

/* ADMIN PAGE */
app.get("/admin", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/admin.html")
  );
});

module.exports = app;
