const request = require('supertest');
const express = require('express');
const productsRouter = require('../../src/routes/index.js');
const db = require('../../src/firebase.js');
const { setupFirebaseTestEnv, teardownFirebaseTestEnv } = require('../firebaseTestEnv.js');

const app = express();
app.use(express.json());
app.use('/api', productsRouter);

beforeAll(async () => {
    await setupFirebaseTestEnv();
});

afterAll(async () => {
    await teardownFirebaseTestEnv();
});

describe('Products API', () => {
    let productId;

    describe('Product API', () => {
        test('Création Produit', async () => {
            const response = await request(app)
                .post('/api/products')
                .send({ nom: 'Test Product', description: 'Description', prix: 100.0, quantite_stock: 50 });

            expect(response.status).toBe(201);
            expect(response.text).toMatch(/Produit créé avec son ID : /);

            // Extrait l'ID du Produit pour les futurs tests
            productId = response.text.split('Produit créé avec son ID : ')[1];
        });

        test('Récupération de tous les produits', async () => {
            const response = await request(app).get('/api/products');
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThan(0);
        });

        test('Récuparation Produit via ID', async () => {
            const response = await request(app).get(`/api/products/${productId}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', productId);
        });

        test('Mis à jour Produit', async () => {
            const response = await request(app)
                .put(`/api/products/${productId}`)
                .send({ nom: 'Updated Product', description: 'Updated Description', prix: 150.0, quantite_stock: 30 });

            expect(response.status).toBe(200);
            expect(response.text).toBe('Produit mis à jour');
        });

        test('Suppression Produit', async () => {
            const response = await request(app).delete(`/api/products/${productId}`);
            expect(response.status).toBe(200);
            expect(response.text).toBe('Produit supprimé');
        });
    });

    describe('Tests404', () => {
        test('Erreur_404_GetProduct', async () => {
            const response = await request(app).get('/api/products/test');
            expect(response.status).toBe(404);
            expect(response.text).toBe('Produit non trouvé');
        });

        test('Erreur_404_UpdateProduct', async () => {
            const response = await request(app)
                .put('/api/products/test')
                .send({ nom: 'ValeurTest' });

            expect(response.status).toBe(404);
            expect(response.text).toBe('Produit non trouvé');
        });

        test('Erreur_404_DeleteProduct', async () => {
            const response = await request(app).delete('/api/products/nonexistent');
            expect(response.status).toBe(404);
            expect(response.text).toBe('Produit non trouvé');
        });
    });

    describe('Tests400', () => {
        beforeAll(async () => {
            // Création utilisateur test pour le middleware
            const response = await request(app)
                .post('/api/products')
                .send({ nom: 'Test Product', description: 'Description', prix: 100.0, quantite_stock: 50 });

            productId = response.text.split('Produit créé avec son ID : ')[1];
        });

        test('Erreur_400_CreateProduct_XCredentials', async () => {
            const response = await request(app)
                .post('/api/products')
                .send({ nom: 'Test Product' });

            expect(response.status).toBe(400);
            expect(response.text).toBe('Les champs nom, description, prix, et quantite_stock sont obligatoires.');
        });

        test('Erreur_400_CreateProduct_ValidParams', async () => {
            const response = await request(app)
                .post('/api/products')
                .send({ nom: 'Test Product', description: 'Description', prix: 'invalid', quantite_stock: 'invalid' });

            expect(response.status).toBe(400);
            expect(response.text).toBe('Les types de champs sont incorrects.');
        });

        test('Erreur_400_UpdateProduct_EditID', async () => {
            const response = await request(app)
                .put(`/api/products/${productId}`)
                .send({ id_produit: 'newId', nom: 'Updated Product', description: 'Updated Description', prix: 150.0, quantite_stock: 30 });

            expect(response.status).toBe(400);
            expect(response.text).toBe('Le champ id_produit ne peut pas être modifié.');
        });

        test('Erreur_400_UpdateProduct_ValidPrix', async () => {
            const response = await request(app)
                .put(`/api/products/${productId}`)
                .send({ prix: 'invalid' });

            expect(response.status).toBe(400);
            expect(response.text).toBe('Le champ prix doit être un nombre.');
        });

        test('Erreur_400_UpdateProduct_ValidNom', async () => {
            const response = await request(app)
                .put(`/api/products/${productId}`)
                .send({ nom: 123 });

            expect(response.status).toBe(400);
            expect(response.text).toBe('Le champ nom doit être une chaîne de caractères.');
        });

        test('Erreur_400_UpdateProduct_ValidDescription', async () => {
            const response = await request(app)
                .put(`/api/products/${productId}`)
                .send({ description: 123 }); 

            expect(response.status).toBe(400);
            expect(response.text).toBe('Le champ description doit être une chaîne de caractères.');
        });

        test('Erreur_400_UpdateProduct_ValidQuantite', async () => {
            const response = await request(app)
                .put(`/api/products/${productId}`)
                .send({ quantite_stock: 'deux' });

            expect(response.status).toBe(400);
            expect(response.text).toBe('Le champ quantite_stock doit être un nombre.');
        });
    });

    describe('Tests500', () => {
        test('Erreur_500_GetProducts', async () => {
            db.collection = function () { throw new Error(); };
            const response = await request(app).get('/api/products');
            expect(response.status).toBe(500);
            expect(response.text).toMatch(/Erreur lors de la récupération des produits : /);
        });

        test('Erreur_500_GetProductByID', async () => {
            db.collection = function () { throw new Error(); };
            const response = await request(app).get('/api/products/test');
            expect(response.status).toBe(500);
            expect(response.text).toMatch(/Erreur lors de la récupération du produit par ID : /);
        });

        test('Erreur_500_CreateProduct', async () => {
            db.collection = function () { throw new Error(); };
            const response = await request(app)
                .post('/api/products')
                .send({ nom: 'Test Product', description: 'Description', prix: 100.0, quantite_stock: 50 });

            expect(response.status).toBe(500);
            expect(response.text).toMatch(/Erreur lors de la création du produit : /);
        });

        test('Erreur_500_UpdateProduct', async () => {
            db.collection = function () { throw new Error(); };
            const response = await request(app)
                .put('/api/products/test')
                .send({ nom: 'ValeurTest' });

            expect(response.status).toBe(500);
            expect(response.text).toMatch(/Erreur lors de la mise à jour du produit : /);
        });

        test('Erreur_500_DeleteProduct', async () => {
            db.collection = function () { throw new Error(); };
            const response = await request(app).delete('/api/products/test');
            expect(response.status).toBe(500);
            expect(response.text).toMatch(/Erreur lors de la suppression du produit : /);
        });
    });
});
