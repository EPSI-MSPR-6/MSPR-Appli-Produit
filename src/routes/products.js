const express = require('express');
const router = express.Router();
const db = require('../firebase.js');
const { v4: uuidv4 } = require('uuid');
const { validateCreateProduct, validateUpdateProduct, checkApiKey } = require('../services/middlewares.js');

// Récupération de tous les produits
router.get('/', async (req, res) => {
    try {
        const productsSnapshot = await db.collection('products').get();
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(products);
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des produits : ' + error.message);
    }
});

// Récupération d'un produit via son ID
router.get('/:id', async (req, res) => {
    try {
        const productDoc = await db.collection('products').doc(req.params.id).get();
        if (productDoc.exists) {
            res.status(200).json({ id: productDoc.id, ...productDoc.data() });
        } else {
            res.status(404).send('Produit non trouvé');
        }
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération du produit par ID : ' + error.message);
    }
});

// Création d'un produit
router.post('/', checkApiKey, validateCreateProduct, async (req, res) => {
    try {
        const newProduct = {
            id: uuidv4(),
            nom: req.body.nom,
            description: req.body.description,
            prix: req.body.prix,
            quantite_stock: req.body.quantite_stock
        };
        await db.collection('products').doc(newProduct.id).set(newProduct);
        res.status(201).send('Produit créé avec son ID : ' + newProduct.id);
    } catch (error) {
        res.status(500).send('Erreur lors de la création du produit : ' + error.message);
    }
});

// Mise à jour d'un produit
router.put('/:id', checkApiKey, validateUpdateProduct, async (req, res) => {
    try {
        const productRef = db.collection('products').doc(req.params.id);
        const productDoc = await productRef.get();
        if (!productDoc.exists) {
            res.status(404).send('Produit non trouvé');
        } else {
            const updatedProduct = req.body;
            await productRef.set(updatedProduct, { merge: true });
            res.status(200).send('Produit mis à jour');
        }
    } catch (error) {
        res.status(500).send('Erreur lors de la mise à jour du produit : ' + error.message);
    }
});

// Suppression d'un produit
router.delete('/:id', checkApiKey, async (req, res) => {
    try {
        const productDoc = await db.collection('products').doc(req.params.id).get();
        if (!productDoc.exists) {
            res.status(404).send('Produit non trouvé');
        } else {
            await db.collection('products').doc(req.params.id).delete();
            res.status(200).send('Produit supprimé');
        }
    } catch (error) {
        res.status(500).send('Erreur lors de la suppression du produit : ' + error.message);
    }
});

module.exports = router;