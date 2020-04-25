var dataSources, GraphsDescription, InfoFormats, Simulations, GeoLayers, MAPSOURCE;

async function initMapDash(configFile){
    var file=JSON.parse(await loadJSONAsync("GET",configFile));
    dataSources=file.dataSources;
    GraphsDescription=file.charts;
    InfoFormats=file.info;
    Simulations=file.simulations;
    GeoLayers=file.POIlayers;
    MAPSOURCE=file.map;

    //PERFORM PAGE TRANSLATION
    //await Translation.localize({language:"fr",path:"assets/translation"});

    var dt=new Date();
    dt.setDate( dt.getDate() - 1 )
    document.getElementById("txtDate").value=dt.toISOString().substr(0,10);
    document.getElementById("mapid").style.height=window.innerHeight + "px";
    document.getElementById("mapid").style.width=window.innerWidth + "px";

    mymap = L.map('mapid').setView(MAPSOURCE.center, MAPSOURCE.zoom);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoibHVpc2FsdmVzbWFydGlucyIsImEiOiJjazkydGtiaXcwMzRwM2dvYW50MHViajZ4In0.fayZN9j4ln1Qqgc21hRS-g'
    }).addTo(mymap);
    mymap.zoomControl.setPosition('topright');

    sidebar = L.control.sidebar({
        autopan: true,       // whether to maintain the centered map point when opening the sidebar
        closeButton: true,    // whether t add a close button to the panes
        container: 'sidebar', // the DOM container or #ID of a predefined sidebar container that should be used
        position: 'left',     // left or right
    }).addTo(mymap);
    sidebar.on('opening', function(e) {
        if (e.id!="graphs")
            actualChart=null;
        // e.id contains the id of the opened panel
    })
    sidebar.on('content', function(e) {
        // e.id contains the id of the opened panel
        switch (e.id) {
            case "graphs":
                Do.Graph();
                break;
            case "data":
                Do.Data();
                break;
            case "info":
                Do.Info();
                break;
            case "simulate":
                Do.SimShow();
                break;
            case "search":
                break;
            case "layers":
                Do.LayersEdit();
                break;
            case "intro":
                //nothing to do here
                break;
            default:
                console.log(e);
                break;
        }
    })

    mymap.createPane('DEP');
    mymap.createPane('IRIS');
    mymap.createPane('LABELS');
    mymap.createPane('ARROWS');

    mymap.getPane('DEP').style.zIndex = 400;
    mymap.getPane('LABELS').style.zIndex = 401;
    mymap.getPane('ARROWS').style.zIndex = 402;
    
    mymap.getPane('LABELS').style.pointerEvents = 'none';
    mymap.getPane('ARROWS').style.pointerEvents = 'none';

    // geojson = L.geoJson([], {
    //     pane:'IRIS',
    //     style: interact.style,
    //     onEachFeature: interact.onEachFeature
    //     ,id:"IRIS"
    // }).addTo(mymap);

    // mymap.on("zoomend",processEvent);
    // mymap.on("moveend",processEvent);

    Do.selMap(0);
    sidebar.open('intro')

    L.AddLabel = L.Icon.extend({
        options: {
            iconAnchor: new L.Point(10, -20)
        },
        createIcon: function () {
            var div = document.createElement('div');
            var numdiv = document.createElement('div');
            numdiv.setAttribute ( "class", "number" );
            numdiv.innerHTML = this.options['number'] || '';
            numdiv.style.borderRadius='5px';
            numdiv.style.color='black';
            numdiv.style.backgroundColor=Do._getColor(this.options['number']);
            numdiv.style.fontSize='10px';
            div.appendChild ( numdiv );
            this._setIconStyles(div, 'icon');
            return div;
        }
    });

    var icons=[];
    GeoLayers.forEach(g=>{
        //create the icon
        icons[g.icon] = L.icon({
            iconUrl:'assets/' + g.icon,
            iconSize:     [32, 32], // size of the icon
            iconAnchor:   [16, 32], // point of the icon which will correspond to marker's location
            popupAnchor:  [0, -32] // point from which the popup should open relative to the iconAnchor
        });
        mymap.createPane("PANE_" + g.id);

        if (!g.display)
            mymap.getPane("PANE_" + g.id).style.display='none';

        // var layer = L.geoJson([], {
        //     id:g.id
        // }).addTo(mymap);
        // layers.push(layer);
    })

    //ADD THE LAYERS
    GeoLayers.forEach(g=>{
        mapLayers.push({id:g.id,title:g.title,display:g.display})

        loadJSON( g.url ,function(data){
            var gData=JSON.parse(data);
            for (let i = 0; i < gData.features.length; i++) {
                const M = gData.features[i];
                var name=valueOfPath(g.nameField,M.properties);
                var marker = L.marker(
                    [M.geometry.coordinates[1], M.geometry.coordinates[0]],
                    {
                        icon:icons[g.icon], 
                        pane:'PANE_' + g.id
                    }
                    ).addTo(mymap).bindPopup(name);
            }
        });
    })

    // Resize map with resize of screen
    window.addEventListener('resize', function(event) {
        document.getElementById("mapid").style.height=window.innerHeight + "px";
        document.getElementById("mapid").style.width=window.innerWidth + "px";
    });
}