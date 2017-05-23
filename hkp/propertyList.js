const Nightmare = require('nightmare');
const mongoose = require('mongoose');

const Listing = mongoose.model('Listing');

function createListing({ type, url }) {
  console.log('url', url);
  return Listing
    .findOneAndUpdate({
      type,
      sourceUrl: url,
    }, {
      $setOnInsert: {
        sourceUrl: url,
        source: 'Hong Kong Property',
        type,
      },
      closed: false,
    }, {
      upsert: true, new: true, setDefaultsOnInsert: true,
    });
}

function createListingByTypes({ type, id }) {
  const domain = 'http://app2.hkp.com.hk/cs/detail_layer.jsp?cs=y&stockId=';
  const lang = '&lang=en';
  const url = `${domain}${id}${lang}`;
  if (type === 'both') {
    return Promise.all([
      createListing({
        type: 'buy',
        url,
      }),
      createListing({
        type: 'rent',
        url,
      }),
    ]);
  }
  
  return createListing({ type, url });
}

function getLinksPerPage(nightmare) {
  return nightmare
    .evaluate(() => 
      $('#tpl-thumb div')
        .map((idx, elem) => {
          let type = 'rent';
          let $elem = $(elem);
          if ($elem.find('span.sell').length && $elem.find('span.rent').length) {
            type = 'both';
          } else if ($elem.find('span.sell').length) {
            type = 'buy';
          }          
          return {type, id: $elem.attr('id')};
        })
        .get()
        .filter(obj => !!obj.id)
        // [{ type: 'buy', id: 'ZX1234124'}, { type: 'buy', id: undefined }]
    )
    .then((ids) => {
      // create listings in db
      return Promise.all(ids.map(createListingByTypes));
    })
    .then(() => {
      return nightmare
        .evaluate(() => $('#pagination :not(.prev).disabled + li').hasClass('disabled'));
      // evaluate nightmare to see if there's a valid next page button.
    })
    .then((nextPageDisabled) => {
      if (!nextPageDisabled) {
        return nightmare.wait(2000).click('#pagination :not(.prev).disabled + li')
          .then(() => getLinksPerPage(nightmare));
      }
      return nightmare.end();
    });
}

function getListingLinks () {
  const nightmare = Nightmare({
    show: true,
  });
  return nightmare
    .goto('http://en.hkp.com.hk/find-property/#list')
    .then(() => getLinksPerPage(nightmare))
    .catch(error => {
      console.error('getListingLinks error', error);
      return nightmare.end();
    });
}

// getListingLinks();
module.exports = getListingLinks;
