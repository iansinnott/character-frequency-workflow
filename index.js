const querystring = require('querystring');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const alfy = require('alfy');

const ENDPOINT = 'http://hskhsk.pythonanywhere.com';

const makeUrl = hz => {
  const qs = querystring.stringify({ q: hz, expand: 'yes' });
  return ENDPOINT + '/cidian?' + qs;
};

const Box = x => ({
  map: f => Box(f(x)),
  unwrap: () => x,
});

const fetchResults = character => {
  const url = makeUrl(character);
  return fetch(url)
    .then(x => x.text())
    .then(html => cheerio.load(html))
    .then($ => {
      const metaBox = Box($('table td b'));
      const frequency = metaBox
        .map(x => x.text())
        .map(x => x.trim())
        .map(x => x.match(/Word: freq index\s+(\d+)/i))
        .map(x => x[1])
        .map(Number)
        .unwrap();

      const compounds = Box($('.outerbox'))
        .map(xs => xs.eq(xs.length - 1)) // Take the last outerbox
        .map(x => x.find('a'))
        .map(xs => {
          return Array.from(xs).map(x => ({
            ...x.attribs,
            innerText: $(x).text(),
          }));
        })
        .map(xs => xs.filter(x => x.class !== 'arrowlink'))
        .map(xs =>
          xs.reduce((agg, x) => {
            const last = agg[agg.length - 1];

            if (last && last.href === x.href) {
              last.innerText += x.innerText;
            } else {
              agg.push(x);
            }

            return agg;
          }, [])
        )
        // .map(x => {
        //   debugger;
        //   return x;
        // })
        .unwrap();

      return { compounds, frequency, url };

      // console.log(compounds.map(x => x.innerText + '\t' + x.title).join('\n'));
    });
};

const main = character => {
  fetchResults(character)
    .then(({ compounds, frequency }) => {
      const results = compounds.map(x => ({
        title: x.innerText,
        subtitle: x.title,
        arg: ENDPOINT + x.href,
      }));
      alfy.output(results);
    })
    .catch(err => {
      alfy.output([
        {
          title: character,
          subtitle: 'No results could be parsed. Enter to view the live site.',
          arg: makeUrl(character),
        },
      ]);

      // NOTE: I can't seem to log errors and also output a fallback at the same
      // time...
      // console.error(err);
      // alfy.log(err);
    })
    .catch(err => {
      console.error('System error');
      alfy.log(err);
    });
};

if (require.main === module) {
  const character = process.argv[2];
  main(character);
}
