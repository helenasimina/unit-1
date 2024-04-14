window.onload = setMap();

//set up choropleth map
function setMap(){
    //map frame dimensions
    var width = 700,
        height = 500;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([-8.5, 44.8])
        .rotate([81, 0, 0])
        .parallels([25.20, 45.5])
        .scale(5300.60)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];    
    promises.push(d3.csv("data/tractdatawtrains.csv")); //load attributes from csv    
    promises.push(d3.json("data/nodatatracts.topojson")); //load background spatial data    
    promises.push(d3.json("data/traintrackswi.topojson")); //load choropleth spatial data    
    Promise.all(promises).then(callback);

    function callback(data){    
        csvData = data[0];    
        wisconsintracts = data[1];    
        railroads = data[2];   
        
        var attrArray = ["mean_totin", "mean_cars", "mean_cars", "sum_carshz", "mean_trkdm", "Point_Coun", "Percent Below Poverty Line", "Total Population", "White-Alone", "Black-Alone"]; // List the attributes you want to join from CSV
        for (var i = 0; i < csvData.length; i++) {
            var csvTract = csvData[i]; // The current tract from CSV
            var csvKey = csvTract.GEOID; // Assuming tract_id is the key in your CSV representing each tract
    
            // Loop through GeoJSON tracts to find the correct tract
            for (var j = 0; j < wisconsintracts.objects.nodatatracts; j++) {
                var geojsonProps = wisconsintracts.features[j].properties; // The current tract GeoJSON properties
                var geojsonKey = geojsonProps.GEOID; // Assuming "GEOID" is the key in your GeoJSON representing each tract
            
                // Where primary keys match, transfer CSV data to GeoJSON properties object
                if (geojsonKey === csvKey) {
                    // Assign all attributes and values
                    attrArray.forEach(function(attr) {
                        var val = parseFloat(csvTract[attr]); // Get CSV attribute value
                        geojsonProps[attr] = val; // Assign attribute and value to GeoJSON properties
                    });
                }
            }
        }
        console.log(csvData);
        console.log(wisconsintracts);
        console.log(railroads);   
        //translate europe TopoJSON
        var Wisconsin = topojson.feature(wisconsintracts, wisconsintracts.objects.nodatatracts),
            RailTrain = topojson.feature(railroads, railroads.objects.traintrackswi);
        //add Europe countries to map
        var witracts = map.append("path")
            .datum(Wisconsin)
            .attr("class", "witracts")
            .attr("d", path);

        //add France regions to map
        var railtracks = map.selectAll(".railtracks")
            .data(RailTrain.features)
            .enter()
            .append("path")
            .attr("class", "railtracks")
            .attr("d", path);

    };
};