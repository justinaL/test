/*
Get price, rent, address, building name, saleable area, gross area, no. of bedrooms, no. of bathrooms, view e.g. ['open', 'garden'] from a listing page
*/


const Nightmare = require('nightmare');
const numeral = require('numeral');

const engDomain = 'http://en.midland.com.hk';
const chiDomain = 'http://www.midland.com.hk';

function getListingEngDetails(url) {
  const nightmare = Nightmare({
    waitTimeout: 60000,
  });

  return nightmare
    .goto(`${engDomain}/${url}`)
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

      const long = $('#sect-map a').attr('href').split(",")[0].split("=")[1];
      const lat = $('#sect-map a').attr('href').split(",")[1].split("&")[0];
      const result = {
        stockInfo,
        netArea: $('#stockEstateInfo .net_area').text().match(/([0-9]{1,3}(,[0-9]{3})*(\.[0-9]+)?|\.[0-9]+)/)[1],
        grossArea: $('#stockEstateInfo .area').text().match(/([0-9]{1,3}(,[0-9]{3})*(\.[0-9]+)?|\.[0-9]+)/)[1],
        buildingUrl: $('#stockEstateInfo .custom-btn').first().attr('href'),
        bedrooms: $('.desktop-content:nth-child(1) .label-group:nth-child(4) p').text().match(/(\d+) room/)[1],
        sittingRoom: $('.desktop-content:nth-child(1) .label-group:nth-child(4) p').text().substring(1).match(/\d+/)[0],
        source: 'midland',
        sourceRefId: $('#stockDetailWrapper .inner p').text().split(": ")[1].slice(0, -1),
        name: {
          en: $('.big-title').text().split('Saleable')[0],
        },
        district: $('#stockDetailWrapper .inner p').text().split("(")[0].trim(),
        images: $('[rel="propertyPhotos"]').map((idx, elem) => $(elem).attr('data-fancybox-href')).get(),
        addressURL: $('#sect-map a').attr('href'),
        coordinates: [lat + ", " + long],
      };

      const rentElem = $('#stockDetailWrapper .rent-color');
      if (rentElem.length) {
        if (rentElem.text().indexOf(":") >= 0) {
          result.rent = rentElem.text().match(/\:(.*)/)[1];
        }
        else{
          result.rent = rentElem.text().match(/\)(.*)/)[1];
        }

      }

      const priceElem = $('.nowrap');
      if (priceElem.length) {
        result.price = priceElem.text().match(/\)(.*)/)[1];
      }

      if (stockInfo.hasOwnProperty('Description') && stockInfo.hasOwnProperty('View')){
        result.stockInfo = "Description: " + stockInfo['Description'] + " View: " + stockInfo['View'];
      }
      else if (stockInfo.hasOwnProperty('View') && stockInfo.hasOwnProperty('Description') == false) {
        result.stockInfo = "View: " + stockInfo['View'];
      }
      else {
        result.stockInfo = "Orientation: " + stockInfo['Orientation'];
      }

      $('.big-title .btnPrice').remove();

      result.buildingName = $('.big-title').text();
      
      return result;
    })
    .end()
    .then((result) => {
      result.grossArea = parseInt(result.grossArea);
      result.netArea = parseInt(result.netArea);
      result.bedrooms = parseInt(result.bedrooms);
      result.sittingRoom = parseInt(result.sittingRoom);
      
      if (result.price) {
        result.price = numeral(result.price.toLowerCase()).value();
      }

      if (result.rent) {
        result.rent = numeral(result.rent).value();
      }
      
      return result;
     })
    .catch((error) => {
      console.error('error happened', error);
    });
}

function getListingChineseDetails(url) {
  const nightmare = Nightmare();

  return nightmare
    .goto(`${chiDomain}/${url}`)
    .evaluate(() => {
      $('.big-title .btnPrice').remove();

      return $('.big-title').text();
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
      result.name.zh = chiResult;

      return result;
    })
    .catch(error => console.error(error));
}

const urls = [
  'find-property-detail/Flat%20E-High%20Floor-Tower%2009-Villa%20Verde-Laguna%20Verde-Hung%20Hom-Whampoa-KL165269', // with view
  'find-property-detail/天晉2期3B座高層B室-將軍澳站-NT295368?_ga=2.263459468.1035400097.1494567002-164314101.1494566995', // without view
  'find-property-detail/High%20Floor-Block%202-May%20Tower-Central%20Mid-Levels%20&%20Admiralty-HK65210',
];

urls.reduce((promise, url) => {
  return promise
    .then(() => getListingDetails(url))
    .then((result) => console.log('result', result));
}, Promise.resolve());