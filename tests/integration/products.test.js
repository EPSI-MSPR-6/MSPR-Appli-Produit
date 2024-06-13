const request = require('supertest');
const express = require('express');
const productsRouter = require('../../src/routes/products.js');
const db = require('../../src/firebase.js');
const { setupFirebaseTestEnv, teardownFirebaseTestEnv } = require('../firebaseTestEnv.js');
const { publishMessage } = require('../../src/services/pubsub.js');

require('dotenv').config({ path: '.env.test' });

const ApiKey = process.env.API_KEY;

const app = express();
app.use(express.json());
app.use('/products', productsRouter);

jest.mock('../../src/services/pubsub.js', () => ({
    publishMessage: jest.fn()
}));

beforeAll(async () => {
    await setupFirebaseTestEnv();
});

afterAll(async () => {
    await teardownFirebaseTestEnv();
});

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

const sendPubSubMessage = async (message) => {
    return await request(app)
        .post('/products/pubsub')
        .send({
            message: {
                data: Buffer.from(JSON.stringify(message)).toString('base64')
            }
        });
};
describe('Products API', () => {
    let productId;

    test('Création Produit', async () => {
        const response = await createProduct({ nom: 'Espresso', description: 'Café corsé et intense.', prix: 2.5, quantite_stock: 50 });

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

    test('Récupération Produit via ID', async () => {
        const response = await request(app).get(`/products/${productId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', productId);
    });

    test('Mise à jour Produit', async () => {
        const response = await updateProduct(productId, { nom: 'Double Espresso', description: 'Café double dose.', prix: 3.0, quantite_stock: 30 });
        expect(response.status).toBe(200);
        expect(response.text).toBe('Produit mis à jour');
    });

    test('Suppression Produit', async () => {
        const response = await deleteProduct(productId);
        expect(response.status).toBe(200);
        expect(response.text).toBe('Produit supprimé');
    });
});

describe('Tests Pub/Sub', () => {
    let newProductId;

    test('Fonction Pub_Sub - Création Commande Succès', async () => {
        const createResponse = await createProduct({ nom: 'Cappuccino', description: 'Café crémeux avec mousse de lait.', prix: 3.5, quantite_stock: 50 });
        newProductId = createResponse.text.split('Produit créé avec son ID : ')[1];

        const message = {
            action: 'CREATE_ORDER',
            orderId: 'testOrderId',
            productId: newProductId,
            quantity: 10
        };

        const response = await sendPubSubMessage(message);
        expect(response.status).toBe(200);

        const productResponse = await request(app).get(`/products/${newProductId}`);
        expect(productResponse.status).toBe(200);
        expect(productResponse.body.quantite_stock).toBe(40);
    });

    test('Fonction Pub/Sub - Création Commande Échec ( Produit Inconnu )', async () => {
        const unknownProductId = '123456789';
    
        const message = {
            action: 'CREATE_ORDER',
            orderId: 'testOrderIdFail',
            productId: unknownProductId,
            quantity: 10
        };
    
        const response = await sendPubSubMessage(message);
        expect(response.status).toBe(200);
        expect(response.text).toMatch(/Confirmation de la commande testOrderIdFail publiée avec le statut: Annulé \(Produit non trouvé\)/);
    });
    

    test('Fonction Pub_Sub - Création Commande Echec ( Quantité Insuf. ) ', async () => {
        const createResponse = await createProduct({ nom: 'Latte', description: 'Café au lait.', prix: 4.0, quantite_stock: 5 });
        const failProductId = createResponse.text.split('Produit créé avec son ID : ')[1];

        const message = {
            action: 'CREATE_ORDER',
            orderId: 'testOrderIdFail',
            productId: failProductId,
            quantity: 10
        };

        const response = await sendPubSubMessage(message);
        expect(response.status).toBe(200);

        const productResponse = await request(app).get(`/products/${failProductId}`);
        expect(productResponse.status).toBe(200);
        expect(productResponse.body.quantite_stock).toBe(5);
    });

    test('Fonction Pub/Sub - Action Inconnue', async () => {
        const message = {
            action: 'UNKNOWN_ACTION',
            orderId: 'unknownActionOrderId',
            productId: newProductId,
            quantity: 10
        };

        const response = await sendPubSubMessage(message);
        expect(response.status).toBe(400);
        expect(response.text).toBe('Action non reconnue');
    });

    test('Fonction Pub/Sub - X Data Envoyé', async () => {
        const response = await request(app)
            .post('/products/pubsub')
            .send({ message: {} });
        expect(response.status).toBe(400);
        expect(response.text).toBe('Format de message non valide');
    });

    test('Fonction Pub/Sub - Erreur 400 Création Commande ( Missing productId)', async () => {
        const message = {
            action: 'CREATE_ORDER',
            orderId: 'someOrderId',
            quantity: 2
        };

        const response = await sendPubSubMessage(message);
        expect(response.status).toBe(400);
        expect(response.text).toBe('Données de commande manquantes');
    });
    
    test('Fonction Pub/Sub - Erreur 500 Création Commande Test', async () => {
        const createResponse = await createProduct({ nom: 'Mocha', description: 'Café au chocolat.', prix: 4.5, quantite_stock: 50 });
        const errorProductId = createResponse.text.split('Produit créé avec son ID : ')[1];

        const message = {
            action: 'CREATE_ORDER',
            orderId: 'errorOrderId',
            productId: errorProductId,
            quantity: 10
        };

        jest.spyOn(db, 'collection').mockImplementationOnce(() => {
            throw new Error('Test error');
        });

        const response = await sendPubSubMessage(message);
        expect(response.status).toBe(500);
        expect(response.text).toMatch(/Erreur lors du traitement de la commande/);
    });

    test('Fonction Pub/Sub - Erreur 500 Publication Message Commande Test', async () => {
        const createResponse = await createProduct({ nom: 'Macchiato', description: 'Café avec un peu de lait.', prix: 3.0, quantite_stock: 50 });
        const confirmationErrorProductId = createResponse.text.split('Produit créé avec son ID : ')[1];

        const message = {
            action: 'CREATE_ORDER',
            orderId: 'confirmationErrorOrderId',
            productId: confirmationErrorProductId,
            quantity: 10
        };

        publishMessage.mockImplementationOnce(() => {
            throw new Error('Pub/Sub error');
        });

        const response = await sendPubSubMessage(message);
        expect(response.status).toBe(500);
        expect(response.text).toMatch(/Erreur lors de la publication de la confirmation de la commande/);
    });
});

// Tests Erreurs 403
describe('Tests403', () => {
    const invalidApiKey = 'test';
    let productId;

    beforeAll(async () => {
        const response = await createProduct({ nom: 'Americano', description: 'Café allongé à l\'eau.', prix: 2.0, quantite_stock: 50 });
        productId = response.text.split('Produit créé avec son ID : ')[1];
    });

    test('Erreur_403_CreateProduct', async () => {
        const response = await request(app)
            .post('/products')
            .set('x-api-key', invalidApiKey)
            .send({ nom: 'Flat White', description: 'Café au lait.', prix: 3.5, quantite_stock: 50 });
        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message', 'Forbidden: Invalid API Key');
    });

    test('Erreur_403_UpdateProduct', async () => {
        const response = await request(app)
            .put(`/products/${productId}`)
            .set('x-api-key', invalidApiKey)
            .send({ nom: 'Updated Flat White', description: 'Café au lait modifié.', prix: 4.0, quantite_stock: 30 });
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
describe('Tests404', () => {
    const invalidProductId = 'test';

    test('Erreur_404_GetProduct', async () => {
        const response = await request(app).get(`/products/${invalidProductId}`);
        expect(response.status).toBe(404);
        expect(response.text).toBe('Produit non trouvé');
    });

    test('Erreur_404_UpdateProduct', async () => {
        const response = await updateProduct(invalidProductId, { nom: 'ValeurTest' });
        expect(response.status).toBe(404);
        expect(response.text).toBe('Produit non trouvé');
    });

    test('Erreur_404_DeleteProduct', async () => {
        const response = await deleteProduct(invalidProductId);
        expect(response.status).toBe(404);
        expect(response.text).toBe('Produit non trouvé');
    });
});

// Fonction utilitaire pour les tests d'erreurs 400
const testCreateProductError = async (invalidProduct, expectedError) => {
    const response = await createProduct(invalidProduct);
    expect(response.status).toBe(400);
    expect(response.text).toBe(expectedError);
};

// Tests Erreurs 400
describe('Tests400', () => {
    let productId;

    beforeAll(async () => {
        const response = await createProduct({ nom: 'Test Coffee', description: 'Café de test.', prix: 5.0, quantite_stock: 50 });
        productId = response.text.split('Produit créé avec son ID : ')[1];
    });

    test('Erreur_400_CreateProduct_MissingFields', async () => {
        const invalidProduct = { nom: 'Test Coffee' }; // Missing fields
        await testCreateProductError(invalidProduct, 'Les champs nom, description, prix, et quantite_stock sont obligatoires.');
    });

    test('Erreur_400_CreateProduct_InvalidNom', async () => {
        const invalidProduct = { nom: 'Test@Coffee', description: 'Café de test.', prix: 5.0, quantite_stock: 50 };
        await testCreateProductError(invalidProduct, 'Le champ nom contient des caractères invalides.');
    });

    test('Erreur_400_CreateProduct_InvalidDescription', async () => {
        const invalidProduct = { nom: 'Test Coffee', description: 'Desc@ription', prix: 5.0, quantite_stock: 50 };
        await testCreateProductError(invalidProduct, 'Le champ description contient des caractères invalides.');
    });

    test('Erreur_400_CreateProduct_InvalidPrix', async () => {
        const invalidProduct = { nom: 'Test Coffee', description: 'Café de test.', prix: 'invalid', quantite_stock: 50 };
        await testCreateProductError(invalidProduct, 'Le champ prix doit être un nombre positif.');
    });

    test('Erreur_400_CreateProduct_InvalidQuantite', async () => {
        const invalidProduct = { nom: 'Test Coffee', description: 'Café de test.', prix: 5.0, quantite_stock: 'invalid' };
        await testCreateProductError(invalidProduct, 'Le champ quantite_stock doit être un nombre positif.');
    });

    test('Erreur_400_UpdateProduct_EditID', async () => {
        const response = await updateProduct(productId, { id: 'newId', nom: 'Updated Coffee', description: 'Café mis à jour.', prix: 6.0, quantite_stock: 30 });
        expect(response.status).toBe(400);
        expect(response.text).toBe('Le champ id ne peut pas être modifié.');
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

    test('Erreur_400_CreateProduct_DuplicateNameDescription', async () => {
        const duplicateProduct = { nom: 'Test Coffee', description: 'Café de test.', prix: 5.0, quantite_stock: 20 };
        await testCreateProductError(duplicateProduct, 'Un produit avec le même nom et la même description existe déjà.');
    });

    test('Erreur_400_UpdateProduct_DuplicateNameDescription', async () => {
        const newProductResponse = await createProduct({ nom: 'New Coffee', description: 'Nouveau café.', prix: 6.0, quantite_stock: 40 });
        const newProductId = newProductResponse.text.split('Produit créé avec son ID : ')[1];

        const response = await updateProduct(newProductId, { nom: 'Test Coffee', description: 'Café de test.', prix: 6.0, quantite_stock: 40 });
        expect(response.status).toBe(400);
        expect(response.text).toBe('Les modifications feraient conflit avec un autre produit.');
    });
});

// Tests Erreurs 500
describe('Tests500', () => {
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
        const response = await createProduct({ nom: 'Test Coffee', description: 'Café de test.', prix: 5.0, quantite_stock: 50 });
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
