import { CardModel } from "../models/card.model.js";

export class CardRepository {
  create(data: {
    customerId: string;
    bankId: string;
    holderName: string;
    last4: string;
    creditLimit: number;
  }) {
    return CardModel.create({ ...data, availableLimit: data.creditLimit });
  }

  findByCustomer(customerId: string) {
    return CardModel.find({ customerId })
      .populate("bankId")
      .sort({ createdAt: -1 });
  }

  findByIdForCustomer(cardId: string, customerId: string) {
    return CardModel.findOne({ _id: cardId, customerId }).populate("bankId");
  }

  // Débito condicional: só desconta se ainda houver limite disponível.
  async reserveLimit(
    cardId: string,
    customerId: string,
    amount: number,
  ): Promise<boolean> {
    const result = await CardModel.updateOne(
      { _id: cardId, customerId, availableLimit: { $gte: amount } },
      { $inc: { availableLimit: -amount } },
    );
    return result.modifiedCount === 1;
  }
}
