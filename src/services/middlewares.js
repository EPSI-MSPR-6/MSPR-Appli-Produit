const nameRegex = /^[a-zA-ZÀ-ÿ0-9\s,'-]+$/;
const descriptionRegex = /^[a-zA-ZÀ-ÿ0-9\s.,'-]+$/;
const allowedFields = ['nom', 'description', 'prix', 'quantite_stock'];

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

    const unwantedFields = Object.keys(req.body).filter(key => !allowedFields.includes(key));
    if (unwantedFields.length > 0) {
        return res.status(400).send(`Les champs suivants ne sont pas autorisés : ${unwantedFields.join(', ')}`);
    }
    next();
};

const validateUpdateProduct = (req, res, next) => {
    if (req.body.id) {
        return res.status(400).send("Le champ id ne peut pas être modifié.");
    }
    const errorMessage = validateProductFields(req.body, true);
    if (errorMessage) {
        return res.status(400).send(errorMessage);
    }

    const unwantedFields = Object.keys(req.body).filter(key => !allowedFields.includes(key));
    if (unwantedFields.length > 0) {
        return res.status(400).send(`Les champs suivants ne sont pas autorisés : ${unwantedFields.join(', ')}`);
    }
    next();
};

const checkApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === process.env.API_KEY) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Invalid API Key' });
    }
};

module.exports = {
    validateCreateProduct,
    validateUpdateProduct,
    checkApiKey
};
