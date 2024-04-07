window.onload = setMap();

//set up choropleth map
function setMap(){
    //use Promise.all to parallelize asynchronous data loading
    var promises = [d3.csv("data/tractdatawtrains.csv"),                    
                    d3.json("data/tracts.topojson"),                    
                    d3.json("data/traintrackswi.topojson")                   
                    ];    
    Promise.all(promises).then(callback);

    function callback(data){    
        csvData = data[0];    
        wisconsintracts = data[1];    
        railroads = data[2];        
        console.log(csvData);
        console.log(wisconsintracts);
        console.log(railroads);   
        var Wisconsin = topojson.min.feature(wisconsintracts, wisconsintracts.objects.Wisconsin),
            RailTrain = topojson.min.feature(railroads, railroads.objects.RailTrain);
        //examine the results
        console.log(Wisconsin);
        console.log(RailTrain);

    };
};