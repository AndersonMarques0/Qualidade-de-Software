import { CardModel } from "../models/card.model.js";

export class CardRepository {
  create(data: {
    customerId: string;
    bankId: string;
    holderName: string;
    last4: string;
  }) {
    return CardModel.create(data);
  }

  findByCustomer(customerId: string) {
    return CardModel.find({ customerId })
      .populate("bankId")
      .sort({ createdAt: -1 });
  }

  findByIdForCustomer(cardId: string, customerId: string) {
    return CardModel.findOne({ _id: cardId, customerId }).populate("bankId");
  }
}
