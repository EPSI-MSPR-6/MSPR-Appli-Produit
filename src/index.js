const express = require('express')
const bodyParser = require('body-parser');
require('dotenv').config();
const routes = require('./routes/products.js');
const app = express()
const port = 8081

app.use(bodyParser.json());
app.use('/products', routes);

app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API Produits');
});

app.listen(port, () => {
    console.log(`API Produits en écoute sur le port ${port}`);
});