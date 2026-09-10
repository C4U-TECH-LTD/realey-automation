const path = require("path");

const passedInAuctionDeclinedFlowData = {

  // =====================================================
  // AGENT LISTING
  // =====================================================
  agent: {
    listing: {
      addressSearchText: "f",

      expectedPropertyName: "Flinders Street, Melbourne",

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

      headline: "Flow 9 Passed-In Auction Negotiation Declined Property",

      propertyDescription:
        "Auction listing created for Flow 9 Playwright automation: " +
        "reserve price not met, agent negotiates with highest bidder, " +
        "highest bidder declines, agent moves to next-highest genuine bidder.",

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

  // =====================================================
  // AUCTION TIMING
  // =====================================================
  auction: {
    slotMinutes: 15,
    durationMinutes: 15,
  },

  // =====================================================
  // FIRST BUYER (lower bid — next-highest genuine bidder)
  // =====================================================
  firstBuyer: {
    searchText: "Flinders Street",
    signature: "SIAM",
    bidAmount: "300000",
  },

  // =====================================================
  // SECOND BUYER / HIGHEST BIDDER
  // =====================================================
  secondBuyer: {
    searchText: "Flinders Street",
    signature: "SUB",
    bidAmount: "500000",
  },

  // =====================================================
  // NEGOTIATION (agent sends counter to highest bidder)
  // =====================================================
  negotiation: {
    agentCounterAmount: "7500000",
  },

  // =====================================================
  // EXPECTED
  // =====================================================
  expected: {
    auctionEnded: /Auction has ended!/i,

    reserveNotMet:
      /Reserve Price Not Met|Reserve Not Met|reserve.*not.*met/i,

    counterOfferSent: /counter offer/i,

    // After highest bidder declines, the offer is declined
    negotiationDeclined:
      /declined|offer declined|decline/i,

    // After decline, agent should see the next-highest bidder's
    // "Start negotiation" button (lowest-bid buyer = next-highest genuine)
    nextBidderAvailable:
      /Start negotiation|negotiate/i,
  },
};

module.exports = {
  passedInAuctionDeclinedFlowData,
};
