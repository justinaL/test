/*
Get price, rent, address, building name, saleable area, gross area, no. of bedrooms, no. of bathrooms, view e.g. ['open', 'garden'] from a listing page
*/

const mongoose = require('mongoose');
const mongooseIntl = require('mongoose-intl');
const BuildingSchema = require('./schemas/building.schema');
const ListingSchema = require('./schemas/listing.schema');

mongoose.connect('mongodb://localhost:27017/test');

mongoose.plugin(mongooseIntl, { languages: ['en', 'zh'], defaultLanguage: 'en' });

mongoose.model('Listing', ListingSchema);
mongoose.model('Building', BuildingSchema);

const getListingLinks = require('./propertyList');
const getListingDetails = require('./propertyDetails');
const getBuildingDetails = require('./propertyDetails');
getListingLinks()
  .then(getListingDetails);
