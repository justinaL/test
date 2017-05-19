const Nightmare = require('nightmare');
const numeral = require('numeral');
const mongoose = require('mongoose');
const Listing = mongoose.model('Listing');
const Building = mongoose.model('Building');

function createBuilding({ name, location }) {
  return Building
    .findOneAndUpdate({
      'name.en': name.en,
    }, {
      $setOnInsert: {
        name,
      },
      location: {
        type: 'Point',
        coordinates: location,
      },
    }, {
      upsert: true, new: true, setDefaultsOnInsert: true,
    });
}

function updateListing(listing, {
  name,
  location,
  netArea,
  grossArea,
  stockInfo,
  sittingRoom,
  bedrooms,
  sourceRefId,
  images,
  type,
  rent,
  price,
  parkings,
  roofTop,
  views,
  closed,
}) {
  return createBuilding({ name, location })
    .then((building) => {
      if (listing.type === 'rent') {
        listing.price = rent;
      } else {
        listing.price = price;
      }

      listing.location = location;
      listing.netArea = netArea;
      listing.grossArea = grossArea;
      listing.sourceRefId = sourceRefId;
      listing.images = images;
      listing.parkings = parkings;
      listing.closed = closed;
      listing.building = building;
      listing.views = views;
      listing.bedrooms = bedrooms;
      listing.roofTop = roofTop;

      return listing.save();    
    })
    .catch(error => console.error('updateListing error', error));
}

function updateBuilding (building, {name, location}) {
   building.name = name;
   building.location = location;

   return building.save();
}

const engDomain = 'https://en.midland.com.hk';
const chiDomain = 'https://www.midland.com.hk';

function getListingEngDetails(url) {
  const nightmare = Nightmare({
    gotoTimeout: 60000,
    show: true,
  });

  return nightmare
    .goto(`${engDomain}${url}`)
    .wait('#sect-map a')
    .evaluate(() => {
      const stockInfo = $('.desktop-content:nth-child(1) .label-group')
        .map((idx, elem) => $(elem).text().trim())
        .get()
        .reduce((obj, string) => {
          const key = string.split(':')[0].trim();
          obj[key] = string.split(':')[1].trim();
          return obj;
        }, {});

      const long = parseFloat($('#sect-map a').attr('href').split(",")[0].split("=")[1]);
      const lat = parseFloat($('#sect-map a').attr('href').split(",")[1].split("&")[0]);

      const result = {
        stockInfo,
        source: 'midland',
        sourceRefId: $('#stockDetailWrapper .inner p').text().split(": ")[1].slice(0, -1),
        name: {
          en: $('.big-title').text().split('Saleable')[0],
        },
        images: $('[rel="propertyPhotos"]').map((idx, elem) => `https:${$(elem).attr('data-fancybox-href')}`).get(),
        location: [lat, long],
      };

      const rentElem = $('#stockDetailWrapper .rent-color');
      if (rentElem.length) {
          result.rent = rentElem.text().match(/\)(.*)/)[1];
        }

      const priceElem = $('.nowrap').text();
      if (priceElem.length) {
        result.price = priceElem.match(/\)(.*)/)[1];
      }

      const netArea = $('#stockEstateInfo .net_area').text();
      if(netArea.length) {
        result.netArea = netArea.match(/([0-9]{1,3}(,[0-9]{3})*(\.[0-9]+)?|\.[0-9]+)/)[1];
      }

      const sittingRoom = $('.desktop-content:nth-child(1) .label-group:nth-child(4) p').text();
      if (sittingRoom.indexOf('sitting') != -1){
        result.sittingRoom = sittingRoom.match(/(\d+) sitting/)[1];
      }

      const bedrooms = $('.desktop-content:nth-child(1) .label-group:nth-child(4) p').text();
      if (bedrooms.indexOf('room') != -1) {
        result.bedrooms = bedrooms.match(/(\d+) room/)[1];
      }

      const grossArea = $('#stockEstateInfo .area').text();
      if (grossArea.length) {
        result.grossArea = grossArea.match(/([0-9]{1,3}(,[0-9]{3})*(\.[0-9]+)?|\.[0-9]+)/)[1];
      }

      if (stockInfo['Description']) {
        const parkings = stockInfo['Description'].match(/(\d+) Covered/);
        if(parkings && parkings.length) {
          result.parkings = parkings[1];
        }
        const roofTop = stockInfo['Description'].match(/roof top/);
        if (roofTop && roofTop.length){
          result.roofTop = true;
        }
      }

      const viewsElem = ['garden', 'sea', 'mountain', 'city', 'racecourse', 'building', 'open'];
      if (stockInfo['View']){
        result.views = viewsElem.filter(view => !!stockInfo['View'].match(new RegExp(view, 'i')));
      }

      $('.big-title .btnPrice').remove();

      result.buildingName = $('.big-title').text();
      
      return result;
    })
    .end()
    .then((result) => {
      ['grossArea', 'netArea', 'bedrooms', 'sittingRoom', 'price', 'rent', 'parkings']
        .forEach((key) => {
          if (result[key]) result[key] = numeral(result[key].toLowerCase()).value();
        });
      return result; 
     });
}

function getListingChineseDetails(url) {
  const nightmare = Nightmare({
    show: true,
  });

  return nightmare
    .goto(`${chiDomain}${url}`)
    .wait(() => {
      return $('.big-title').length || $('#content td').text().trim() === '沒有樓盤資料';
    })
    .evaluate(() => {
      $('.big-title .btnPrice').remove();

      let closed = false;
      if ($('#content td').text().trim() === '沒有樓盤資料' || $('.selectorgadget_selected') == null) {
        closed = true;
      }

      return { name: $('.big-title').text(), closed };
    })
    .end();
}

function getListingDetails(url) {
  return Promise.all([
    getListingEngDetails(url),
    getListingChineseDetails(url),
  ])
    .then(([engResult, chiResult]) => {
      const result = Object.assign({}, engResult);

      if (result.name) {
        result.name.zh = chiResult.name;
      }

      return result;
    });
}

function getAllListingDetails() {
  return Listing
    .find({
      closed: false,
    })
    .sort({
      updatedAt: 1,
    })
    .then((listings) => {
      return listings.reduce((promise, listing) => {
        return promise
          .then(() => getListingDetails(listing.sourceUrl))
          .then((result) => updateListing(listing, result))
          .catch((error) => {
            listing.closed = true;

            return listing.save();
          });
      }, Promise.resolve());
    });
}

module.exports = getAllListingDetails;