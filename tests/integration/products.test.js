const request = require('supertest');
const express = require('express');
const productsRouter = require('../../src/controllers/productController.js');
const db = require('../../src/firebase.js');
const { setupFirebaseTestEnv, teardownFirebaseTestEnv } = require('../firebaseTestEnv.js');

require('dotenv').config({ path: '.env.test' });

const ApiKey = process.env.API_KEY;

const app = express();
app.use(express.json());
app.use('/products', productsRouter);

beforeAll(async () => {
    await setupFirebaseTestEnv();
});

afterAll(async () => {
    await teardownFirebaseTestEnv();
});

const getProductsWithApiKey = async (apiKey = ApiKey) => {
    return await request(app)
        .get('/products')
        .set('x-api-key', apiKey);
};

const createProduct = async (productData) => {
    return await request(app)
        .post('/products')
        .set('x-api-key', ApiKey)
        .send(productData);
};

const updateProduct = async (id, productData) => {
    return await request(app)
        .put(`/products/${id}`)
        .set('x-api-key', ApiKey)
        .send(productData);
};

const deleteProduct = async (id) => {
    return await request(app)
        .delete(`/products/${id}`)
        .set('x-api-key', ApiKey);
};

describe('Products API', () => {
    let productId;

    test('Création Produit', async () => {
        const response = await createProduct({ nom: 'Test Product', description: 'Description', prix: 100.0, quantite_stock: 50 });

        expect(response.status).toBe(201);
        expect(response.text).toMatch(/Produit créé avec son ID : /);

        productId = response.text.split('Produit créé avec son ID : ')[1];
    });

    test('Récupération de tous les produits', async () => {
        const response = await request(app).get('/products');
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
    });

    test('Récuparation Produit via ID', async () => {
        const response = await request(app).get(`/products/${productId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', productId);
    });

    test('Mis à jour Produit', async () => {
        const response = await updateProduct(productId, { nom: 'Updated Product', description: 'Updated Description', prix: 150.0, quantite_stock: 30 });
        expect(response.status).toBe(200);
        expect(response.text).toBe('Produit mis à jour');
    });

    test('Suppression Produit', async () => {
        const response = await deleteProduct(productId);
        expect(response.status).toBe(200);
        expect(response.text).toBe('Produit supprimé');
    });

    // Tests Erreurs 403
    describe('Tests403', () => {
        const invalidApiKey = 'invalid-api-key';
        test('Erreur_403_CreateProduct', async () => {
            const response = await request(app)
                .post('/products')
                .set('x-api-key', invalidApiKey)
                .send({ nom: 'Test Product', description: 'Description', prix: 100.0, quantite_stock: 50 });
            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('message', 'Forbidden: Invalid API Key');
        });

        test('Erreur_403_UpdateProduct', async () => {
            const response = await request(app)
                .put(`/products/${productId}`)
                .set('x-api-key', invalidApiKey)
                .send({ nom: 'Updated Product', description: 'Updated Description', prix: 150.0, quantite_stock: 30 });
            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('message', 'Forbidden: Invalid API Key');
        });

        test('Erreur_403_DeleteProduct', async () => {
            const response = await request(app)
                .delete(`/products/${productId}`)
                .set('x-api-key', invalidApiKey);
            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('message', 'Forbidden: Invalid API Key');
        });
    });

    // Tests Erreurs 404
    test('Erreur_404_GetProduct', async () => {
        const response = await request(app).get('/products/test');
        expect(response.status).toBe(404);
        expect(response.text).toBe('Produit non trouvé');
    });

    test('Erreur_404_UpdateProduct', async () => {
        const response = await updateProduct('test', { nom: 'ValeurTest' });
        expect(response.status).toBe(404);
        expect(response.text).toBe('Produit non trouvé');
    });

    test('Erreur_404_DeleteProduct', async () => {
        const response = await deleteProduct('nonexistent');
        expect(response.status).toBe(404);
        expect(response.text).toBe('Produit non trouvé');
    });

    // Fonction utilitaire pour les tests d'erreurs 400
    const testCreateProductError = async (invalidProduct, expectedError) => {
        const response = await createProduct(invalidProduct);
        expect(response.status).toBe(400);
        expect(response.text).toBe(expectedError);
    };

    // Tests Erreurs 400
    test('Erreur_400_CreateProduct_MissingFields', async () => {
        const invalidProduct = { nom: 'Test Product' }; // Missing fields
        await testCreateProductError(invalidProduct, 'Les champs nom, description, prix, et quantite_stock sont obligatoires.');
    });

    test('Erreur_400_CreateProduct_InvalidNom', async () => {
        const invalidProduct = { nom: 'Test@Product', description: 'Description', prix: 100.0, quantite_stock: 50 };
        await testCreateProductError(invalidProduct, 'Le champ nom contient des caractères invalides.');
    });

    test('Erreur_400_CreateProduct_InvalidDescription', async () => {
        const invalidProduct = { nom: 'Test Product', description: 'Desc@ription', prix: 100.0, quantite_stock: 50 };
        await testCreateProductError(invalidProduct, 'Le champ description contient des caractères invalides.');
    });

    test('Erreur_400_CreateProduct_InvalidPrix', async () => {
        const invalidProduct = { nom: 'Test Product', description: 'Description', prix: 'invalid', quantite_stock: 50 };
        await testCreateProductError(invalidProduct, 'Le champ prix doit être un nombre positif.');
    });

    test('Erreur_400_CreateProduct_InvalidQuantite', async () => {
        const invalidProduct = { nom: 'Test Product', description: 'Description', prix: 100.0, quantite_stock: 'invalid' };
        await testCreateProductError(invalidProduct, 'Le champ quantite_stock doit être un nombre positif.');
    });

    test('Erreur_400_UpdateProduct_EditID', async () => {
        const response = await updateProduct(productId, { id_produit: 'newId', nom: 'Updated Product', description: 'Updated Description', prix: 150.0, quantite_stock: 30 });
        expect(response.status).toBe(400);
        expect(response.text).toBe('Le champ id_produit ne peut pas être modifié.');
    });

    test('Erreur_400_UpdateProduct_InvalidNom', async () => {
        const response = await updateProduct(productId, { nom: 'Invalid@Name' });
        expect(response.status).toBe(400);
        expect(response.text).toBe('Le champ nom contient des caractères invalides.');
    });

    test('Erreur_400_UpdateProduct_InvalidDescription', async () => {
        const response = await updateProduct(productId, { description: 'Invalid@Description' });
        expect(response.status).toBe(400);
        expect(response.text).toBe('Le champ description contient des caractères invalides.');
    });

    test('Erreur_400_UpdateProduct_InvalidPrix', async () => {
        const response = await updateProduct(productId, { prix: 'invalid' });
        expect(response.status).toBe(400);
        expect(response.text).toBe('Le champ prix doit être un nombre positif.');
    });

    test('Erreur_400_UpdateProduct_InvalidQuantite', async () => {
        const response = await updateProduct(productId, { quantite_stock: 'invalid' });
        expect(response.status).toBe(400);
        expect(response.text).toBe('Le champ quantite_stock doit être un nombre positif.');
    });

    // Tests Erreurs 500
    describe('Erreur 500', () => {
        beforeEach(() => {
            db.collection = jest.fn(() => {
                throw new Error();
            });
        });

        test('Erreur_500_GetProducts', async () => {
            const response = await request(app).get('/products');
            expect(response.status).toBe(500);
            expect(response.text).toMatch(/Erreur lors de la récupération des produits : /);
        });

        test('Erreur_500_GetProductByID', async () => {
            const response = await request(app).get(`/products/test`);
            expect(response.status).toBe(500);
            expect(response.text).toMatch(/Erreur lors de la récupération du produit par ID : /);
        });

        test('Erreur_500_CreateProduct', async () => {
            const response = await createProduct({ nom: 'Test Product', description: 'Description', prix: 100.0, quantite_stock: 50 });
            expect(response.status).toBe(500);
            expect(response.text).toMatch(/Erreur lors de la création du produit : /);
        });

        test('Erreur_500_UpdateProduct', async () => {
            const response = await updateProduct('test', { nom: 'ValeurTest' });
            expect(response.status).toBe(500);
            expect(response.text).toMatch(/Erreur lors de la mise à jour du produit : /);
        });

        test('Erreur_500_DeleteProduct', async () => {
            const response = await deleteProduct('test');
            expect(response.status).toBe(500);
            expect(response.text).toMatch(/Erreur lors de la suppression du produit : /);
        });
    });
});
