const express = require('express');
const router = express.Router();
const { getHomePage, checkTemplate, getProductsPage, getProductDetailPage, debugProducts,   getAboutPage,
  getContactPage, submitContactForm } = require('../controllers/pageController');


router.get('/', getHomePage);
router.get('/products', getProductsPage);
router.get('/products/:id', getProductDetailPage);
router.get('/about', getAboutPage);
router.get('/contact', getContactPage);
router.post('/contact', submitContactForm);

router.get('/debug-products', debugProducts);
router.get('/check-template', checkTemplate);

module.exports = router;