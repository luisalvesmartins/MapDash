var dataSources=[
    {
        url:"sampledata/DEPSampleData.json",
        intervals:{
            number:6,
            round:true,
            type:"normal"
        },
        title:"Total Events",
        description:"Total Events for this demo",
        field:"data.current.critical",
        color:"darkblue",
        infoFormat:"daily",
        areaField:"area",
        graphs:["evolution","comparison"]
    },
    {
        url:"sampledata/DEPSampleMov.json",
        intervals:{
            number:6,
            round:true,
            type:"normal"
        },
        areaField:"from",
        title:"Travel Intentions",
        description:"Travel Intentions for the demo",
        field:"people",
        color:"darkgreen",
        infoFormat:"movement",
        graphs:[]
    },
];

var GraphsDescription=[
    {
        id:"evolution",
        title:"Evolution",
        description:"Graph with evolution this department",
        type:"line",
        needSelectedArea:true,
        data:{
            url:"sampleData/DEPEvolution#AREA#.json",
            x:"date",
            y:["data.current.critical","total.critical"],
            titleX:"",
            titleSeries:["Current","Total"],
        }
    },
    {
        id:"comparison",
        title:"Comparison",
        description:"Graph with comparison between men and women deaths",
        type:"bar",
        needSelectedArea:true,
        data:{
            url:"https://covid-ia-appdata.azurewebsites.net/api/v2/get/until?yyyy=#YYYY#&mm=#MM#&dd=#DD#&area=#AREA#",
            x:"date",
            y:["data.men.total.deaths","data.women.total.deaths"],
            titleX:"",
            titleSeries:["Men","Women"],
        }
    },
];

var InfoFormats=[
    {
        id:"movement",
        format:[
            {
                title:"Movement Intentions",
                type:"section"
            },
            {
                type:"table",
                fields:["to","people"],
                titles:["To Dep","# of people"],
                width:["50px","auto"]
            },
            {
                type:"mapflow",
                fieldTo:"to",
                fieldValue:"people"
            }
        ]
    },
    {
        id:"daily",
        format:[
            {
                title:"Current situation",
                type:"section"
            },
            {
                title:"Current Critical",
                field:"data.current.critical",
                color:"red"
            },
            {
                title:"Total Critical",
                field:"total.critical"
            },

        ]
    }
];

var Simulations=[
    {
        title:"Simulation1",
        description:"description1",
        color:"darkblue",
        fields:[
            {
                id:"Date",
                title:"Date",
                type:"date"
            },
            {
                id:"SampleSize",
                title:"Sample Size",
                type:"number"
            },
            {
                id:"listone",
                title:"This is a list",
                type:"list(1,2,3)"
            }
        ],
        url:"",
        results:[
            { 
                type:"chart",
                id:"evolution",
                title:"Chart 1",
                description:"x and y"
            },
            { 
                type:"table",
                id:"table1",
                title:"table 1",
                description:"some numbers"
            },
            { 
                type:"mapflow",
                id:"mapflow1",
                title:"map movement",
                description:"show flow"
            },
            { 
                type:"map",
                id:"map2",
                title:"map colors",
                description:"show range of color"
            }
        ]
    },
    {
        title:"Movement 2",
        description:"Movement simulation",
        color:"darkgreen",
        fields:[
            {
                id:"dep",
                title:"Origin department",
                type:"text"
            },
            {
                id:"SampleSize",
                title:"Sample Size",
                type:"number"
            }
        ],
        url:"",
        results:[
            { 
                type:"chart",
                id:"evolution",
                title:"Chart 1",
                description:"x and y"
            },
            { 
                type:"chart",
                id:"evolution",
                title:"Chart 2",
                description:"x and y and z"
            },
            { 
                type:"table",
                id:"table1",
                title:"table 1",
                description:"some numbers"
            }
       ]
    },
];

var GeoLayers=[
    {
        id:"POISample",
        title:"POI Sample",
        url:"sampledata/POISample.geojson",
        display:true,
        icon:'icon_sample.png',
        nameField:'name'        
    },
];

var MAPSOURCE={
    title:"France",
    file:"maps/departments.geojson",
    center:[46.705, 1.5],
    zoom:6,
    codIndex:"code"
}

var Languages={
    "English":"en",
    "Français":"fr"
}