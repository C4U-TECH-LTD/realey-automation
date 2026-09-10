const path = require("path");

const fixedPriceTaskListFlowData = {
  // =====================================================
  // AGENT LISTING
  // =====================================================

  agent: {
    listing: {
      addressSearchText: "Chapel Street",

      // Change if the actual Google-selected address is different.
      expectedPropertyName: "Chapel Street, South Yarra",

      propertyType: "House",

      bedrooms: 3,
      bathrooms: 2,
      carSpaces: 1,

      listingType: "Fixed Price",

      priceGuide: "650000",

      headline:
        "Fixed Price Automation Property",

      propertyDescription:
        "Fixed Price property created through Playwright automation " +
        "for validating the Configure Progress Task List behaviour.",

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
    email:
      process.env.GENERAL_USER_EMAIL,

    password:
      process.env.GENERAL_USER_PASSWORD,

    otp:
      process.env.GENERAL_USER_OTP,

    // Used for GeneralUserListingsPage search
    searchText: "Chapel Street",

    // Buyer initial direct offer
    offerAmount: "600000",
  },

  // =====================================================
  // AGENT COUNTER OFFER
  // =====================================================

  counterOffer: {
    amount: "625000",
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
    offerSubmitted:
      /Offer Submitted Successfully/i,

    counterOfferSent:
      /counter offer/i,

    offerAccepted:
      /accepted|offer accepted/i,

    paymentSuccessful:
      /Payment Successful/i,
  },
};

module.exports = {
  fixedPriceTaskListFlowData,
};
