import { Request, Response, NextFunction } from 'express';
import { CustomerType, CustomerStatus } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\+?[0-9]{7,15}$/;
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const VALID_CUSTOMER_TYPES: CustomerType[] = ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'];
const VALID_CUSTOMER_STATUSES: CustomerStatus[] = ['LEAD', 'ACTIVE', 'INACTIVE'];

export const validateCustomerIdParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params;
  if (!id || !UUID_REGEX.test(id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid customer ID format. Must be a valid UUID.',
    });
    return;
  }
  next();
};

export const validateCreateCustomer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {
    name,
    mobile,
    email,
    business_name,
    customer_type,
    address,
    status,
    follow_up_date,
  } = req.body;

  // 1. Mandatory field presence checks
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ success: false, message: 'Customer name is required.' });
    return;
  }

  if (!mobile || typeof mobile !== 'string' || !mobile.trim()) {
    res.status(400).json({ success: false, message: 'Mobile number is required.' });
    return;
  }

  if (!MOBILE_REGEX.test(mobile.trim())) {
    res.status(400).json({
      success: false,
      message: 'Invalid mobile number. Must contain 7 to 15 digits.',
    });
    return;
  }

  if (!business_name || typeof business_name !== 'string' || !business_name.trim()) {
    res.status(400).json({ success: false, message: 'Business name is required.' });
    return;
  }

  if (!address || typeof address !== 'string' || !address.trim()) {
    res.status(400).json({ success: false, message: 'Address is required.' });
    return;
  }

  // 2. Email format check (optional field)
  if (email !== undefined && email !== null && email.trim() !== '') {
    if (!EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({
        success: false,
        message: 'Invalid email address format.',
      });
      return;
    }
  }

  // 3. Customer type enum check
  if (customer_type) {
    if (!VALID_CUSTOMER_TYPES.includes(customer_type)) {
      res.status(400).json({
        success: false,
        message: `Invalid customer type. Allowed values: [${VALID_CUSTOMER_TYPES.join(', ')}]`,
      });
      return;
    }
  }

  // 4. Status enum check
  if (status) {
    if (!VALID_CUSTOMER_STATUSES.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: [${VALID_CUSTOMER_STATUSES.join(', ')}]`,
      });
      return;
    }
  }

  // 5. Follow-up date format check (optional field, YYYY-MM-DD)
  if (follow_up_date !== undefined && follow_up_date !== null && follow_up_date.trim() !== '') {
    if (!DATE_REGEX.test(follow_up_date.trim())) {
      res.status(400).json({
        success: false,
        message: 'Invalid follow-up date format. Expected format: YYYY-MM-DD.',
      });
      return;
    }
  }

  next();
};

export const validateUpdateCustomer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {
    name,
    mobile,
    email,
    business_name,
    customer_type,
    address,
    status,
    follow_up_date,
  } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Customer name cannot be empty.' });
      return;
    }
  }

  if (mobile !== undefined) {
    if (typeof mobile !== 'string' || !mobile.trim() || !MOBILE_REGEX.test(mobile.trim())) {
      res.status(400).json({
        success: false,
        message: 'Invalid mobile number. Must contain 7 to 15 digits.',
      });
      return;
    }
  }

  if (business_name !== undefined) {
    if (typeof business_name !== 'string' || !business_name.trim()) {
      res.status(400).json({ success: false, message: 'Business name cannot be empty.' });
      return;
    }
  }

  if (address !== undefined) {
    if (typeof address !== 'string' || !address.trim()) {
      res.status(400).json({ success: false, message: 'Address cannot be empty.' });
      return;
    }
  }

  if (email !== undefined && email !== null && email.trim() !== '') {
    if (!EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ success: false, message: 'Invalid email address format.' });
      return;
    }
  }

  if (customer_type !== undefined) {
    if (!VALID_CUSTOMER_TYPES.includes(customer_type)) {
      res.status(400).json({
        success: false,
        message: `Invalid customer type. Allowed values: [${VALID_CUSTOMER_TYPES.join(', ')}]`,
      });
      return;
    }
  }

  if (status !== undefined) {
    if (!VALID_CUSTOMER_STATUSES.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: [${VALID_CUSTOMER_STATUSES.join(', ')}]`,
      });
      return;
    }
  }

  if (follow_up_date !== undefined && follow_up_date !== null && follow_up_date.trim() !== '') {
    if (!DATE_REGEX.test(follow_up_date.trim())) {
      res.status(400).json({
        success: false,
        message: 'Invalid follow-up date format. Expected format: YYYY-MM-DD.',
      });
      return;
    }
  }

  next();
};
