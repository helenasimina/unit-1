window.onload = setMap();

//set up choropleth map
function setMap(){
    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([-13.16, 43.25])
        .rotate([81, 0, 0])
        .parallels([25.20, 45.5])
        .scale(2216.60)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];    
    promises.push(d3.csv("data/tractdatawtrains.csv")); //load attributes from csv    
    promises.push(d3.json("data/tracts.topojson")); //load background spatial data    
    promises.push(d3.json("data/traintrackswi.topojson")); //load choropleth spatial data    
    Promise.all(promises).then(callback);

    function callback(data){    
        csvData = data[0];    
        wisconsintracts = data[1];    
        railroads = data[2];        
        console.log(csvData);
        console.log(wisconsintracts);
        console.log(railroads);   
        //translate europe TopoJSON
        var Wisconsin = topojson.feature(wisconsintracts, wisconsintracts.objects.simplifiedtable),
            RailTrain = topojson.feature(railroads, railroads.objects.traintrackswi);
        //add Europe countries to map
        var witracts = map.append("path")
            .datum(Wisconsin)
            .attr("class", "witracts")
            .attr("d", path);

        //add France regions to map
        var railtracks = map.selectAll(".railtracks")
            .data(RailTrain)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "railtracks " + d.properties.adm1_code;
            })
            .attr("d", path);

    };
};