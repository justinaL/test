const Nightmare = require('nightmare');

function getLinksPerPage(nightmare) {
  return nightmare
    .evaluate(() => {
      const urls = $('#tpl-thumb a')
        .map((idx, elem) => {
          let type = 'rent';
          let $elem = $(elem);
          if ($elem.find('span.sell').length && $elem.find('span.rent').length) {
            type = 'both';
          } else if ($elem.find('span.sell').length) {
            type = 'buy';
          }
          return { type, url: elem.href };
        }).get();

      return { urls, nextPageDisabled: $('#pagination :not(.prev).disabled + li').hasClass('disabled') };
    })
    // .end()
    .then(({ urls, nextPageDisabled }) => {
      console.log('urls', urls);
      // return result;
      if (!nextPageDisabled) {
        return nightmare.wait(2000).click('#pagination :not(.prev).disabled + li')
          .then(() => getLinksPerPage(nightmare));
      }

      return nightmare.end();
    })
    .catch((error) => {
      console.error('error happened' , error);
    });
}

function getListingLinks () {
  const nightmare = Nightmare({
    show: true,
  });
  return nightmare
    .goto('http://en.midland.com.hk/find-property/#list')
    .then(() => getLinksPerPage(nightmare));
}

getListingLinks();
