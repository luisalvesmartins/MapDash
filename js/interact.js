var interact={
    onEachFeature:function(feature, layer) {
        layer.on({
            mouseover: function(e){
                var layer = e.target;
                layer.setStyle({
                    weight: 2,
                    color: 'red',
                    dashArray: '',
                    fillOpacity: 0.9
                });            
            },
            mouseout: function(e){
                geojsonDEP.resetStyle(e.target);
            },
            click:async function(e){
                  //MAYBE NOT GOOD IDEA TO ZOOM:
                //mymap.fitBounds(e.target.getBounds());
                var layer = e.target;
                if (e.target){
                    layer.setStyle({
                        weight: 2,
                        color: 'red',
                        dashArray: '',
                        fillOpacity: 0.9
                    });
                    //sidebar.open('info')
                    Do.Info(e);
                    selectedArea=e.target.feature.properties.id;
                    if (selectedChart!=null){
                        await Do.GraphDraw(selectedChart);
                    }
                }            
            }
        });
    },
    style:function(feature) {
        return {
            fillColor: Do._getColor(feature.properties.value),
            weight: 1,
            opacity: 1,
            color: 'lightgray',
            //dashArray: '3',
            fillOpacity: 0.7
        };
    },
    sidebarResize:function(t){
        if (document.getElementById('sidebar').style.width=='98%'){
            document.getElementById('sidebar').style.maxWidth="";
            document.getElementById('sidebar').style.width='100%';
        }
        else
        {
            document.getElementById('sidebar').style.maxWidth='98%';
            document.getElementById('sidebar').style.width='98%';
        }
    }

}