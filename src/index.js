const express = require('express')
const db = require('./firebase.js');
const bodyParser = require('body-parser');
const routes = require('./routes/products.js');

require('dotenv').config();

const app = express()
const port = 8080

app.use(bodyParser.json());
app.use('/products', routes);


app.listen(port, () => {
    console.log(`API Produits en écoute sur le port ${port}`);
});