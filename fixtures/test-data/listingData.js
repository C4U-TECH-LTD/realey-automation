const path = require("path");

const listingData = {
  // =====================================================
  // CREATE LISTING
  // =====================================================

  location: {
    addressSearchText: "a",

    expectedPropertyName:
      "Arndale Shopping Centre Access, Kilkenny",
  },

  details: {
    propertyType: "House",
    bedrooms: 3,
    bathrooms: 2,
    carSpaces: 1,
    landSize: "",
    buildingSize: "",
    yearBuilt: "",
  },

  pricing: {
    listingType: "Offers",
    priceGuide: "50000",
  },

  description: {
    headline:
      "Modern Family Home in Prime Location",

    propertyDescription: [
      "Beautiful and spacious family home located in a highly desirable area.",
      "The property offers modern interiors, comfortable living spaces,",
      "excellent natural light, and convenient access to local amenities.",
      "This listing was created through Playwright automation testing.",
    ].join(" "),

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
  },

  media: {
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

  expected: {
    successMessage:
      /listing published|published successfully|listing created|success/i,

    successUrl:
      /listing|listings|dashboard|property/i,
  },

  // =====================================================
  // LISTINGS MANAGEMENT
  // =====================================================

  management: {
    search: {
      listingName:
        "Bates Drive, Kareela",
    },

    edit: {
      propertyName:
        "Arndale Shopping Centre Access, Kilkenny",

      propertyType:
        "Townhouse",

      landSize:
        "650",

      yearBuilt:
        "1990",
    },

    archive: {
      propertyName:
        "Arndale Shopping Centre Access, Kilkenny",
    },

    details: {
      propertyName:
        "Arndale Shopping Centre Access, Kilkenny",

      bedrooms: 3,

      bathrooms: 2,

      headline:
        "Modern Family Home in Prime Location",

      expectedFeatures: [
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
    },

    status: {
      propertyName:
        "Arndale Shopping Centre Access, Kilkenny",

      expectedStatus:
        "Available",
    },

    publishing: {
      propertyName:
        "Arndale Shopping Centre Access, Kilkenny",

      expectedStatus:
        "Available",
    },

    filterStatus:
      "Active",

    filters: [
      "All",
      "Active",
      "Settlement Pending",
      "Auction Ended - No Sale",
      "Under Contract",
      "InActive",
    ],
  },

  // =====================================================
  // FIXED PRICE E2E FLOW
  // =====================================================

  fixedPriceFlow: {
    listingType:
      "Fixed Price",

    generalUser: {
      searchText:
        "Arndale Shopping Centre Access",

      offerAmount:
        "25000",
    },

    settlement: {
      solicitorSearch:
        "Hasan",

      brokerSearch:
        "subrato",
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
      offerSubmitted:
        /Offer Submitted Successfully/i,

      offerAccepted:
        /accepted|offer accepted/i,

      paymentSuccessful:
        /Payment Successful/i,
    },
  },
};

module.exports = {
  listingData,
};
