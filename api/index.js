const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

app.use(express.json());

const file = path.join(__dirname, '../products.json');

const PASSWORD = process.env.ADMIN_PASSWORD || 'CHANGE-ME-1234';
const sessions = new Set();

function read() {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function write(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');

  if (!sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

// Login
app.post('/api/login', (req, res) => {
  if (req.body.password !== PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  sessions.add(token);

  res.json({ token });
});

// Products
app.get('/api/products', (req, res) => {
  try {
    res.json(read());
  } catch (error) {
    res.status(500).json({ error: 'Could not load products' });
  }
});

app.post('/api/products', auth, (req, res) => {
  const products = read();
  const product = {
    id: Date.now(),
    ...req.body
  };

  products.push(product);
  write(products);

  res.json(product);
});

app.put('/api/products/:id', auth, (req, res) => {
  const products = read();
  const index = products.findIndex(
    x => String(x.id) === req.params.id
  );

  if (index < 0) {
    return res.sendStatus(404);
  }

  products[index] = {
    ...products[index],
    ...req.body,
    id: products[index].id
  };

  write(products);

  res.json(products[index]);
});

app.delete('/api/products/:id', auth, (req, res) => {
  const products = read().filter(
    x => String(x.id) !== req.params.id
  );

  write(products);

  res.sendStatus(204);
});

// Customer page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

module.exports = app;
