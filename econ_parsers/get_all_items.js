// const treasures = require('treasures.json');
const items = require('./items_detail.json');
const pricesd2n = require('./prices_2dn.json');
const _ = require('underscore');

const fs = require('fs');
const http   = require('http');
const zlib   = require('zlib');
const async  = require('async');

var HttpGet = function( uri, encoding, callback )
{
    http.get(uri, function(res)
    {
        var chunks = [],
            output;

        if( res.headers['content-encoding'] == 'gzip' )
        {
            var gunzip = zlib.createGunzip();

            res.pipe(gunzip);
            output = gunzip;
        }
        else
        {
            output = res;
        }

        output.on('data', function(chunk)
        {
            chunks.push(chunk);
        });

        output.on('end', function()
        {
            callback(null, Buffer.concat(chunks).toString(encoding))
        });

    }).on('error', function(e)
    {
        if(e) return callback(e);
    });
};


function FillPrice(item) {
    const nameFilter = pricesd2n.filter(function(i){
	return i.c_market_name_en.indexOf(item.name) !== -1
    });
    
    // console.log(item)
    var price = 0

    if(nameFilter.length > 0) {
	price = nameFilter[0].c_price
    }
    
    item.price = price

    return item;
}

// Elder, Unusual, Heroic, Inscribed, FroZen, Corrupted, Genuine, Auspicious, Ascendant
const VALVE_ITEM_QUALITY  = ["Unusual","Auspicious","FroZen","Inscribed", "Elder","Heroic","Genuine", "Ascendant","Corrupted"];

const itemsResult = []
Object.keys(items).forEach(function(item){
    const _item = items[item]
    itemsResult.push({ name : item, quality : "", rarity : _item.rarity })
    VALVE_ITEM_QUALITY.forEach(function(q) {
	itemsResult.push({ name : q + " " + item, quality : q,  rarity : _item.rarity })
    })
})

fs.writeFileSync( __dirname + "/items_list.json", JSON.stringify(itemsResult, null, 4) )


const prices = itemsResult.map(function(i){
    return FillPrice(i)
}).filter(function(i){
    return i.price !== 0
})

const pricesRes = {}

prices.forEach(function(i){
    var price = parseFloat(i.price)

    var priceRub = price / 100;
    var course = 57.0;

    pricesRes[i.name] = parseFloat( parseFloat( priceRub / course ).toFixed(2) )
})

fs.writeFileSync( __dirname + "/prices.json", JSON.stringify(pricesRes) )

// console.log( FillPrice({ name : "Berserker's Pauldron", quality : "", rarity : "Common" }) )

// Отсеять все шмотки, для которых нет цен




// fs.writeFileSync( __dirname + "/prices.json", JSON.stringify(itemsResult, null, 4) )

/*
const prices = {}
const VALVE_ITEM_PRICE_URL_PREFIX = "http://steamcommunity.com/market/priceoverview/?currency=1&appid=570&market_hash_name=";

async.eachSeries(itemsResult, function(item,next) { 
     setTimeout(function() {
          console.log("Request item price", item);
	  const url = VALVE_ITEM_PRICE_URL_PREFIX + item
          HttpGet(url, 'utf-8', function(err, result) {
	    if(err) return next(err, item);
	    if(result == "null") {
		prices[item] = 0
		return next()
	    }

	    try {
		const data = JSON.parse(result)
		var priceValue = 0
	        if( data.success == true )
        	{
        	    priceValue = data.median_price == undefined ? data.lowest_price : data.median_price;      
        	    if( priceValue == undefined )
            		priceValue = 0;
        	    else
            		priceValue = parseFloat(priceValue.substring(1));
        	}
		console.log("Get item price", item, priceValue);
		prices[item] = priceValue

		fs.writeFileSync( __dirname + "/prices.json", JSON.stringify(prices, null, 4) )

		return next()
	    } catch(e) {
		return next(item + " JSON parse exception: " + result);
	    }
	  })
     }, 1000);
}, function (err, data) {
     if(err) {
	console.log(err);
	return fs.writeFileSync( __dirname + "/get_price.lock", data)
     }
    
     fs.writeFileSync( __dirname + "/prices.json", JSON.stringify(prices, null, 4) )

     console.log('Done going!');
});
*/