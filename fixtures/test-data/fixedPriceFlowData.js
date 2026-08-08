const path = require("path");

const fixedPriceFlowData = {
  // =====================================================
  // AGENT LISTING
  // =====================================================

  agent: {
    listing: {
      addressSearchText: "a",

      expectedPropertyName:
        "Arndale Shopping Centre Access, Kilkenny",

      propertyType: "House",
      bedrooms: 3,
      bathrooms: 2,
      carSpaces: 1,

      listingType: "Fixed Price",
      priceGuide: "50000",

      headline:
        "Modern Family Home in Prime Location",

      propertyDescription:
        "Beautiful and spacious family home located in a highly desirable area. " +
        "This listing was created through Playwright automation testing.",

      keyFeatures: [
        "Fireplace",
        "Air Conditioning",
        "Dishwasher",
        "Built-in Wardrobes",
        "Floorboards",
        "Garden",
        "Balcony",
        "Garage",
        "Swimming Pool",
      ],

      propertyPhotos: [
        path.resolve(
          process.cwd(),
          "test-assets/listing/property-1.jpg"
        ),
        path.resolve(
          process.cwd(),
          "test-assets/listing/property-2.jpg"
        ),
      ],

      floorPlan: path.resolve(
        process.cwd(),
        "test-assets/listing/floor-plan.jpg"
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

    // Search property
    searchText:
      "Arndale Shopping Centre Access",

    // Offer
    offerAmount: "25000",
  },

  // =====================================================
  // SETTLEMENT
  // =====================================================

  settlement: {
    // Solicitor search
    solicitorSearch: "Hasan",

    // Broker search
    brokerSearch: "subrato",
  },

  // =====================================================
  // CREDIT CARD / DEPOSIT PAYMENT
  // =====================================================

  payment: {
    cardNumber:
      process.env.TEST_CARD_NUMBER,

    expiry:
      process.env.TEST_CARD_EXPIRY,

    cvc:
      process.env.TEST_CARD_CVC,

    cardholderName:
      process.env.TEST_CARDHOLDER_NAME,

    postcode:
      process.env.TEST_CARD_POSTCODE,
  },

  // =====================================================
  // EXPECTED RESULTS
  // =====================================================

  expected: {
    offerSubmitted:
      /Offer Submitted Successfully/i,

    offerAccepted:
      /accepted|offer accepted/i,

    paymentSuccessful:
      /Payment Successful/i,
  },
};

module.exports = {
  fixedPriceFlowData,
};