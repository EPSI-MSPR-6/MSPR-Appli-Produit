const express = require('express')
const db = require('./firebase'); // Importez votre fichier firebase.js

const app = express()
const port = 8080


app.use(express.json());

app.post('/add', async (req, res) => {
    try {
        const docRef = await db.collection('collection-name').add(req.body);
        res.status(200).send('Document added with ID: ' + docRef.id);
    } catch (error) {
        res.status(500).send('Error adding document: ' + error.message);
    }
});

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