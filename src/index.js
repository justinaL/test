/*
Get price, rent, address, building name, saleable area, gross area, no. of bedrooms, no. of bathrooms, view e.g. ['open', 'garden'] from a listing page
*/

const mongoose = require('mongoose');
const BuildingSchema = require('./schemas/building.schema');
const mongooseIntl = require('mongoose-intl');

mongoose.connect('mongodb://localhost:27017/test');

mongoose.plugin(mongooseIntl, { languages: ['en', 'zh'], defaultLanguage: 'en' });
