const router = require('express').Router();
const c = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').post(c.create).get(c.list);
router.route('/:id').get(c.getOne).put(c.update).delete(c.remove);
module.exports = router;
