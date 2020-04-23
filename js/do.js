var lastURL="";
var lastData=[];
var actualDataSource=null;
var actualInfoFormat=null;
var actualChart=null;
var geojsonDEP;//, geojson;
var mymap;
var sidebar;

var grades=[];
var Layer_Legend=null;
var selectedArea=null;

var mapLayers=[
    {id:"polygons",title:"Polygons",display:true},
    {id:"labels",title:"Map Values",display:false}
];

var layersPane=null;
var flowPane=null;

var Do={
    //#region MAP
    selMap:function(n){
        actualDataSource=n;
        actualInfoFormat=InfoFormats.findIndex(e=>e.id==dataSources[n].infoFormat);
        sidebar.close();
        Do.Map(n);
    },
    Map:function(n){
        //SHOW/HIDE LAYERS
        GeoLayers.forEach(g=>{
            //console.log(g.id);
            var v=mapLayers.find(l=>l.id==g.id);
            if (v)
            {
                v=v.display;
                if (v)
                    mymap.getPane("PANE_" + g.id).style.display='block';
                else
                    mymap.getPane("PANE_" + g.id).style.display='none';
            }
        })

        //MAP
        var DS=dataSources[n];
    
        var url=detokenURL(DS.url);
        if (url!=lastURL){
            loadJSON( url ,function(data){
                lastURL=url;
                Do._MapCore(DS,JSON.parse(data));
            })
        }
        else
        {
            Do._MapCore(DS,lastData);
        }
    },
    _MapCore:function(DS,data){
        //CHEATING, I KNOW, THIS IS BECAUSE THE SOURCE DATA AVAILABLE HAD A FLAT STRUCTURE
        //AND NOT CLEANED. NEED TO ADD A FILTER TO IT (TODO)
        if (MAPSOURCE.title=="Italy"){ 
            var lixo=data;
            var lixo2=[];
            lixo.forEach(j=>{
                if (j.data=="2020-03-19T17:00:00")
                {
                    lixo2.push(j);
                }
            })
            data=lixo2;
        }
        //CHEAT ENDS HERE

        var dataToShow=[];
        var j=data;
        lastData=j;
        var areaField=DS.areaField || "area";
        for(var i=0;i<j.length;i++){
            var v=valueOfPath(DS.field,j[i]);
            var area=valueOfPath(areaField,j[i]);
            dataToShow.push({area:area,value:v})
        }
    
        loadJSON(MAPSOURCE.file,function(response) {
            Do._MapCoreDrawLayer(dataToShow, JSON.parse(response), DS);
        });
    },
    _MapCoreDrawLayer:function(dataToShow, ar, format){
        if (flowPane!=null){
            flowPane.destroy();
            flowPane=null;
        }
        var bDrawLabels=mapLayers.find(l=>l.id=="labels").display;
        var bDrawPolygons=mapLayers.find(l=>l.id=="polygons").display;

        if (dataToShow.length==0)
            return;

        var orderedOnArea=dataToShow.sort((a,b)=>{if (a.area>b.area) return 1; else return -1});
        var lastArea=orderedOnArea[0].area;
        var total=orderedOnArea[0].value;
        var newDataToShow=[];
        var max=total;
        for (let index = 0; index < orderedOnArea.length; index++) {
            const r = orderedOnArea[index];
            if (r.area!=lastArea){
                newDataToShow.push({area:lastArea, value:total});
                if (total>max)
                    max=total;
                lastArea=r.area;
                total=0;
            }
            total+=r.value;
        }
        if (total>max)
            max=total;
        newDataToShow.push({area:lastArea, value:total});


        //var max=Math.max.apply(Math, dataToShow.map(function(o) { return o.value; }))
        var nIntervals=format.intervals.number;

        //DEFINE GRADES "percentile" or "normal"
        grades=[];
        if (format.intervals.type=="percentile"){
            var ordered=newDataToShow.sort(function(a,b){if (a.value>b.value) return 1; else return -1})
            for(let i=0;i<nIntervals;i++){
                var nn=Math.floor(ordered.length*i/nIntervals);
                nn=ordered[nn].value;
                grades.push(nn);
            }
            console.log(grades)
        }
        else{        
            for(let i=0;i<nIntervals;i++){
                if (format.intervals.round)
                    grades.push(Math.floor(max/nIntervals*i));
                else
                    grades.push(max/nIntervals*i);
            }
        }
    
        //LEGEND
        if (Layer_Legend!=null){
            Layer_Legend.remove(mymap);
        }
        Layer_Legend = L.control({position: 'bottomright'});
        Layer_Legend.onAdd = function (map) {
            this.div = L.DomUtil.create('div', 'info legend');
            this.div.innerHTML="<div style='margin:1px;padding:2px;color:white;background-color:" + format.color + "'>" + format.title + "</div>";
            // loop through our intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                this.div.innerHTML +=
                    '<i style="background:' + Do._getColor(grades[i] + 1) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }
            //console.log(this.div.innerHTML)
            return this.div;
        };
        Layer_Legend.addTo(mymap);
    
    
        if (layersPane!=null)
            mymap.removeLayer(layersPane);
        layersPane = L.geoJson([], {
            pane:'LABELS',
            id:"LABELS"
        }).addTo(mymap);


        //POLYGONS + DATA
        if (geojsonDEP!=null)
            mymap.removeLayer(geojsonDEP);
        geojsonDEP = L.geoJson([], {
            pane:'DEP',
            style: interact.style,
            onEachFeature: interact.onEachFeature
            ,id:"DEP"
        }).addTo(mymap);
    
        dataDEP=[];
        console.log("got " + ar.length)
        for (let i = 0; i < ar.length; i++) {
            const a = ar[i];
           
            //STORE DESCRIPTION DATA
            dataDEP.push(a.properties);
     
            if (a.geometry.type=='Polygon'){
                var polygon=L.polygon(
                    a.geometry.coordinates[0]
                );
            }
            if (a.geometry.type=='MultiPolygon'){
                var polygon=L.polygon(
                    a.geometry.coordinates
                );
            }
    
            //GET DATA FROM dataToShow 
            var vv=null;
            var foundRec=newDataToShow.find(el=>el.area==a.id);
            if (foundRec){
                vv=foundRec.value;
            }
    
            if (bDrawLabels){
                //SHOW NUMBERS
                var C=polygon.getBounds().getCenter();
                var marker = new L.Marker(
                    new L.LatLng(C.lat, C.lng), 
                    { icon: new L.AddLabel({number: vv}), 
                    pane:"LABELS"
                }).addTo(layersPane);
            }
    
            if (bDrawPolygons){
                polygon=polygon.toGeoJSON();
                polygon.properties.id=a.id;        
                polygon.properties.value=vv;
                geojsonDEP.addData(polygon);
            }
        }
    },
    _getColor:function(d) {
        var c=['#FFEDA0','#FED976','#FEB24C','#FD8D3C','#FC4E2A','#E31A1C','#BD0026','#800026'];
        var i=grades.findIndex(el=>el>d);
        if (i==-1)
            i=grades.length;
        return c[i];
    },
    //#endregion

    //#region Info
    Info:function(e){
        if (e){
            var sHTML="";
            var DS=dataSources[actualDataSource];

            var area=e.target.feature.properties.id;
            var n=DS.nameField || "nom";
            var areaTitle=dataDEP.find(el=>{
                if (valueOfPath(MAPSOURCE.codIndex,el)==area)
                    return true;
                else
                    return false;
            });
            areaTitle=valueOfPath(n,areaTitle);
            document.getElementById("infoTitle").innerHTML=areaTitle + " (" + area + ")<br>";

            var InfoFormat=InfoFormats[actualInfoFormat].format;

            InfoFormat.forEach(card => {
                switch (card.type) {
                    case "section":
                        sHTML+=`<div class="InfoCardTitle"><div>${card.title}</div></div>`;
                        break;
                    case "table":
                        var sC="";
                        for(let i=0;i<card.fields.length;i++){
                            sC+=" " + card.width[i];
                        }
                        var sT=`<div style="display:grid;grid-template-columns:${sC};grid-auto-flow:row;">`
                        for(let i=0;i<card.fields.length;i++){
                            sT+=`<div class=infogridH>${card.titles[i]}</div>`;
                        }
                        lastData.forEach(el=>{
                            if (valueOfPath(DS.areaField || "area",el)==area){
                                for(let i=0;i<card.fields.length;i++){
                                    var v=valueOfPath(card.fields[i],el);
                                    sT+=`<div class=infogrid>${v}</div>`;
                                }

                            }
                        });
                        sHTML+=sT + "</div>"
                        break;
                    case "mapflow":
                        var dataFlow=[];
                        for(let f in geojsonDEP._layers)
                        {
                            var e=geojsonDEP._layers[f];
                            if (e.feature.properties.id==area)
                            {
                                var toC=e.getBounds().getCenter();
                                toC=[toC.lng, toC.lat];
                                break;
                            }
                        }

                        var max=0;
                        lastData.forEach(el=>{
                            if (valueOfPath(DS.areaField || "area",el)==area){
                                var v=valueOfPath(card.fieldTo,el);
                                if (v!=area){
                                    max=Math.max(valueOfPath(card.fieldValue,el),max);
                                }
                            }
                        });
                        if (max==0)
                            max=1;
                        var colors=["#00aa00","#fbff00","#ffa600","#ff0000"];

                        lastData.forEach(el=>{
                            if (valueOfPath(DS.areaField || "area",el)==area){
                                var v=valueOfPath(card.fieldTo,el);
                                if (v!=area){

                                    for(let f in geojsonDEP._layers)
                                    {
                                        var e=geojsonDEP._layers[f];
                                        if (e.feature.properties.id==v)
                                        {
                                            var toD=e.getBounds().getCenter();
                                            toD=[toD.lng, toD.lat];
                                            //     "from":[fromC.lng, fromC.lat],
                                            //     "to":[toC.lng, toC.lat],
                                            //     "labels":["",""],
                                            //     "color":colors[n]
                                            break;
                                        }
                                    }
                                    var v=Math.floor(valueOfPath(card.fieldValue,el)/max*(colors.length-1));
                                    //console.log(valueOfPath(card.fieldValue,el) + " " + max + " " + v);

                                    dataFlow.push({ from:toC, to:toD, color:colors[v]});
                                }
                            }
                        });
                        //console.log(dataFlow)
                        Do._mapFlowCore(dataFlow);
                        break;
                    case "minicard":
                    default:
                        lastData.forEach(el=>{
                            if (valueOfPath(DS.areaField || "area",el)==area){
                                var v=valueOfPath(card.field,el);
                                var bc=card.color;
                                if (!bc)
                                    bc="darkblue";
                                sHTML+=`<div class=InfoCard style='background-color:${bc}'>${card.title}<div>${v}</div></div>`;
                            }
                        });
                        break;
                }
            });

            document.getElementById("divInfo").innerHTML=sHTML;

        }
        //sidebar.open('info');
    },
    //#endregion

    //#region DATA
    Data:function(){
        var textToFilter=document.getElementById("divDataSearch").value.toUpperCase();
        var s="";
        for(let i=0;i<dataSources.length;i++){
            if (dataSources[i].title.toUpperCase().indexOf(textToFilter)>=0 || textToFilter==""){
                var selClass="";
                if (i==actualDataSource)
                    selClass=" sel"
                s+=Card(dataSources[i].title, dataSources[i].description, "sourcepick"+selClass, dataSources[i].color, "Do.selMap(" + i + ")");
                }
        }
        document.getElementById("divDataInner").innerHTML=s;
    },
    //#endregion

    //#region GRAPH
    Graph:async function(){
        var graphs=dataSources[actualDataSource].graphs;
        if (graphs.length==0)
            return;
        var gHTML="";
        document.getElementById("divGraph").style.display="none";
        if (graphs){
            if (graphs.length==1)
            {
                //ONLY ONE GRAPH GO DO IT
                document.getElementById("divSelectGraph").style.display="none";
                await this.GraphDraw(graphs[0]);
            }
            else
            {
                document.getElementById("divSelectGraph").style.display="block";
                graphs.forEach(graph=>{
                    var G=GraphsDescription.find(g=>g.id==graph);
    
                    var selClass="";
                    if (G.id==actualChart)
                        selClass=" sel"
                    gHTML+=Card(G.title, G.description, "InfoGraph"+selClass, G.darkblue, "Do.GraphDraw('" + G.id + "')");
  
                })
                await this.GraphDraw(graphs[0]);
            }
        }
        else
        {
            gHTML+=`<div class=InfoGraph)'>
                <div>No Graphs available</div>
            </div>`
        }
        document.getElementById("divGraphSelection").innerHTML=gHTML;
    },
    GraphDraw:async function(n){
        if (!selectedArea)
            return;
        var areaTitle=dataDEP.find(el=>el.code==selectedArea).nom;
        document.getElementById("chartInfoTitle").innerHTML=areaTitle + " (" + selectedArea + ")<br>";

        actualChart=n;
        var G=GraphsDescription.find(g=>g.id==n);

        var url= detokenURL( G.data.url );
        var x=G.data.x;
        var y=G.data.y; //ARRAY
        try {
            var data=await loadJSONAsync("GET",url);
            document.getElementById("divGraph").innerHTML="";
        } catch (error) {
            document.getElementById("divGraph").innerHTML="Graph URL not found:<br>" + url;
            return;
        }
        //loadJSON(url,function(data){
            var d=JSON.parse(data);
            var graphDataX=[];
            var graphDataY=[];
            var graphDataY1=[];
            var graphDataY2=[];
            var graphDataY3=[];
            for (let i = 0; i < d.length; i++) {
                const element = d[i];
                //console.log(element)
                
                var vX=valueOfPath(x,element);
                var vY=valueOfPath(y[0],element);
                graphDataX.push(vX);
                graphDataY.push(vY);

                if (y.length>1){
                    graphDataY1.push(valueOfPath(y[1],element));    
                }
                if (y.length>2){
                    graphDataY2.push(valueOfPath(y[2],element));    
                }
                if (y.length>3){
                    graphDataY3.push(valueOfPath(y[3],element));    
                }
            }

            //TODO: USE THE GRAPH DEFINITION
            //THIS WAS LOUSY CODE WITH COPY AND PASTE
            //NEEDS TO BE DONE PROPERLY WITH AN ARRAY
            var trace1 = {
                x: graphDataX,
                y: graphDataY,
                type: G.type,
                name: G.data.titleSeries[0]
            };

            if (y.length>1){
                var trace2 = {
                    x: graphDataX,
                    y: graphDataY1,
                    type: G.type,
                    name: G.data.titleSeries[1]
                };
            }
            if (y.length>2){
                var trace3 = {
                    x: graphDataX,
                    y: graphDataY2,
                    type: G.type,
                    name: G.data.titleSeries[2]
                };
            }
            if (y.length>3){
                var trace4 = {
                    x: graphDataX,
                    y: graphDataY3,
                    type: G.type,
                    name: G.data.titleSeries[3]
                };
            }
            var layout = {
                title: G.title,
                xaxis: {
                    title: G.data.titleX
                },
                yaxis: {
                    title: ''
                },
                showlegend: true,
                legend: {"orientation": "h"},
                margin: {
                    l: 50,
                    r: 5,
                    b: 5,
                    t: 50,
                    pad: 4
                  },
                // shapes:[{
                //   type:'line',
                //   x0:2.2,
                //   y0:0,
                //   x1:2.2,
                //   y1:20,
                //   fillcolor: '#d3d3d3',
                //           opacity: 0.2,
                //           line: {
                //               width: 2
                //           }}
                // ]
            };
            var data = [trace1];
            if (y.length>1){
                data.push(trace2);
            }
            if (y.length>2){
                data.push(trace3);
            }
            if (y.length>3){
                data.push(trace4);
            }
            document.getElementById("divGraph").style.width="100%";
          document.getElementById("divGraph").style.display="block";
          
          Plotly.newPlot('divGraph', data,layout);


        //})

         
    },
    //#endregion

    //#region SEARCH
    Search:function(t){
        var h=document.getElementById("search").parentElement.offsetHeight-100;
        document.getElementById("divSearchResults").style.height=h + "px";

        var T=t.value.toUpperCase();
        //Search Areas
        var s="";
        dataDEP.forEach(d=>{
            if (d.nom.toUpperCase().indexOf(T)>=0){
                s+="<div onclick='Do.SearchElement(" + d.code + ")'>" + d.nom + "</div>";
            }
        });
        document.getElementById("divSearchResults").innerHTML=s;
    
    },
    SearchElement:function(code){
        for(let f in geojsonDEP._layers)
        {
            var e=geojsonDEP._layers[f];
                if (e.feature.properties.id==code)
                {
                    mymap.fitBounds(e.getBounds());
                    return;
                    //mymap.fitBounds(geojsonDEP._layers["54"].getBounds());
                }
        }
    },
    //#endregion

    //#region SIMULATION
    SimShow(){
        var textToFilter=document.getElementById("divSimSearch").value.toUpperCase();
        var s="";
        for(let i=0;i<Simulations.length;i++){
            if (Simulations[i].title.toUpperCase().indexOf(textToFilter)>=0 || textToFilter=="")
                s+=Card(Simulations[i].title, Simulations[i].description, "simpick", Simulations[i].color, "Do.SimStart(" + i + ")");
        }
        document.getElementById("divSimInner").innerHTML=s;
    },
    SimStart(n){
        var sim=Simulations[n];

        var sHTML="";
        sim.fields.forEach(f => {
            sHTML+="<div>" + f.title + "</div>";
            sHTML+="<div><input id='" + f.id + "'></div>";
        });
        sHTML+="<div><button onclick='Do.SimRun(" + n + ")'>Run</button></div>";
        document.getElementById("divSimFields").innerHTML=sHTML;
    },
    SimRun(n){
        var sHTML="";

        var sim=Simulations[n];
        sim.results.forEach(r=>{
            var color="darkred";
            switch (r.type) {
                case "chart":
                    color="darkblue";
                    
                    break;
                case "table":
                    color="darkgreen";
                
                    break;
                case "map":
                    color="orange";
                
                    break;
                case "mapflow":
                    color="purple";
                
                    break;
                        
                default:
                    break;
            }
            sHTML+=Card(r.title, r.description, "simpick", color, "Do.SimResult(" + n + ",'" + r.id + "')");
        });
        document.getElementById("divSimResults").innerHTML=sHTML;
    },
    SimResult(nSim,id){
        var sim=Simulations[nSim];
        var res=sim.results.find(s=>s.id==id);
        console.log("SimResult:" + res);
        Do.mapFlow("");
    },
    //#endregion

    //#region LAYERS
    LayersEdit:function(){
        var sHTML="<div>Visible</div><div>Layer</div>";
        mapLayers.forEach(l=>{
            sHTML+=`<div><input type=checkbox${l.display ? " checked":""} onclick="Do.LayersChange(this,'${l.id}')"></div><div>${l.title}</div>`;
        });
        divLayers.innerHTML=sHTML;
    },
    LayersChange(obj,id){
        var value=obj.checked;
        console.log(id + " " + value)
        mapLayers.find(l=>l.id==id).display=value;
        //UPDATE
        Do.Map(actualDataSource);
    },
    //#endregion

    //#region MAPFLOW
    mapFlow:function(data){
    },
    _mapFlowCore(data){
        if (flowPane)
            flowPane.destroy();
        flowPane = new L.migrationLayer({
            pane:"ARROWS",
            map: mymap,
            data: data,
                pulseRadius:15,
                pulseBorderWidth:3,
                arcWidth:1,
                arcLabel:false,
                // arcLabelFont:'10px sans-serif',
                maxWidth:10,
        })
        flowPane.addTo(mymap);
        //migrationLayer.setData(newData);

        //4.hide migrationLayer
        //migrationLayer.hide();
        //5.show migrationLayer
        flowPane.show();
        //6.pause migrationLayer animation
        flowPane.pause();
        //7.play migrationLayer animation
        //migrationLayer.play();
    },
    //#endregion
}

