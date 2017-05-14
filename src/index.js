/*
Get price, rent, address, building name, saleable area, gross area, no. of bedrooms, no. of bathrooms, view e.g. ['open', 'garden'] from a listing page
*/


const Nightmare = require('nightmare');

const nightmare = Nightmare({
  show: true,
});



function getListingDetails() {
  return nightmare
    .goto(//'http://en.midland.com.hk/find-property-detail/Flat%20E-High%20Floor-Tower%2009-Villa%20Verde-Laguna%20Verde-Hung%20Hom-Whampoa-KL165269') // with view
          'http://en.midland.com.hk/find-property-detail/High%20Floor-Block%202-May%20Tower-Central%20Mid-Levels%20&%20Admiralty-HK65210')
          //'http://en.midland.com.hk/find-property-detail/天晉2期3B座高層B室-將軍澳站-NT295368?_ga=2.263459468.1035400097.1494567002-164314101.1494566995') // without view
    .evaluate(() => {
      const stockInfo = $('.desktop-content:nth-child(1) .label-group')
        .map((idx, elem) => $(elem).text().trim())
        .get()
        .reduce((obj, string) => {
          const key = string.split(':')[0].trim();
          obj[key] = string.split(':')[1].trim();
          if (obj.hasOwnProperty('View')){
            return obj['View'];
          }
          else {
            return obj;
          }
        }, {});

      return {
        stockInfo,
        rent: $('#stockDetailWrapper .rent-color').text().match(/\)(.*)/)[1],
        price: $('.nowrap').text().match(/\)(.*)/)[1],
        saleableArea: $('#stockEstateInfo .net_area').text().match(/([0-9]{1,3}(,[0-9]{3})*(\.[0-9]+)?|\.[0-9]+)/)[1],
        grossArea: $('#stockEstateInfo .area').text().match(/([0-9]{1,3}(,[0-9]{3})*(\.[0-9]+)?|\.[0-9]+)/)[1],
        buildingUrl: $('#stockEstateInfo .custom-btn').first().attr('href'),
        bedrooms: $('.desktop-content:nth-child(1) .label-group:nth-child(4) p').text().match(/(\d+) room/)[1],
        sittingRoom: $('.desktop-content:nth-child(1) .label-group:nth-child(4) p').text().substring(1).match(/\d+/)[0],
      };
    })
    .end()
    .then((result) => {
       console.log('result: ', JSON.stringify(result, null, 2));
     })
    .catch((error) => {
      console.error('error happened', error);
    });
}

getListingDetails();
