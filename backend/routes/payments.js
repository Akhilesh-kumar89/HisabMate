const router = require('express').Router();
const c = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').post(c.create).get(c.list);
module.exports = router;
