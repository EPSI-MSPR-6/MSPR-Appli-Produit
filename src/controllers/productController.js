const db = require('../firebase'); 
const { v4: uuidv4 } = require('uuid');

exports.getAllProducts = async (req, res) => {
    try {
        const productsSnapshot = await db.collection('products').get();
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(products);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.getProductById = async (req, res) => {
    try {
        const productDoc = await db.collection('products').doc(req.params.id).get();
        if (productDoc.exists) {
            res.json({ id: productDoc.id, ...productDoc.data() });
        } else {
            res.status(404).send('Produit non trouvé');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.createProduct = async (req, res) => {
    try {
        const newProduct = {
            id: uuidv4(),
            ...req.body
        };
        await db.collection('products').doc(newProduct.id).set(newProduct);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const productRef = db.collection('products').doc(req.params.id);
        await productRef.update(req.body);
        res.json(req.body);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await db.collection('products').doc(req.params.id).delete();
        res.status(204).send();
    } catch (error) {
        res.status(500).send(error.message);
    }
};
