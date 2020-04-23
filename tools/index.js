const CosmosClient = require('@azure/cosmos').CosmosClient
const fs = require('fs');
const express=require('express');

const config = require("./config");
const cosmosDAO = require("./CosmosDBDAO");

var cosmos;

async function main(){
    const cosmosClient = new CosmosClient({
        endpoint: config.host,
        key: config.authKey
    })

    cosmos=new cosmosDAO(cosmosClient, config.databaseId, "iris");
    await cosmos.init();
}

var app=express();

app.get('/iris', async function (req, res) {
    var x1=req.query.x1;
    var y1=req.query.y1;
    var x2=req.query.x2;
    var y2=req.query.y2;

    //GET THE POLYGONS INSIDE AND INTERSECTING THE BOUNDING BOX
    var q=`select * from c 
    where ST_WITHIN(c.geometry, { 
        'type':'Polygon', 
        'coordinates': [[[${x1},${y2}], [${x1},${y1}], [${x2},${y1}], [${x2},${y2}], [ ${x1},${y2}]]] 
        }) OR
         ST_INTERSECTS(c.geometry, { 
            'type':'Polygon', 
            'coordinates': [[[${x1},${y2}], [${x1},${y1}], [${x2},${y1}], [${x2},${y2}], [ ${x1},${y2}]]] 
            })`;

    var r=await cosmos.find(q);
    res.send(r);
})

var server=app.listen(process.env.PORT || 3000);

main();