const db = require('../firebase'); 
const { v4: uuidv4 } = require('uuid');

// Middleware pour valider les champs du produit lors de la création
const validateCreateProduct = (req, res, next) => {
    const { nom, description, prix, quantite_stock } = req.body;
    if (!nom || !description || !prix || !quantite_stock) {
        return res.status(400).send('Les champs nom, description, prix, et quantite_stock sont obligatoires.');
    }
    if (typeof nom !== 'string' || typeof description !== 'string' || typeof prix !== 'number' || typeof quantite_stock !== 'number') {
        return res.status(400).send('Les types de champs sont incorrects.');
    }
    next();
};

const validateUpdateProduct = (req, res, next) => {
    const { nom, description, prix, quantite_stock } = req.body;
    if (req.body.id_produit) {
        return res.status(400).send("Le champ id_produit ne peut pas être modifié.");
    }
    if (nom && typeof nom !== 'string') {
        return res.status(400).send('Le champ nom doit être une chaîne de caractères.');
    }
    if (description && typeof description !== 'string') {
        return res.status(400).send('Le champ description doit être une chaîne de caractères.');
    }
    if (prix && typeof prix !== 'number') {
        return res.status(400).send('Le champ prix doit être un nombre.');
    }
    if (quantite_stock && typeof quantite_stock !== 'number') {
        return res.status(400).send('Le champ quantite_stock doit être un nombre.');
    }
    next();
};

exports.getAllProducts = async (req, res) => {
    try {
        const productsSnapshot = await db.collection('products').get();
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(products);
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des produits : ' + error.message);
    }
};

exports.getProductById = async (req, res) => {
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
};

exports.createProduct = [validateCreateProduct, async (req, res) => {
    try {
        const newProduct = {
            id: uuidv4(),
            nom: req.body.nom,
            description: req.body.description,
            prix: req.body.prix,
            quantite_stock: req.body.quantite_stock
        };
        const docRef = await db.collection('products').doc(newProduct.id).set(newProduct);
        res.status(201).send('Produit créé avec son ID : ' + newProduct.id);
    } catch (error) {
        res.status(500).send('Erreur lors de la création du produit : ' + error.message);
    }
}];

exports.updateProduct = [validateUpdateProduct, async (req, res) => {
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
}];

exports.deleteProduct = async (req, res) => {
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
};
