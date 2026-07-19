const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const { verifyJWT } = require("../middleware/verifyJWT");
const { verifyRole } = require("../middleware/verifyRole");

router.get('/', verifyJWT, verifyRole("admin"), mediaController.getAllImages);
router.delete('/', verifyJWT, verifyRole("admin"), mediaController.deleteImage);

module.exports = router;
