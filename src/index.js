import express, { json } from 'express';
import db from './firebase'; // Importez votre fichier firebase.js

const app = express()
//const port = 8080


app.use(json());

app.post('/add', async (req, res) => {
    try {
        const docRef = await db.collection('collection-name').add(req.body);
        res.status(200).send('Document added with ID: ' + docRef.id);
    } catch (error) {
        res.status(500).send('Error adding document: ' + error.message);
    }
});

// Ajoutez d'autres routes et logiques ici

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});