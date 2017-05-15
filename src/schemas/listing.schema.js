const ListingSchema = BaseSchema.extend({
  type: {
    type: String,
    enum: [
      'buy',
      'rent',
    ],
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
  },
  sourceUrl: String,
  source: String,
  bedrooms: Number,
  ensuites: Number,
  bathrooms: Number,
  balconies: Number,
  parkings: Number,
  maidsrooms: Number,
  outdoor: Boolean,
  familyRooms: {
    type: Number,
  },
  utilityRooms: Number,
  studyRooms: Number,
  pool: Boolean,
  tennis: Boolean,
  lift: Boolean,
  terraces: Number,
  gym: Boolean,
  clubHouse: Boolean,
  roofTop: Boolean,
  playground: Boolean,
  openKitchen: Boolean,
  furnished: Boolean,
  airCon: Boolean,
  views: [
    {
      type: String,
      enum: [
        'garden',
        'sea',
        'mountain',
        'city',
        'racecourse',
        'building',
        'open',
      ],
    }
  ],
  appliances: [
    {
      type: String,
      enum: [
        'oven',
        'dishwasher',
        'microwave',
        'fridge',
        'tv',
      ],
    },
  ],
  description: String,
  netArea: Number,
  grossArea: Number,
  price: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'HKD',
  },
  pet: Boolean,
  images: [{
    type: String,
  }],
  videos: [{
    type: String,
  }],
  closed: Boolean,
  sourceRefId: String,
});