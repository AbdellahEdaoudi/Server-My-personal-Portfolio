const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { verifyJWT } = require("../middleware/verifyJWT");
const { verifyRole } = require("../middleware/verifyRole");

router.get('/', verifyJWT, verifyRole("admin"), contactController.getAllContacts);
router.post('/', contactController.createContact);
router.delete('/', verifyJWT, verifyRole("admin"), contactController.deleteAllContacts);
router.delete('/:id', verifyJWT, verifyRole("admin"), contactController.deleteContactById);

module.exports = router;
