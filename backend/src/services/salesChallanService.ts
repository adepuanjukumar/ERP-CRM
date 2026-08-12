import {
  createSalesChallan,
  findSalesChallanById,
  findSalesChallans,
  updateSalesChallan,
  confirmSalesChallanTransaction,
  cancelSalesChallan,
  FindChallansResult,
} from '../models/salesChallanModel';
import {
  SalesChallan,
  CreateChallanInput,
  UpdateChallanInput,
  ChallanQueryParams,
} from '../types';

export const createChallanService = async (
  input: CreateChallanInput,
  createdByUserId: string
): Promise<SalesChallan> => {
  return await createSalesChallan(input, createdByUserId);
};

export const getChallanByIdService = async (id: string): Promise<SalesChallan> => {
  const challan = await findSalesChallanById(id);
  if (!challan) {
    throw new Error(`CHALLAN_NOT_FOUND: Sales challan with ID '${id}' was not found.`);
  }
  return challan;
};

export const getChallansService = async (
  params: ChallanQueryParams
): Promise<FindChallansResult> => {
  return await findSalesChallans(params);
};

export const updateChallanService = async (
  id: string,
  input: UpdateChallanInput
): Promise<SalesChallan> => {
  return await updateSalesChallan(id, input);
};

export const confirmChallanService = async (
  id: string,
  confirmedByUserId: string
): Promise<SalesChallan> => {
  return await confirmSalesChallanTransaction(id, confirmedByUserId);
};

export const cancelChallanService = async (id: string): Promise<SalesChallan> => {
  return await cancelSalesChallan(id);
};
