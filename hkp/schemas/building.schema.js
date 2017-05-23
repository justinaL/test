const mongoose = require('mongoose');
require('mongoose-geojson-schema');

const BuildingSchema = new mongoose.Schema({
  name: {
    type: String,
    intl: true,
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
  },
  location: mongoose.Schema.Types.Point,
}, {
  timestamps: true,
});

module.exports = BuildingSchema;

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
