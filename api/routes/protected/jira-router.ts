import { createJIRAIssue } from '../../controllers/jira-api-controller';
import express from 'express';

const router = express.Router();

// Creates a jira ticket
router.route('/jira/create').post(createJIRAIssue);

export default router;
