import requests from './requests-router';
import jira from './jira-router';

const protectedRouter = {
  requests,
  jira,
};

export default protectedRouter;
