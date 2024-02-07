//define variable & connect it to mydiv index.html
var mydiv = document.getElementById("mydiv");

//initialize functions when script loads
function initialize(){
    cities();
    addColumns();
    addEvents();
};

//function to create a table with cities and their populations
function cities(){
    //define two arrays for cities and population
    var cities = [
        'Madison',
        'Milwaukee',
        'Green Bay',
        'Superior'
    ];
    var population = [
        233209,
        594833,
        104057,
        27244
    ];

    //create the table element
    var table = document.createElement("table");

    //create a header row
    var headerRow = document.createElement("tr");

    //add the "City" column
    var cityHeader = document.createElement("th");
    cityHeader.innerHTML = "City";
    headerRow.appendChild(cityHeader);

    //add the "Population" column
    var popHeader = document.createElement("th");
    popHeader.innerHTML = "Population";
    headerRow.appendChild(popHeader);

    //add the row to the table
    table.appendChild(headerRow);

    //loop to add a new row for each city
    for (var i = 0; i < cities.length; i++){
        var tr = document.createElement("tr");

        //loop thru cities to add city name as table data (td) element for first column
        var city = document.createElement("td");
        city.innerHTML = cities[i];
        tr.appendChild(city);

        //loop thru cities to add corresponding city population as table data to second column
        var pop = document.createElement("td");
        pop.innerHTML = population[i];
        tr.appendChild(pop);

        table.appendChild(tr);
    };

    //add the table to the div in index.html
    var mydiv = document.getElementById("mydiv");
    mydiv.appendChild(table);
};

//define an array that contains city names and their populations. 
var cityPop = [
	{ 
		city: 'Madison',
		population: 233209
	},
	{
		city: 'Milwaukee',
		population: 594833
	},
	{
		city: 'Green Bay',
		population: 104057
	},
	{
		city: 'Superior',
		population: 27244
	}
];

//define function to add a size column to table in mydiv. 
function addColumns(){

    //iterate over each table row and execute a function for each index in the row.
    document.querySelectorAll("tr").forEach(function(row, i){

        //at index 0, insert table header "city size"
    	if (i == 0){

    		row.insertAdjacentHTML('beforeend', '<th>' + "City Size" + '</th>');
    	} else {
            //create variable city size. 
    		var citySize;
            //iterate thru cityPop--if population is less than 100000, assign "small" to citySize
    		if (cityPop[i-1].population < 100000){
    			citySize = 'Small';
            //if population is greater than 100000 but less than 500000, assign "medium" to citySize
    		} else if (cityPop[i-1].population < 500000){
    			citySize = 'Medium';
            //if pop value doesn't fit into either of those categories, assign "large" to citySize
    		} else {
    			citySize = 'Large';
    		};

            //insert a citySize as table data for each row
			row.insertAdjacentHTML('beforeend', '<td>' + citySize + '</td>');
    	};
    });
};

//create function with interactions for mouseover events and click events
function addEvents() {
    //when mouseing over the table, call the following function:
    document.querySelector("table").addEventListener("mouseover", function() {
        //create color variable & assign it random rgb values on each event.
        var color = "rgb(";
        for (var i = 0; i < 3; i++) {
            var random = Math.round(Math.random() * 255);
            color += random;
            if (i < 2) {
                color += ",";
            } else {
                color += ")";
            }
        }
        document.querySelector("table").style.backgroundColor = color;
    });
    //define function for clicking --when you click, it alerts you.
    function clickme() {
        alert('Hey, you clicked me!');
    }
    //apply the clickme function as an event listener on the table when clicked
    document.querySelector("table").addEventListener("click", clickme);
};



//call the initialize function when the window has loaded
window.onload = initialize;
