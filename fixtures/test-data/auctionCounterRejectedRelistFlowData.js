const path = require("path");

const auctionCounterRejectedRelistFlowData = {
  agent: {
    listing: {
      addressSearchText: "e",
      expectedPropertyName: "Elizabeth Street, Melbourne",
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
      headline: "Flow 5 Auction Counter Rejected Relist Property",
      propertyDescription:
        "Auction listing created for Flow 5 Playwright automation: " +
        "reserve price not met, buyer counter rejected, then property re-listed as Fixed Price.",
      keyFeatures: [
        "Air Conditioning",
        "Dishwasher",
        "Built-in Wardrobes",
        "Floorboards",
        "Balcony",
        "Garage",
      ],
      propertyPhotos: [
        path.resolve(process.cwd(), "test-assets/listing/auction-reserve-1.webp"),
        path.resolve(process.cwd(), "test-assets/listing/auction-reserve-2.jpg"),
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
    searchText: "Elizabeth Street",
    signature: "SIAM",
    bidAmount: "300000",
  },

  negotiation: {
    agentCounterAmount: "7500000",
    buyerCounterAmount: "7000000",
  },

  decline: {
    actionText: "Decline",
    confirmationText: "Decline Offer",
  },

  relist: {
    actionText: "Re-list",
    listingType: "Fixed Price",
  },

  expected: {
    auctionEnded: /Auction has ended!/i,
    reserveNotMet:
      /Reserve Price Not Met|Reserve Not Met|reserve.*not.*met/i,
    counterOfferSent: /counter offer/i,
    counterNegotiationSent: /counter offer/i,
    declined: /declined|offer declined|decline/i,
    relisted:
      /published|listing published|successfully published|re-listed|relisted/i,
  },
};

module.exports = {
  auctionCounterRejectedRelistFlowData,
};
