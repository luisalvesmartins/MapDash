// TRANSFORM GEOJSON TO THE RIGHT FORMAT COMPATIBLE WITH LEAFLET
// the output can be CosmosDB or a file
//
// For a new file ensure write2Cosmos=false and run in command line:
//    node "import geojson" > DESTFILE.geojson
// 
// For CosmosDB define the containerId and the configuration keys in config.js and run in command line:
//    node "import geojson" > log.txt
const CosmosClient = require('@azure/cosmos').CosmosClient
const fs = require('fs');
const config = require("./config");
const cosmosDAO = require("./CosmosDBDAO");

//CONFIG IT
config.containerId = "iris";
var write2Cosmos=false; //<- TO SCREEN ONLY

const cosmosClient = new CosmosClient({
    endpoint: config.host,
    key: config.authKey
})

async function main(){

    if (write2Cosmos){
        cosmos=new cosmosDAO(cosmosClient, config.databaseId, config.containerId);
        await cosmos.init();

        //DELETING ACTUAL
        var r=await cosmos.find("select * from c");
        console.log("delete " + r.length);
        for (let index = 0; index < r.length; index++) {
            const e= r[index];
            await cosmos.removeItem(e.id);
        }
    }

    console.log("[");

    //INSERTING
    var file='geojson/contours-iris.geojson';
    //var file='geojson/departements.geojson';
    var file='map/maps/departments.IT.geojson.orig';
    var json = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (let iElements = 0; iElements < json.features.length; iElements++) {
        var element=json.features[iElements];
        //console.log(element.properties)
        //element.id=element.properties.code;
        element.id=element.properties.code_iris; 
        element.id=element.properties.prov_istat_code_num; //IT
        //console.log(iElements + "/" + json.features.length + " element.id:" + element.id)

        //CHANGE lat<->lon
        var coor=element.geometry.coordinates;
        if (element.geometry.type=="Polygon"){
            var transverOut=[];
            for (let iOut = 0; iOut < coor.length; iOut++) {
                var transv=[];
                for (let index = 0; index < coor[0].length; index++) {
                    const cc = coor[0][index];
                    transv.push([cc[1],cc[0]]);
                }
                transverOut.push(transv);
            }
            element.geometry.coordinates=transverOut;
        }
        if (element.geometry.type=="MultiPolygon"){
            // console.log(element.geometry.coordinates);
            // console.log(coor.length);
            var transverOut=[];
            for (let iOut = 0; iOut < coor.length; iOut++) {
                // console.log(coor[iOut]);
                var transverOut2=[];
                for (let iOut2 = 0; iOut2 < coor[iOut].length; iOut2++) {
                    var transv=[];
                    for (let index = 0; index < coor[iOut][iOut2].length; index++) {
                        const cc = coor[iOut][iOut2][index];
                        transv.push([cc[1],cc[0]]);
                    }
                    transverOut2.push(transv);
                }
                transverOut.push(transverOut2);
                // console.log(transverOut2);
            }
            element.geometry.coordinates=transverOut;
        }
            console.log(JSON.stringify(element) + ",");
        if (write2Cosmos)
            await cosmos.addItem(element);
    };
    console.log("]");

}

main();