function loadJSONAsync(method, url) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}

function loadJSON(file,callback) {   
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', file, true); // Replace 'appDataServices' with the path to your file
    xobj.onreadystatechange = function () {
        //console.log(xobj.readyState + " " + xobj.status)
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);  
}

// DETOKENIZE #YYYY#, #MM#, #DD#
function detokenURL(url){
    var actualDate=document.getElementById("txtDate").value;
    var actualDate=(new Date(actualDate)).toISOString();
    var YYYY=actualDate.substr(0,4);
    var MM=actualDate.substr(5,2);
    var DD=actualDate.substr(8,2);

    var url1=url.replace("#YYYY#",YYYY);
    url1=url1.replace("#MM#",MM);
    url1=url1.replace("#DD#",DD);
    url1=url1.replace("#AREA#",selectedArea);
    return url1;
}

// Returns the value of the property specificed by propertyPath from the initialObject
// example: valueOfPath("data.total.varA") from  {"data":{"total":{"varA":"5"}}} returns "5"
function valueOfPath(propertyPath,initialObject){
    var lf=propertyPath.split('.');
    var v=initialObject;
    lf.forEach(element => {
        v=v[element];
    });
    return v;
}

// HTML Card
function Card(title, description, className, color, onClick){
    return `<div class="${className}" style="background-color:${color}" onclick="${onClick}">
        <div>${title}</div>
        <div>${description}</div>
    </div>`;
}