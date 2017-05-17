/*
Get price, rent, address, building name, saleable area, gross area, no. of bedrooms, no. of bathrooms, view e.g. ['open', 'garden'] from a listing page
*/

const mongoose = require('mongoose');
const mongooseIntl = require('mongoose-intl');
const BuildingSchema = require('./schemas/building.schema');
const ListingSchema = require('./schemas/listing.schema');

mongoose.connect('mongodb://localhost:27017/test');

mongoose.plugin(mongooseIntl, { languages: ['en', 'zh'], defaultLanguage: 'en' });

mongoose.model('Building', BuildingSchema);
mongoose.model('Listing', ListingSchema);

const getListingLinks = require('./propertyList');
const getListingDetails = require('./propertyDetails');
getListingLinks();
// getListingDetails('https://en.midland.com.hk/find-property-detail/Flat%20E-High%20Floor-Tower%2007-The%20Reach-Yuen%20Long%20%20Kam%20Tin-NT304802');
