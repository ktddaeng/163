//variables
var table = new Array;
var tablefin, tablefin2;
var tags = ["Arrival_Departure", "Domestic_International", "Passenger_Count", "ReportPeriod",
        "Arrival", "International"];
var monthtext = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
    "October", "November", "December"];

//Loads CSV data
d3.csv("./Los_Angeles_International_Airport_-_Passenger_Traffic_By_Terminal.csv", function(data){
    data.forEach(function(d){
        d[tags[2]] = +d[tags[2]];
        //Filters for Arrival and International Flights
        if (d[tags[0]] == tags[4] && d[tags[1]] == tags[5]){
            var date = d[tags[3]].split(" ")[0];
            var year = date.split("/")[2];
            //Filters for year ranging 2014 to 2017
            if (+year >= 2014 && +year <= 2017){
                var item = [year, date.split("/")[0], d[tags[2]]];
                table.push(item);
            }
        }
    });
    //initialize table from general data pulled from the dataset
    setUpTable();
    organizeData(2014, 0);
    organizeData(2015, 1);
    organizeData(2016, 2);
    organizeData(2017, 3);
    console.log("Do you see me?");
    fixTable();
    //flightCheck();
    //make the scatter plot
    makeScatterPlot();
});

//initialize the table
function setUpTable(){
    tablefin = [];
    for (var i = 0; i < 4; i++){
        tablefin[i] = [];
        for (var j = 0; j < 12; j++){
            tablefin[i][j] = 0;
        }
    }
}
//puts initialized table in a proper table for plotting on the d3 plot
function fixTable(){
    tablefin2 = [];
    for (var i = 0; i < 4; i++){
        for (var j = 0; j < 12; j++){
            tablefin2[i*12 + j] = [];
            tablefin2[i*12 + j][0] = i*12 + j;
            tablefin2[i*12 + j][1] = tablefin[i][j];
        }
    }
}

//Aggregates the entries into sums for each month of the year
function organizeData(year1, index){
    var sum = 0;
    for (var i = 0; i < table.length; i++){
        var year = table[i][0];
        var month = table[i][1];
        var num = table[i][2];
        if (+year == year1){
            tablefin[index][+month - 1] += (+num)/100000;
        }
    }
}

//Checks that data is fine and not broken
function flightCheck(){
    for (var i = 0; i < 4; i++){
        for (var j = 0; j < 12; j++){
            console.log("1:" + i + ": " + tablefin[i][j]);
        }
    }
}
function flightCheck2(){
    for (var i = 0; i < 4*12; i++){
        console.log("2:" + i + ": " + tablefin2[i]);
    }
}
//Returns Month
function getMonth(d){
    return d - Math.floor(d/12)*12 + 1;
}

//D3: Make Scatterplot
function makeScatterPlot(){
    var width = 900, height = 600, padding = 24, left_padding = 100;
    var svg = d3.select("#d3rep").append("svg").attr("width", width).attr("height", height + .5* padding);

    //Define Scales
    var x = d3.scaleLinear().domain([0,12*4]).range([left_padding, width - padding]),
        xx = d3.scaleLinear().domain([2014,2018]).range([left_padding, width - padding]),
        y = d3.scaleLinear().domain([0,13]).range([padding, height - padding * 3]);

    //Set Range of X and Y Axes
    var xA = d3.axisBottom(x).ticks(12*4).tickFormat(function(d){
        //Format month
        return getMonth(d);
    });
    var xB = d3.axisTop(xx).ticks(4).tickFormat(function (d){
        return "" + d;
    });
    var yA = d3.axisLeft(y).tickFormat(function (d){
        //Format number of passenger count
        if (d == 13){
            return "0K";
        } else {
            return (13 - d) + "00K";
        }
    });
    var yB = d3.axisRight(y).tickFormat(function (d){
        return "";
    });

    //Set X Axis and format them
    //Set Month and Year
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(-" + padding  + ", " + (height - padding*2) + ")")
        .call(xA)
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(-" + padding  + ", " + (height - padding*2) + ")")
        .call(xB.tickSize(height - 3*padding, 0, 0));
    //Set Label
    svg.append("text")
        .attr("transform", "translate(" + width/2 + "," + height + ")")
        .style("text-anchor", "middle")
        .text("Month & Year");

    //Set Y Axis and format them
    //Set Number
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + (left_padding - padding) + ", " + padding + ")")
        .call(yA);
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + (left_padding - padding) + ", " + padding + ")")
        .call(yB.tickSize(width - left_padding - padding, 0, 0));
    //Set Label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 + padding)
        .attr("x", 0 -(height/2))
        .style("text-anchor", "middle")
        .text("Passenger Count");

    //Create tooltip
    var tooltip = d3.select("body").append("div").attr("class", "tooltip")
        .style("visbility", "hidden");

    //Set Marks and adjust their position to fit the plot
    svg.selectAll("circle")
        .data(tablefin2)
        .enter().append("svg:circle")
        .attr("fill", "#FF7F50")
        .attr("r", 5)
        .attr("cx", function (d) {
            //console.log(d[0]);
            return x(d[0] - 1.5);
        } )
        .attr("cy", function (d) {
            //console.log(" " + d[1]);
            return y(13 - d[1] + 0.64);
        } )
        //Mouseover Functions for the marks
        .on("mouseover",  function(d){
            d3.select(this).attr("stroke", "#000");

            var m = getMonth(d[0] - 1);
            if (m >= 12) {m = 0};
            console.log(m);
            var html = "Month of Report Period: " + monthtext[m] + "<br/>"
                + "Arrival Departure: Arrival <br/>Domestic International: International<br/>"
                + "Year of Report Period: " + (2014 + Math.round(d[0]/12) + "<br/>Passenger Count: " + Math.round(d[1]*100000));
            var coord = [0,0];
            coord = d3.mouse(this);
            tooltip.html(html)
                .style("left", coord[0] + "px")
                .style("top", coord[1] + "px")
                .transition()
                .duration(300)
                .style("visibility", "visible");
        })
        .on("mouseout", function(d){
            d3.select(this).attr("stroke", "none");
        tooltip.transition()
            .duration(300)
            .style("visibility", "hidden");
    });
}