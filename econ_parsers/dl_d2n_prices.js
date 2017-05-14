const fs = require('fs');
const http   = require('http');
const zlib   = require('zlib');
const csv = require('csvtojson')
const request = require('request')

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


const prices = []

HttpGet('http://market.dota2.net/itemdb/current_570.json', 'utf-8', function(err, result){
    var dlData = JSON.parse(result)
    var dlUrl = 'http://market.dota2.net/itemdb/' + dlData.db

    csv({ delimiter : ';' })
    .fromStream(request.get(dlUrl))
    .on('json',(json)=>{
	prices.push(json)
//	fs.writeFileSync( __dirname + "/prices_2dn.json", JSON.stringify(json))
//	console.log("Write");
    })
    .on('done',(error)=>{
        fs.writeFileSync( __dirname + "/prices_2dn.json", JSON.stringify(prices))
	console.log("Done")
    })
})

