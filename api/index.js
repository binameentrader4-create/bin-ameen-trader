const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("BIN AMEEN TRADER API is working");
});

app.get("/products", (req, res) => {
  res.json([]);
});

module.exports = app;
