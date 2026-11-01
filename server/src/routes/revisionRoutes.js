const express = require('express');
const { query } = require('express-validator');
const {
  listRevisions,
  createRevision,
  updateRevision,
  deleteRevision,
} = require('../controllers/revisionController');
const {
  createRevisionRules,
  updateRevisionRules,
  idParamRule,
} = require('../middleware/rules');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

const listRules = [
  query('status')
    .optional()
    .isIn(['all', 'upcoming', 'overdue', 'completed', 'pending'])
    .withMessage('status must be all, upcoming, overdue or completed'),
];

/**
 * @route GET    /api/revisions
 * @route POST   /api/revisions
 */
router.get('/', listRules, validate, listRevisions);
router.post('/', createRevisionRules, validate, createRevision);

/**
 * @route PATCH  /api/revisions/:id
 * @route DELETE /api/revisions/:id
 */
router.patch('/:id', updateRevisionRules, validate, updateRevision);
router.delete('/:id', idParamRule, validate, deleteRevision);

module.exports = router;
