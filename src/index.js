
const admin = require('firebase-admin');
const serviceAccount = require('../config/mspr-payetonkawa-58875-73430-firebase-adminsdk-6zken-50aba7c0a3.json'); // Téléchargez ce fichier depuis la console Firebase

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;
const express = require('express')
//const db = require('./firebase.js'); // Importez votre fichier firebase.js

const app = express()
const port = 8080


/* app.use(express.json());

app.post('/add', async (req, res) => {
    try {
        const docRef = await db.collection('collection-name').add(req.body);
        res.status(200).send('Document added with ID: ' + docRef.id);
    } catch (error) {
        res.status(500).send('Error adding document: ' + error.message);
    }
});
 */
// Ajoutez d'autres routes et logiques ici


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

/* const express = require('express')
const app = express()
const port = 8080

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
}) */