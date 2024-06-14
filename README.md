# API Produits NodeJS

## Description
Répositoire git d'une des trois API indépendantes (Produits) permettant de gérer les produits.

## Prérequis

- Node.js (version 14 ou supérieure)
- npm (version 6 ou supérieure)

## Installation

1. Clonez ce dépôt :

   ```bash
   git clone https://github.com/EPSI-MSPR-6/MSPR-Appli-Produit.git
   cd MSPR-Appli-Produit
   ```

2. Installez les dépendances :

   ```bash
   npm install
   ```

3. Créez un fichier `.env` et `.env.test` à la racine du projet et ajoutez les variables d'environnement communiquées

4. Démarrez le serveur :

   ```bash
   npm start
   ```
L'API sera accessible à l'adresse `http://localhost:8081` (ou modifiez le port utilisé dans index.js s'il est déjà utilisé).

5. Démarrez les tests grâce à jest :

   ```bash
   npm test
   ```

## Objectif de l'API

L'objectif de cette API est de gérer les informations des produits, y compris la création, la lecture, la mise à jour et la suppression des données des produits.

## Endpoints de l'API

| Méthode | Endpoint                  | Description                                 |
|---------|---------------------------|---------------------------------------------|
| POST    | /products                 | Crée un nouveau produit                     |
| GET     | /products                 | Récupère une liste de produits              |
| GET     | /products/{id}            | Récupère un produit par son identifiant     |
| PUT     | /products/{id}            | Met à jour un produit                       |
| DELETE  | /products/{id}            | Supprime un produit                         |
| POST    | /products/pubsub          | Lecture PubSub + Fonctions                  |

## Body Autorisé par requête POST/PUT

1. Requête /products (POST)
```json
{
  "nom": "",
  "description": "",
  "prix": 0,
  "quantite_stock": 0
}
// Tous les champs sont obligatoires
```

2. Requête /products/{id} (PUT)
```json
{
  "nom": "",
  "description": "",
  "prix": 0,
  "quantite_stock": 0
}
```