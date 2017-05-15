const Nightmare = require('nightmare');

function getListingLinks () {
  const nightmare = Nightmare({
    show: true,
  });

  return nightmare
    .goto('http://en.midland.com.hk/find-property/#list')
    .evaluate(() => {
      const urls = $('#tpl-thumb a')
        .map((idx, elem) => elem.href).get();
      return {
        urls,
      }
    })
    .end()
    .then((result) => {
      console.log('result', result);
      return result;
    })
    .catch((error) => {
      console.error('error happened' , error);
    });
    console.log('result', result);
}

getListingLinks();
