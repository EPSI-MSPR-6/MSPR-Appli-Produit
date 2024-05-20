import { initializeApp, credential as _credential, firestore } from 'firebase-admin';
import serviceAccount from './config/mspr-payetonkawa-58875-73430-firebase-adminsdk-6zken-50aba7c0a3.json'; // Téléchargez ce fichier depuis la console Firebase

initializeApp({
    credential: _credential.cert(serviceAccount),
    databaseURL: 'https://mspr-payetonkawa-58875-73430.firebaseio.com' // Remplacez <PROJECT_ID> par votre ID de projet
});

const db = firestore();

export default db;
