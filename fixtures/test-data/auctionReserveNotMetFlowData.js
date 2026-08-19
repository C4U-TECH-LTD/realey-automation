const path = require("path");

const auctionReserveNotMetFlowData = {

  agent: {
    listing: {
      addressSearchText: "d",

      expectedPropertyName: "Degraves Street, Melbourne",

      propertyType: "Apartment",
      bedrooms: 3,
      bathrooms: 2,
      carSpaces: 1,

      listingType: "Auction",
      reservePrice: "8500000",
      depositPercent: "5",

      auctionLocation: "Online",
      startingPrice: "100000",
      minimumBidIncrement: "50000",

      headline: "Flow 4 Auction Reserve Not Met Property",

      propertyDescription:
        "Auction listing created for Flow 4 Playwright automation: " +
        "reserve price not met, negotiation, counter offer acceptance and settlement.",

      keyFeatures: [
        "Air Conditioning",
        "Dishwasher",
        "Built-in Wardrobes",
        "Floorboards",
        "Balcony",
        "Garage",
      ],

      propertyPhotos: [
             path.resolve(
               process.cwd(),
               "test-assets/listing/auction-reserve-1.webp"
             ),
             path.resolve(
               process.cwd(),
               "test-assets/listing/auction-reserve-2.jpg"
             ),
           ],
     
           floorPlan: path.resolve(
             process.cwd(),
             "test-assets/listing/auction-reserve-floor.jpg"
           ),
         },
       },

  auction: {
    slotMinutes: 15,
    durationMinutes: 15,
  },


  buyer: {
    searchText: "Degraves Street",
    signature: "SIAM",
    bidAmount: "300000",
  },


  negotiation: {
    agentCounterAmount: "7500000",
    buyerCounterAmount: "7000000",
    acceptedAmount: "7000000",
  },


  settlement: {
    solicitorSearch: "Hasan",
    brokerSearch: "subrato",
  },

  payment: {
    cardNumber:
      process.env.TEST_CARD_NUMBER ||
      "4242 4242 4242 4242",

    expiry:
      process.env.TEST_CARD_EXPIRY ||
      "07/28",

    cvc:
      process.env.TEST_CARD_CVC ||
      "123",
  },


  expected: {
    auctionEnded: /Auction has ended!/i,

    reserveNotMet:
      /Reserve Price Not Met|Reserve Not Met|reserve.*not.*met/i,

    counterOfferSent:
      /counter offer/i,

    counterNegotiationSent:
      /counter offer/i,

    offerAccepted:
      /accepted|offer accepted/i,

    paymentSuccessful:
      /Payment Successful/i,

    settlementCompleted:
      /Settlement Complete|Settlement Completed|Completed/i,
  },
};

module.exports = {
  auctionReserveNotMetFlowData,
};
