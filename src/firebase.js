const admin = require('firebase-admin');
const serviceAccount = require('./mspr-payetonkawa-58875-73430-firebase-adminsdk-6zken-50aba7c0a3.json'); // Téléchargez ce fichier depuis la console Firebase

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://mspr-payetonkawa-58875-73430.firebaseio.com' // Remplacez <PROJECT_ID> par votre ID de projet
});

const db = admin.firestore();

module.exports = db;