const path = require("path");

const auctionFlowData = {
  // =====================================================
  // AGENT LISTING
  // =====================================================
  agent: {
    listing: {
      addressSearchText: "c",
      expectedPropertyName: "Chapel Street, South Yarra",

      propertyType: "Apartment",
      bedrooms: 3,
      bathrooms: 2,
      carSpaces: 1,

      listingType: "Auction",
      reservePrice: "650000",
      depositPercent: "5",

      auctionLocation: "Online",
      startingPrice: "100000",
      minimumBidIncrement: "50000",

      headline: "Modern Auction Property on Chapel Street",

      propertyDescription:
        "A modern property on Chapel Street. " +
        "This Auction listing was created through Playwright automation testing.",

      keyFeatures: [
        "Air Conditioning",
        "Dishwasher",
        "Built-in Wardrobes",
        "Floorboards",
        "Balcony",
        "Garage",
      ],

      // Reuse assets already used by the Offer Price flow so no new image
      // files are required just to run the Auction flow.
      propertyPhotos: [
        path.resolve(process.cwd(), "test-assets/listing/action-1.jpg"),
        path.resolve(process.cwd(), "test-assets/listing/action-2.jpg"),
      ],

      floorPlan: path.resolve(
        process.cwd(),
        "test-assets/listing/action-floor.jpg"
      ),
    },
  },

  // =====================================================
  // AUCTION TIMING
  // Current local time rounded DOWN to 15-minute slot.
  // Example 9:35 PM -> 9:30 PM to 9:45 PM.
  // =====================================================
  auction: {
    slotMinutes: 15,
    durationMinutes: 15,
  },

  // =====================================================
  // FIRST BUYER
  // =====================================================
  firstBuyer: {
    searchText: "Chapel Street",
    bidAmount: "300000",
  },

  // =====================================================
  // SECOND BUYER / INTENDED WINNER
  // =====================================================
  secondBuyer: {
    searchText: "Chapel Street",
    bidAmount: "750000",
  },

  // =====================================================
  // SETTLEMENT
  // =====================================================
  settlement: {
    solicitorSearch: "Hasan",
    brokerSearch: "subrato",
  },

  // =====================================================
  // PAYMENT
  // =====================================================
  payment: {
    cardNumber: process.env.TEST_CARD_NUMBER || "4242 4242 4242 4242",
    expiry: process.env.TEST_CARD_EXPIRY || "07/28",
    cvc: process.env.TEST_CARD_CVC || "123",
  },

  expected: {
    auctionEnded: /Auction has ended!/i,
    paymentSuccessful: /Payment Successful/i,
    settlementCompleted:
      /Settlement Complete|Settlement Completed|Completed/i,
  },
};

module.exports = {
  auctionFlowData,
};
