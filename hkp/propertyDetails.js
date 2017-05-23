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
  bedrooms,
  sourceRefId,
  images,
  type,
  rent,
  price,
  views,
  pool,
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
      listing.building = building;
      listing.views = views;
      listing.bedrooms = bedrooms;
      listing.pool = pool;
      listing.closed = closed;

      return listing.save();
    })
    .catch(error => console.error('updateListing error', error));
}

function getListingDetails(url){
  console.log('url', url);
  const nightmare = Nightmare({
    gotoTimeout: 60000,
    show: true,
  });
  if (url != 'http://app2.hkp.com.hk/cs/detail_layer.jsp?cs=y&stockId=undefined&lang=en') {
  return nightmare
    .goto(url)
    .evaluate(() =>
    {
      let buildingInfo = $('#divEbook td tr td td');
      const obj = {};
      for (i = 1; i <= buildingInfo.length - 2; i = i + 2) {
         const key = $('#divEbook td tr td td').eq(i - 1).text().trim().split('：')[0];
         obj[key] = $('#divEbook td tr td td').eq(i).text().trim();
      }
      buildingInfo = obj;

      const lat = parseFloat($('#mapframe').attr('src').split(',')[1].split('&')[0]);
      const long = parseFloat($('#mapframe').attr('src').split(',')[1].split('=')[1]);

      const result =  {
        sourceRefId: $('#divStockInfo .subjectTitle').text().split('Property ID:')[1].match(/([^)]+)Updated/)[1].trim(),
        source: 'Hong Kong Property',
        location: [lat, long],
        name: {en: buildingInfo['Building Name']},
        images: $(' .thumbs img').map((idx, elem) => $(elem).attr('src')).get(),
        pool: false,
      };

      if (!!$('#divStockInfo tr:nth-child(4) td').text().match(/([0-9]{1,3}(,[0-9]{3})*(\.[0-9]+)?|\.[0-9]+)/)) { 
        result.netArea = $('#divStockInfo tr:nth-child(4) td').text().match(/([0-9]{1,3}(,[0-9]{3})*(\.[0-9]+)?|\.[0-9]+)/)[1];
      }

      if (!!$('#divStockInfo tr:nth-child(5) td').text().match(/([0-9]{1,3}(,[0-9]{3})*(\.[0-9]+)?|\.[0-9]+)/)) {
        result.grossArea = $('#divStockInfo tr:nth-child(5) td').text().match(/([0-9]{1,3}(,[0-9]{3})*(\.[0-9]+)?|\.[0-9]+)/)[1];
      }

      const price = $('#divStockInfo .sell_desc_color').text().trim();
      if (price.length) {
        if(price.indexOf('(') != -1) {
          result.price = price.split('$')[2].split('(')[0];
        }else {
          result.price = price.split('$')[2];
        }
      }

      if ($('#divStockInfo .rent_desc_color').length) {
        result.rent = $('#divStockInfo .rent_desc_color').text().trim().split('$')[2];
      }

      let stockInfo = $('#divStockInfoMisc td').text().slice(0, -6);
      let bView = "";
      if (stockInfo.length) {
        stockInfo = stockInfo.trim().split(':')[1].split(',');
        for (i = 0; i < stockInfo.length; i ++) {
          if (stockInfo[i].indexOf('Bedroom') != -1) {
            result.bedrooms = stockInfo[i].match(/(\d+)/)[0];
          }
          if (stockInfo[i].indexOf('View') != -1) {
            bView = bView + stockInfo[i];
            const viewsElem = ['garden', 'sea', 'mountain', 'city', 'racecourse', 'building', 'open'];
            result.views = viewsElem.filter(view => bView.match(new RegExp(view, 'i')));
          }
          break;
        }
      }

      if (buildingInfo['Building Chinese Name']) {
        result.name.zh = buildingInfo['Building Chinese Name'];
      }
      // if (buildingInfo['No. of Carparking Space']) {
      //   result.parkings = buildingInfo['No. of Carparking Space'].match(/\d+/)[0];
      // }

      if (buildingInfo['Facilities'] && buildingInfo['Facilities'].indexOf('pool') != -1) {
        result.pool = true;
      }

      return result;
    })
    .end()
    .then((result) => {
      ['grossArea', 'netArea', 'bedrooms', 'price', 'rent']
        .forEach((key) => {
          // console.log('key: ', key, ', value: ', result[key]);
          if(result[key]) result[key] = numeral(result[key].toLowerCase()).value();
        });
        console.log('result', result);
        return result;
      })
    // .catch(error => console.error('error', error));
}
else {closed = true;}
}

function getAllListingDetails () {
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
            console.error('getAllLstingsError', error);
            listing.closed = true;
            return listing.save();
          });
      }, Promise.resolve());
    });
}
// getListingDetails();
module.exports = getAllListingDetails;
