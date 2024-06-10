const db = require('../firebase');
const { v4: uuidv4 } = require('uuid');

// Regex pour la validation
const nameRegex = /^[a-zA-Z\s'-]+$/;
const descriptionRegex = /^[a-zA-Z0-9\s,'-]+$/;

const validateProductFields = (product, isUpdate = false) => {
    const { nom, description, prix, quantite_stock } = product;

    if (!isUpdate && (!nom || !description || !prix || !quantite_stock)) {
        return 'Les champs nom, description, prix, et quantite_stock sont obligatoires.';
    }
    if (nom && (typeof nom !== 'string' || !nameRegex.test(nom))) {
        return 'Le champ nom contient des caractères invalides.';
    }
    if (description && (typeof description !== 'string' || !descriptionRegex.test(description))) {
        return 'Le champ description contient des caractères invalides.';
    }
    if (prix && (typeof prix !== 'number' || prix <= 0)) {
        return 'Le champ prix doit être un nombre positif.';
    }
    if (quantite_stock && (typeof quantite_stock !== 'number' || quantite_stock < 0)) {
        return 'Le champ quantite_stock doit être un nombre positif.';
    }
    return null;
};

const validateCreateProduct = (req, res, next) => {
    const errorMessage = validateProductFields(req.body);
    if (errorMessage) {
        return res.status(400).send(errorMessage);
    }
    next();
};

const validateUpdateProduct = (req, res, next) => {
    if (req.body.id_produit) {
        return res.status(400).send("Le champ id_produit ne peut pas être modifié.");
    }
    const errorMessage = validateProductFields(req.body, true);
    if (errorMessage) {
        return res.status(400).send(errorMessage);
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
        await db.collection('products').doc(newProduct.id).set(newProduct);
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
