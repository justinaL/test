const BuildingSchema = BaseSchema.extend({
  name: {
    type: String,
    intl: true,
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
  },
  location: mongoose.Schema.Types.Point,
});


// {
//   name: {
//     en: 'May Tower',
//     zh: '梅苑'
//   },
//   location: {
//     type: 'Point',
//     coordinates: [114.154286, 22.273579] // [lat, long]
//   }
// }
