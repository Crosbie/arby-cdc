var express = require('express');
var router = express.Router();
var axios = require('axios');
var async = require('async');

var APP_URL = "https://price-api.crypto.com/price/v1/tokens?page=1&limit=50";
var EXCHANGE_URL = "https://price-api.crypto.com/market/v1/token/SLUG/cdc-pair";
var appPrices = [];
var exchangePrices = [];
var newList = [];

axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.post['Content-Type'] ='application/json';


/* GET home page. */
router.get('/', function(req, res, next) {
  newList = [];
  getAppPrices(function(err,data){

    async.each(appPrices,function(coin,next){
      getExchangePrice(coin,next)
      },
      function(err){
        console.log('DONE');
        newList.sort(function(a, b){
          return b.priceDiff - a.priceDiff;
        })
        res.json(newList);
      })
  })    
    // res.render('index', { title: 'Express' });
  
  
});


function getAppPrices(cb){
  var options


  axios
  .get(APP_URL, {withCredentials: false})
  .then(res => {
    console.log(`statusCode: ${res.status}`);
    console.log('Got '+ res.data.data.length + ' tickers');
    appPrices = res.data.data;

    // remap Data
    appPrices = appPrices
    
    .filter(item => 
      item.exchange_tradable && item.app_tradable
    )
    .map(function(item, index){
      var obj = {};
      // console.log(item);
      // if(!item.exchange_tradable || !item.app_tradable){
      //   return;
      // }
      obj.symbol = item.symbol;
      obj.slug = item.slug;
      obj.appPrice = item.usd_price;
      return obj;
    })

    return cb(null, appPrices);
    
  })
  .catch(error => {
    console.error(error);
  });
}

function getExchangePrice(coin,cb){
  var url = EXCHANGE_URL;
  url = url.replace('SLUG',coin.slug);
  axios
  .get(url)
  .then(res => {
    // console.log(`statusCode: ${res.status}`);
    coin.exPrice = res.data.quote_usd_price;
    coin.priceDiff = percentDiff(coin.appPrice, coin.exPrice);
    newList.push(coin);

    if(coin.priceDiff >= 5){
      console.log('5% diff on %d!!!!',coin.symbol);
    }

    if(coin.exPrice > coin.appPrice){
      console.log('APP CHEAPER',coin.symbol);
    }
    return cb(null, coin);
    
  })
  .catch(error => {
    console.error(error);
  });
}

function percentDiff(a, b) {
  return  100 * Math.abs( ( a - b ) / ( b ) );
 }

module.exports = router;
