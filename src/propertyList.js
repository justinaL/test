const Nightmare = require('nightmare');
const mongoose = require('mongoose');

const Listing = mongoose.model('Listing');

function createListing({ type, url }) {
  console.log('url? ', url);
  return Listing
    .findOneAndUpdate({
      type,
      sourceUrl: url,
    }, {
      $setOnInsert: {
        sourceUrl: url,
        source: 'midland',
        type,
      },
      closed: false,
    }, {
      upsert: true, new: true, setDefaultsOnInsert: true,
    });
}

function createListingByTypes({ type, url }) {
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
      $('#tpl-thumb a')
        .map((idx, elem) => {
          let type = 'rent';
          let $elem = $(elem);
          if ($elem.find('span.sell').length && $elem.find('span.rent').length) {
            type = 'both';
          } else if ($elem.find('span.sell').length) {
            type = 'buy';
          }
          return { type, url: elem.href };
        }).get()
    )
    .then((urls) => {
      // create listings in db
      return Promise.all(urls.map(createListingByTypes));
    })
    .then(() => {
      return nightmare
        .evaluate(() => $('#pagination :not(.prev).disabled + li').hasClass('disabled'));
      // evaluate nightmare to see if there's a valid next page button.
      // return { urls, nextPageDisabled: $('#pagination :not(.prev).disabled + li').hasClass('disabled') };
    })
    .then((nextPageDisabled) => {
      console.log('disabled? ', nextPageDisabled);
      // return result;
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
    // waitTimeout: 60000,
    // gotoTimeout: 60000,
    // openDevTools: true,
  });
  return nightmare
    .goto('http://en.midland.com.hk/find-property/#list')
    .then(() => getLinksPerPage(nightmare))
    .catch(error => {
      console.error('getListingLinks error', error);
      return nightmare.end();
    });
}

module.exports = getListingLinks;
