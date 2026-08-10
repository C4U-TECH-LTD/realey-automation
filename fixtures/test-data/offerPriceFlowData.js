const path = require("path");

const offerPriceFlowData = {
  // =====================================================
  // AGENT LISTING
  // =====================================================
  agent: {
    listing: {
      addressSearchText: "b",
      expectedPropertyName: "Bates Drive, Kareela",
     

      propertyType: "House",
      bedrooms: 4,
      bathrooms: 2,
      carSpaces: 2,

      listingType: "Offers",
      priceGuide: "600000",

      headline: "Beautiful Family Home in Kareela",

      propertyDescription:
        "A spacious and modern family home located in the desirable Kareela area. " +
        "This Offer Price listing was created through Playwright automation testing.",

      keyFeatures: [
        "Air Conditioning",
        "Dishwasher",
        "Built-in Wardrobes",
        "Floorboards",
        "Garden",
        "Balcony",
        "Garage",
      ],

      propertyPhotos: [
        path.resolve(
          process.cwd(),
          "test-assets/listing/offer-1.jpg"
        ),
        path.resolve(
          process.cwd(),
          "test-assets/listing/offer-2.jpg"
        ),
      ],

      floorPlan: path.resolve(
        process.cwd(),
        "test-assets/listing/offer-floor-1.jpg"
      ),
    },
  },

  // =====================================================
  // GENERAL USER
  // =====================================================
  generalUser: {
    email: process.env.GENERAL_USER_EMAIL,
    password: process.env.GENERAL_USER_PASSWORD,
    otp: process.env.GENERAL_USER_OTP,

    searchText: "Bates Drive",

    // Buyer initial offer
    offerAmount: "500000",

    // Buyer counter-negotiation after agent counter
    negotiatedOfferAmount: "520000",
  },

  // =====================================================
  // AGENT COUNTER OFFER
  // =====================================================
  counterOffer: {
    amount: "550000",
  },

  // =====================================================
  // SETTLEMENT
  // =====================================================
  settlement: {
    solicitorSearch: "Hasan",
    brokerSearch: "subrato",
  },

  // =====================================================
  // CREDIT CARD / DEPOSIT PAYMENT
  // =====================================================
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

  // =====================================================
  // EXPECTED RESULTS
  // =====================================================
  expected: {
    offerSubmitted: /Offer Submitted Successfully/i,
    counterOfferSent: /counter offer/i,
    counterNegotiationSent: /counter offer/i,
    offerAccepted: /accepted|offer accepted/i,
    paymentSuccessful: /Payment Successful/i,
  },
};

module.exports = {
  offerPriceFlowData,
};
