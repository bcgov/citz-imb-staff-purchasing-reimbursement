import db from '../db/conn';
import { Request, Response } from 'express';
import { Collection } from 'mongodb';
import chefRequestSchema from '../schemas/chefRequestSchema';
import RequestStates from '../constants/RequestStates';

/**
 * @interface
 * @description Extend the request to include data object from CHEFS
 * @property {object} data - The data object that contains info from CHEFS submission.
 */
interface ChefsRequest extends Request {
  body: Request['body'] & {
    data: object;
  };
}

/**
 * @param {object} obj  Any JS object
 * @returns {object}    The same object stripped of blank keys.
 * @description Removes keys with a blank string.
 */
const removeBlankKeys = (obj: object) => {
  Object.keys(obj).forEach((key: keyof object) => {
    // eslint-disable-next-line no-param-reassign
    if (obj[key] === '') delete obj[key];
  });
  return obj;
};

/**
 * @description Takes requests from the CHEFS service and submits them to the database.
 * @param {ChefsRequest}  req The incoming CHEFS request
 * @param {Response}      res The outgoing response
 * @returns {Response}        Response with status code and either text or JSON data
 */
const submitRequestHandler = async (req: ChefsRequest, res: Response) => {
  let requestData = { ...req.body };
  try {
    // Remove properties that may be blank. Otherwise the validation does not pass for optional fields.
    requestData = removeBlankKeys(requestData);
    // Validate incoming data
    chefRequestSchema.parse(requestData);
  } catch (e) {
    if (e.issues) console.warn(e.issues);
    return res.status(400).send('Request has invalid or missing properties.');
  }

  // Add current timestamp and state to request
  const newPurchaseRequest = {
    ...requestData,
    submissionDate: new Date().toISOString(),
    state: RequestStates.INCOMPLETE,
  };
  // Insert request into collection
  const collection: Collection = db.collection('requests');
  const response = await collection.insertOne(newPurchaseRequest);
  // If insertedID exists, the insert was successful!
  if (response.insertedId) {
    return res.status(201).json({ ...newPurchaseRequest, _id: response.insertedId });
  }
  // Generic error response
  return res.status(400).send('Reimbursement request was not successful.');
};

export { submitRequestHandler };
