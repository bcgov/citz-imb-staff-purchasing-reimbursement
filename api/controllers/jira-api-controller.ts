import axios, { AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';

/**
 * @description Makes the body object that the JIRA API expects when creating an issue (ticket).
 * @param {string} title The title of the issue.
 * @param {string} description The description of the issue.
 * @returns An object for a new JIRA issue.
 */
const buildIssue = (title: string, description: string) => ({
  fields: {
    summary: title,
    issuetype: {
      id: '10069',
    },
    project: {
      key: 'SPR',
    },
    description: {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              text: description,
              type: 'text',
            },
          ],
        },
      ],
    },
  },
});

/**
 * @description Uses the JIRA API to create a new issue (ticket).
 * @param {Request}   req Incoming Request
 * @param {Response}  res Outgoing Response
 * @returns {Response}    201 status with the returned info from the JIRA API.
 */
export const createJIRAIssue = async (req: Request, res: Response) => {
  // Create the JIRA authentication token
  const { JIRA_ACCOUNT_EMAIL, JIRA_TOKEN } = process.env;
  const encodeToBase64 = (string: string) => Buffer.from(string).toString('base64');
  const token = encodeToBase64(`${JIRA_ACCOUNT_EMAIL}:${JIRA_TOKEN}`);

  const { title, description } = req.body;

  try {
    // Request to JIRA API
    const axiosReqConfig: AxiosRequestConfig = {
      url: `https://citz-imb.atlassian.net/rest/api/3/issue`,
      method: `post`,
      headers: {
        Authorization: `Basic ${token}`,
      },
      data: buildIssue(title, description),
    };
    const response = await axios(axiosReqConfig);

    if (response.status === 201) {
      return res.status(201).json(response.data);
    } else {
      console.warn(`JIRA API error code: ${response.status}`);
      return res.status(400).send('JIRA Issue not created.');
    }
  } catch (e: any) {
    console.warn(e);
    return res.status(400).send('JIRA Issue not created.');
  }
};
