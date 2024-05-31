const admin = require('firebase-admin');
const serviceAccount = require('./config/mspr-payetonkawa-58875-73430-firebase-adminsdk-6zken-50aba7c0a3.json'); // Téléchargez ce fichier depuis la console Firebase

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://your-database-name.firebaseio.com"
});

const db = admin.firestore();

module.exports = db;
