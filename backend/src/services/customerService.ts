import {
  createCustomer,
  findCustomerById,
  findCustomers,
  updateCustomer,
  FindCustomersResult,
} from '../models/customerModel';
import {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryParams,
} from '../types';

export const addCustomerService = async (input: CreateCustomerInput): Promise<Customer> => {
  return await createCustomer(input);
};

export const getCustomerByIdService = async (id: string): Promise<Customer> => {
  const customer = await findCustomerById(id);
  if (!customer) {
    throw new Error(`Customer with ID '${id}' was not found.`);
  }
  return customer;
};

export const getCustomersService = async (
  params: CustomerQueryParams
): Promise<FindCustomersResult> => {
  return await findCustomers(params);
};

export const updateCustomerService = async (
  id: string,
  input: UpdateCustomerInput
): Promise<Customer> => {
  const updatedCustomer = await updateCustomer(id, input);
  if (!updatedCustomer) {
    throw new Error(`Customer with ID '${id}' was not found.`);
  }
  return updatedCustomer;
};
