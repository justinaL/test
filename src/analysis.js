const mongoose = require('mongoose');
const mongooseIntl = require('mongoose-intl');
const BuildingSchema = require('./schemas/building.schema');
const ListingSchema = require('./schemas/listing.schema');

const Listing = mongoose.model('Listing', ListingSchema);

function getCountPerSource() {
  return Listing 
    .aggregate(
      {$group: { 
        _id: {type: '$type', source: '$source'},
        count: {$sum: 1}
      }}
    )
    .then((result) => console.log('listings results: ', result));
}

function getCountPerBuilding(type) {
  return Listing
    .aggregate(
      {$match: {
        type: type
      }},
      {$group: {
        _id: '$building',
        count: {$sum: 1}
      }},
      {$lookup: {
        from: 'buildings',
        localField: '_id',
        foreignField: '_id',
        as: 'building'
      }},
      {$unwind: '$building'},
      {$project: {'building': '$building.name.en', count: 1}},
      {$sort: {count: -1}}
     )
    .then((result) => console.log(type + '\n' + 'building results: ' , result));
}

function getCountPerDistrict(type) {
  return Listing
    .aggregate(
      {$match: {
        type: type
      }},
      {$lookup: {
        from: 'buildings',
        localField: 'building',
        foreignField: '_id',
        as: 'building'
      }},
      {$unwind: '$building'},
      {$lookup: {
        from: 'districts',
        localField: 'building.district',
        foreignField: '_id',
        as: 'district'
      }},
      {$unwind: '$district'},
      {$group: {
        _id: '$district',
        count: {$sum: 1}
      }},
      {$project: {_id: '$_id._id', district: '$_id.name.en', count: 1}}
      )
    .then((result) => console.log(type + '\n' + 'district results: ', result));
}

function distinctTypes() {
  return Listing
    .distinct('type', (error, types) => {
      for (i = 0; i < types.length; i ++) {
        getCountPerBuilding(types[i])
          .then(getCountPerDistrict(types[i]));
      }
    });
}

mongoose
  .connect('mongodb://justina:justinamindfundstudio@ds129610.mlab.com:29610/heroku_3n7tc9r8')
  .then(getCountPerSource)
  .then(distinctTypes);
