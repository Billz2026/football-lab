import * as base from './transfers-v050.js?v=0.5.0';

export {
  TRANSFER_SCHEMA_VERSION,
  applyTransferOwnership,
  ensureTransferState,
  estimatePlayerValue,
  estimateWeeklyWage,
  getAskingPrice,
  getNegotiation,
  getTransferBudget,
  listOwnPlayersForTransfer,
  searchTransferMarket,
  submitTransferOffer,
  toggleTransferListed
} from './transfers-v050.js?v=0.5.0';

const clone = value => JSON.parse(JSON.stringify(value));

export function acceptSellerCounter(career, db, playerId) {
  const negotiation = base.getNegotiation(career, db, playerId);
  if (!negotiation?.counterFee) throw new Error('There is no active counter-offer to accept.');
  if (negotiation.counterFee > career.transfers.transferBudget) throw new Error('The counter-offer is above your remaining transfer budget.');
  const acceptedFee = negotiation.counterFee;
  negotiation.lastOffer = acceptedFee;
  negotiation.counterFee = null;
  negotiation.status = 'fee-accepted';
  negotiation.messages.push(`Counter-offer accepted at £${acceptedFee.toLocaleString('en-GB')}.`);
  return { status: 'accepted', negotiation: clone(negotiation) };
}

export function submitContractOffer(career, db, playerId, weeklyWage, years = 4) {
  const negotiation = base.getNegotiation(career, db, playerId);
  if (!negotiation) throw new Error('Agree a transfer fee before discussing the contract.');
  const retryingCounter = negotiation.status === 'contract-countered';
  if (retryingCounter) negotiation.status = 'fee-accepted';
  try {
    return base.submitContractOffer(career, db, playerId, weeklyWage, years);
  } catch (error) {
    if (retryingCounter && negotiation.status === 'fee-accepted') negotiation.status = 'contract-countered';
    throw error;
  }
}
