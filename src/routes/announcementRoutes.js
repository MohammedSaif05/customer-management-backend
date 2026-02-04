const express = require('express');
const { body, param, query } = require('express-validator');
const announcementController = require('../controllers/announcementController');
const { auth, roleCheck, validate } = require('../middlewares');

const router = express.Router();

router.use(auth);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('pinned').optional().isIn(['true', 'false']),
    query('expired').optional().isIn(['true', 'false']),
  ],
  validate,
  announcementController.list
);

router.post(
  '/',
  roleCheck('ADMIN', 'MANAGER'),
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('message').trim().notEmpty().withMessage('Message required'),
    body('visibleTo').optional().isArray(),
    body('isPinned').optional().isBoolean(),
    body('expiresAt').optional().isISO8601(),
  ],
  validate,
  announcementController.create
);

router.get('/:id', param('id').isMongoId(), validate, announcementController.getOne);

router.patch(
  '/:id',
  roleCheck('ADMIN', 'MANAGER'),
  param('id').isMongoId(),
  [
    body('title').optional().trim().notEmpty(),
    body('message').optional().trim().notEmpty(),
    body('visibleTo').optional().isArray(),
    body('isPinned').optional().isBoolean(),
    body('expiresAt').optional().isISO8601(),
  ],
  validate,
  announcementController.update
);

router.delete('/:id', roleCheck('ADMIN', 'MANAGER'), param('id').isMongoId(), validate, announcementController.remove);

module.exports = router;
