# IMPORT GEOJSON FILE

This node tool transforms a geojson file exchanging the latitude and longitude.

The output can be a geojson file or CosmosDB. Check [import geojson.js](import%20geojson.js) for details.

# SERVER 

The server code provides a rest api endpoint to deliver from CosmosDB all the polygons that are inside or intersect a rectangle boundary.

It exposes a GET "/iris" endpoint and expects two points as parameters x1,y1,x2,y2. It will return the geojson uploaded with the import geojson tool.

The indexing policy must be:
```json
{
    "indexingMode": "consistent",
    "automatic": true,
    "includedPaths": [
        {
            "path": "/*"
        }
    ],
    "excludedPaths": [
        {
            "path": "/\"_etag\"/?"
        }
    ],
    "spatialIndexes": [
        {
            "path": "/*",
            "types": [
                "Point",
                "Polygon",
                "MultiPolygon",
                "LineString"
            ]
        }
    ]
}
```