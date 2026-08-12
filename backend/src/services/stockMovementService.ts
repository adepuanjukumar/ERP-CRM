import {
  createStockMovementTransaction,
  findStockMovements,
  CreateStockMovementResult,
  FindStockMovementsResult,
} from '../models/stockMovementModel';
import { CreateStockMovementInput, StockMovementQueryParams } from '../types';

export const addStockMovementService = async (
  input: CreateStockMovementInput
): Promise<CreateStockMovementResult> => {
  return await createStockMovementTransaction(input);
};

export const getStockMovementsService = async (
  params: StockMovementQueryParams
): Promise<FindStockMovementsResult> => {
  return await findStockMovements(params);
};
