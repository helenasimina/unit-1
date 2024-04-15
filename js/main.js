(function(){

    //pseudo-global variables
    var attrArray = ["mean_totin", "mean_cars", "mean_cars", "sum_carshz", "mean_trkdm", "Point_Coun", "Percent Below Poverty Line", "Total Population", "White-Alone", "Black-Alone"]; // List of attributes to join from CSV
    var expressed = attrArray[7]; //initial attribute
    
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
        
        
    // Iterate over each feature in the TopoJSON data
    wisconsintracts.objects.nodatatracts.geometries.forEach(function(tract) {
        // Find the corresponding entry in the CSV data based on GEOID
        var csvTract = csvData.find(function(csvEntry) {
            return csvEntry.GEOID === tract.properties.GEOID;
        });

        // If a matching entry is found, add the attributes to the TopoJSON properties
        if (csvTract) {
            attrArray.forEach(function(attr) {
                var val = parseFloat(csvTract[attr]); // Get the attribute value from CSV
                tract.properties[attr] = val; // Add the attribute to TopoJSON properties
            });
        }
    });
   
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

//function to create color scale generator
function makeColorScale(wisconsintracts){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    wisconsintracts.forEach(function(d) {
        var val = parseFloat(d.properties[expressed]);
        domainArray.push(val);
        console.log("Pushed value:", val); // Log the value being pushed into the domainArray
    });

    // Log the domainArray before clustering
    console.log("Domain array before clustering:", domainArray);

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    // Log the domainArray after clustering
    console.log("Domain array after clustering:", domainArray);

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);

    // Log the final domain set for the color scale
    console.log("Color scale domain:", colorScale.domain());

    return colorScale;
};


function setEnumerationUnits(wisconsintracts,map,path,colorScale){    
    //add wi tracts to map   
    console.log("setEnumerationUnits function called"); // Check if the function is called

    var newunit = map.selectAll(".witracts")        
        .data(wisconsintracts)        
        .enter()        
        .append("path")        
        .attr("class", function(d){            
            return "witracts " + d.properties.GEOID;        
        })        
        .attr("d", path)        
            .style("fill", function(d){            
                var value = d.properties["Total Population"];            
                if(value) {                
                    return colorScale(d.properties[expressed]);            
                } else {                
                    return "#ccc";            
                }    
        });
    
    console.log("Census tracts appended to map:", newunit);
    }
    


})();