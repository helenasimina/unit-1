(function () {
    //pseudo-global variables
    var attrArray = ["mean_totin", "mean_cars", "mean_cars", "sum_carshz", "mean_trkdm", "Point_Coun", "Percent Below Poverty Line", "Total Population", "White-Alone", "Black-Alone"]; // List of attributes to join from CSV
    var expressed = attrArray[5]; //initial attribute

    window.onload = setMap();

    // set up choropleth map
    function setMap() {
        //map frame dimensions
        var width = window.innerWidth * 0.5,
            height = 500;

        // create new svg container for the map
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
            .scale(3200.60)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath()
            .projection(projection);

        //use Promise.all to parallelize asynchronous data loading
        var promises = [];
        promises.push(d3.csv("data/tractdatawtrains.csv")); //load attributes from csv    
        promises.push(d3.json("data/nodatatracts.topojson")); //load background spatial data    
        promises.push(d3.json("data/traintrackswi.topojson")); //load choropleth spatial data
        promises.push(d3.json("data/US_State_Boundaries.topojson")); //load choropleth spatial data    
        Promise.all(promises).then(callback);

        function callback(data) {
            csvData = data[0];
            wisconsintracts = data[1]; // Use 'var' to make it a local variable
            USBoundaries = data[3];
            railroads = data[2];
        
            // Iterate over each feature in the TopoJSON data
            wisconsintracts.objects.nodatatracts.geometries.forEach(function (tract) {
                // Find the corresponding entry in the CSV data based on GEOID
                var csvTract = csvData.find(function (csvEntry) {
                    return csvEntry.GEOID === tract.properties.GEOID;
                });
        
                // If a matching entry is found, add the attributes to the TopoJSON properties
                if (csvTract) {
                    attrArray.forEach(function (attr) {
                        var val = parseFloat(csvTract[attr]); // Get the attribute value from CSV
                        tract.properties[attr] = val; // Add the attribute to TopoJSON properties
                    });
                }
            });
        
            //translate europe TopoJSON
            var Wisconsin = topojson.feature(wisconsintracts, wisconsintracts.objects.nodatatracts).features,
                RailTrain = topojson.feature(railroads, railroads.objects.traintrackswi),
                Boundaries = topojson.feature(USBoundaries, USBoundaries.objects.US_State_Boundaries);
        
            colorScale = makeColorScale(Wisconsin);
        
            var USBoundaries = map.selectAll(".USBoundaries")
                .data(Boundaries.features)
                .enter()
                .append("path")
                .attr("class", "USBoundaries")
                .attr("d", path);
        
            var railtracks = map.selectAll(".railtracks")
                .data(RailTrain.features)
                .enter()
                .append("path")
                .attr("class", "railtracks")
                .attr("d", path);
        
            setEnumerationUnits(Wisconsin, map, path, colorScale);
            setChart(csvData, colorScale);
            createDropdown(); // Move this function call here
            console.log("here are:", wisconsintracts);
        }
        
    };

    // Function to create dropdown menu
    function createDropdown() {
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function () {
                changeAttribute(this.value, csvData)
            });

        //add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Data");

        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function (d) { return d; })
            .text(function (d) { return d; });
    };

    // Function to change attribute
    function changeAttribute(attribute, csvData) {
        // Change the expressed attribute
        expressed = attribute;
        console.log("Expressed attribute in changeAttribute:", expressed); // Log the current expressed attribute

    
        // Recreate the color scale
        var colorScale = makeColorScale(csvData);
    
        // Recolor enumeration units
        if (colorScale) { // Check if colorScale is defined
            var newunit = d3.selectAll(".witracts").style("fill", function (d) {
                var value = d.properties[expressed];
                if (value) {
                    return colorScale(d.properties[expressed]);
                } else {
                    return "#ccc";
                }
            });
        } else {
            console.error("Color scale is undefined."); // Log an error if colorScale is undefined
        }
    }
    
    function makeColorScale(witractsData) {
        console.log("witractsData:", witractsData); // Log the data array for debugging
        console.log("Expressed attribute:", expressed); // Log the current expressed attribute
    
        var colorClasses = [
            "#fef0d9",
            "#fdcc8a",
            "#fc8d59",
            "#e34a33",
            "#b30000"
        ];
    
        // Create color scale generator
        var colorScale = d3.scaleThreshold()
            .range(colorClasses);
    
        // Build array of all values of the expressed attribute
        var domainArray = [];
        witractsData.forEach(function (d) {
            // Check if the attribute exists for the feature
            if (d.properties && d.properties[expressed] !== undefined) {
                var val = parseFloat(d.properties[expressed]);
                // Check if the value is NaN
                if (isNaN(val)) {
                    // Replace NaN values with zero
                    val = 0.0;
                }
                domainArray.push(val);
                console.log("Pushed value:", val); // Log the value being pushed into the domainArray
            }
        });
        
        
        
    
    
        console.log("Domain Array:", domainArray); // Log the domainArray for debugging
    
        if (domainArray.length === 0) {
            console.error("Domain Array is empty. No valid attribute values found.");
            return; // Exit the function early if domainArray is empty
        }
    
        // Cluster data using ckmeans clustering algorithm to create natural breaks
        var numClasses = Math.min(colorClasses.length + 1, domainArray.length); // Ensure number of classes does not exceed number of data values
        var clusters = ss.ckmeans(domainArray, numClasses);
        // Reset domain array to cluster minimums
        domainArray = clusters.map(function (d) {
            return d3.min(d);
        });
        // Remove first value from domain array to create class breakpoints
        domainArray.shift();
    
        // Assign array of last 4 cluster minimums as domain
        colorScale.domain(domainArray);
    
        return colorScale;
    }
    

    // Function to add Wisconsin tracts to map with fill color
    function setEnumerationUnits(wisconsintracts, map, path, colorScale) {
        //add wi tracts to map   
        var newunit = map.selectAll(".witracts")
            .data(wisconsintracts)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "witracts " + d.properties.GEOID;
            })
            .attr("d", path)
            .style("fill", function (d) {
                var value = parseFloat(d.properties[expressed]);;
                if (value) {
                    return colorScale(d.properties[expressed]);
                } else {
                    return "#ccc";
                }
            });
        console.log("Census tracts appended to map:", newunit); // Check if census tracts are appended
    }

    // Function to create the chart
    function setChart(csvData, colorScale) {
        //chart frame dimensions
        var chartWidth = window.innerWidth * 0.405,
            chartHeight = 500;

        // Define margins for the chart
        var margin = { top: 20, right: 20, bottom: 30, left: 40 },
            width = chartWidth - margin.left - margin.right,
            height = chartHeight - margin.top - margin.bottom;

        // Filter the data to exclude points with zero values
        var filteredData = csvData.filter(function (d) {
            return d.Point_Coun > 0; // Adjust this condition based on your data structure
        });

        // Sort the filtered data array based on the expressed attribute in descending order
        filteredData.sort(function (a, b) {
            return b[expressed] - a[expressed];
        });

        // Create a linear scale for the y-axis
        var yScale = d3.scaleLinear()
            .range([height, 0]) // Note the reversed range to position bars from top to bottom
            .domain([0, d3.max(filteredData, function (d) { return parseFloat(d[expressed]); })]);

        // Create the chart SVG element
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Append bars to the chart
        var bars = chart.selectAll(".bars")
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("class", function (d) {
                return "bars " + d.GEOID;
            })
            .attr("width", Math.max(width / filteredData.length - 1, 0))
            .attr("x", function (d, i) {
                return i * (width / filteredData.length);
            })
            .attr("height", function (d) {
                return height - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function (d) {
                return yScale(parseFloat(d[expressed])); // Adjusted to use yScale for positioning
            })
            .style("fill", function (d) {
                return colorScale(d[expressed]);
            });

        // Append y-axis to the left side of the chart
        var yAxis = d3.axisLeft(yScale);

        chart.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        var chartTitle = chart.append("text")
            .attr("x", 20)
            .attr("y", 0 - margin.top / 15)
            .attr("class", "chartTitle")
            .text("Total Train Derailments per Census Tract in 2020");
    }

})();
