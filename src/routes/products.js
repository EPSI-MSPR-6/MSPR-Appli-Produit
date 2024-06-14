const express = require('express');
const router = express.Router();
const db = require('../firebase.js');
const { v4: uuidv4 } = require('uuid');
const { validateCreateProduct, validateUpdateProduct, checkApiKey } = require('../services/middlewares.js');
const { publishMessage } = require('../services/pubsub.js');

// Vérification Doublons
const checkDuplicateProduct = async (nom, description) => {
    const productsSnapshot = await db.collection('products')
        .where('nom', '==', nom)
        .where('description', '==', description)
        .get();
    return !productsSnapshot.empty;
};

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
        const { nom, description, prix, quantite_stock } = req.body;

        const isDuplicate = await checkDuplicateProduct(nom, description);
        if (isDuplicate) {
            return res.status(400).send('Un produit avec le même nom et la même description existe déjà.');
        }

        const newProduct = {
            id: uuidv4(),
            nom: nom,
            description: description,
            prix: prix,
            quantite_stock: quantite_stock
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
            const isDuplicate = await checkDuplicateProduct(updatedProduct.nom, updatedProduct.description);
            if (isDuplicate) {
                return res.status(400).send('Les modifications feraient conflit avec un autre produit.');
            }
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

// Endpoint Pub/Sub
router.post('/pubsub', async (req, res) => {
    const message = req.body.message;

    if (!message || !message.data) {
        return res.status(400).send('Format de message non valide');
    }

    const data = Buffer.from(message.data, 'base64').toString();
    const parsedData = JSON.parse(data);
    console.log('Parsed message data', parsedData);
    if (parsedData.action === 'CREATE_ORDER') {
        await handleCreateOrder(parsedData, res);
    } else {
        res.status(400).send('Action non reconnue');
    }
});


async function handleCreateOrder(order, res) {
    try {
        const { orderId, productId, quantity } = order;

        if (!orderId || !productId || !quantity) {
            return res.status(400).send('Données de commande manquantes');
        }

        const productRef = db.collection('products').doc(productId);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
            await publishOrderConfirmation(orderId, 0, 'Annulé (Produit non trouvé)', res);
            return;
        }

        const productData = productDoc.data();
        if (quantity > productData.quantite_stock) {
            await publishOrderConfirmation(orderId, 0, 'Annulé (Quantité trop importante)', res);
        } else {
            const newQuantity = productData.quantite_stock - quantity;
            await productRef.update({ quantite_stock: newQuantity });
            const totalPrice = productData.prix * quantity;
            await publishOrderConfirmation(orderId, totalPrice, 'En cours', res);
        }
    } catch (error) {
        res.status(500).send(`Erreur lors du traitement de la commande ${order.orderId}`);
    }
}

async function publishOrderConfirmation(orderId, price, status, res) {
    try {
        await publishMessage('product-actions', {
            action: 'ORDER_CONFIRMATION',
            orderId: orderId,
            price: price,
            status: status,
            message: `Order ${status}`
        });
        res.status(200).send(`Confirmation de la commande ${orderId} publiée avec le statut: ${status}`);
    } catch (error) {
        res.status(500).send(`Erreur lors de la publication de la confirmation de la commande ${orderId}`);
    }
}

module.exports = router;
