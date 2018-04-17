var rawSunData, sunTable = new Array, sunQuery = "table";  //default has all available countries, all available songs
var mapSVG, artistQuery = "";
drawRawSunData();
drawSunMap();
var keys =  ["Philippines", "United States", "Germany", "Brazil", "Sweden", "Mexico",
    "Spain", "Netherlands", "United Kingdom", "Australia", "Global", "Unselected"];
var skeys = ["ph", "us", "de", "br", "se", "mx", "es", "nl", "gb", "au", "global", "table"];

function drawRawSunData(func){
    //console.log(func);
    rawSunData = new Array;
    d3.csv("./filteredData.csv", function(data){
        console.log(data);
        //load compiled data and save as a bunch of json objects to be used for later
        //TODO: change to include main.js data
        data.forEach(function (d){
            var date = d["Date"];

            //check if region already exists in rawData else make a new one
            var region = d["Region"];

            if (region.length <= 2 || region == "global"){
                //console.log(region);

                var exists = doesRegionAlreadyExist(region);
                //console.log(exists);
                //check if region exists in region
                if (exists < 0){
                    var newArtistList = new Array;
                    var newRegion = {
                        name: region,
                        children: newArtistList
                    };
                    rawSunData.push(newRegion);
                    exists = rawSunData.length - 1;
                }
                var artist = d["Artist"];

                //check if region exists in region
                var exists2 = doesArtistAlreadyExist(artist,rawSunData[exists].children);
                if (exists2 < 0){
                    var newSongList = new Array;
                    var newRegion = {
                        name: artist,
                        children: newSongList,
                        streams: parseInt(d["Streams"])
                    };
                    rawSunData[exists].children.push(newRegion);
                    //exists2 = rawSunData[exists].children.length - 1;
                } else {
                    rawSunData[exists].children[exists2].streams += parseInt(d["Streams"]);
                }
                //check if song exists in region's songlist and add to streamcount else new song
                /*
                var gotSong = doesSongAlreadyExist(d["Track Name"], rawSunData[exists].children[exists2].children);
                if (gotSong < 0){
                    var song = {
                        name: d["Track Name"],
                        artist: d["Artist"],
                        streams: parseInt(d["Streams"]),
                        region: d["Region"]
                    };
                    rawSunData[exists].children[exists2].children.push(song);
                } else {
                    rawSunData[exists].children[exists2].children[gotSong].streams += parseInt(d["Streams"]);
                }*/
            }
        });

        //initialize chart
        sunTable = {"name": "table", "children": rawSunData};
        changeSunQueryLabel();
        updateChart(sunTable);
    });

    function doesRegionAlreadyExist(regionName){
        for (var i = 0; i < rawSunData.length; i++){
            if (rawSunData[i].name == regionName){
                return i;
            }
        }
        return -1;
    }
    function doesArtistAlreadyExist(artistName, artistList){
        for (var i = 0; i < artistList.length; i++){
            if (artistList[i].name == artistName){
                return i;
            }
        }
        return -1;
    }
    function doesSongAlreadyExist(songName, songList){
        for (var i = 0; i < songList.length; i++){
            if (songList[i].name == songName){
                return i;
            }
        }
        return -1;
    }
    function isPartOfQuery(name){
        if (sunQuery == ""){
            return true;
        } else {
            return (sunQuery == name);
        }
    }
}

function updateChart(table){
    showLoading();
    //remove any existing charts
    clearChildren(document.getElementById("v1"));

    var width = innerWidth*0.33,
        height = innerHeight*0.45,
        radius = (Math.min(width, height)/2 ) - 10;
    var color = d3.scaleOrdinal(d3.schemeCategory20),
        x = d3.scaleLinear().range([0, 2 * Math.PI]),
        y = d3.scaleSqrt().range([0, radius]),
        formatNumber = d3.format(",d");

    var svg = d3.select("#v1").append("svg").attr("width", width).attr("height", height)
        .append("g")
        .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

    var partition = d3.partition(); //.size([2 * Math.PI, radius]);
    var root = d3.hierarchy(table);
    root.sum(function(d){ return d.streams; });
    partition(root);

    var arc = d3.arc()
        .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
        .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
        .outerRadius(function(d) { return Math.max(0, y(d.y1)); });

    svg.selectAll("path")
        .data(partition(root).descendants())
        .enter().append("g")
        .attr("class", "node").append("path")
        .attr("d", arc)
        .style("stroke", "#fff")    //TODO: change color of stroke later
        .style("fill", function(d){ return color((d.children ? d: d.parent).data.name); })
        .on("click", clickSun)
        .on("mouseover", function(d){
            if (d.depth < 2){
                d3.select(this).style("cursor", "pointer");
            }
        })
        .on("mouseout", function(d){
            d3.select(this).style("cursor", "default");
        })
        .append("svg:title")
        .text(function(d){
            var s;
            if (d.depth <= 2){
                if (d.depth == 1){
                    s = keys[skeys.indexOf(d.data.name)];
                } else {
                    s = d.data.name;
                }
            } else {
                s = d.data.name
                    + "\nby " + d.data.artist
                    + "\n(" + formatNumber(d.data.streams) + ")";
            }
            return s;
        });

    svg.selectAll(".node")
        .append("text")
        .attr("fill", function(d){
            return "#fff";
        })
        .attr("transform", function(d){
            var angle = (d.x0 + d.x1)/Math.PI * 90;
            var realAngle;
            if (angle < 90 || angle > 270){
                realAngle = angle;
            } else {
                realAngle = angle + 180;
            }
            return "translate(" + arc.centroid(d) + ") rotate (" + realAngle + ")";
        })
        .attr("dx", "-10")
        .attr("dy", ".2em")
        .text(function(d){
            if (d.data.name == sunQuery && sunQuery != "table"){
                transitionSun(d);
            }
            if (d.depth > 1){
                return "";
            } else {
                if (d.parent){
                    return (d.data.name).toUpperCase();
                } else {
                    return "";
                }
            }
        });
    //console.log(table);

    function clickSun(d){
        if (d.depth > 2){
            return;
        } else if (d.depth < 1){
            sunQuery = "table";
            artistQuery = "";
        } else if (d.depth == 1) {
            if (d.data.name != sunQuery){
                sunQuery = d.data.name;
                artistQuery = "";
            } else if (artistQuery.length > 0){
                sunQuery = d.data.name;
                artistQuery = "";
            } else {
                sunQuery = "table";
                artistQuery = "";
            }
        } else if (d.depth == 2){
            if (d.data.name != artistQuery){
                sunQuery = d.parent.data.name;
                artistQuery = d.data.name;
            } else {
            }
        }
        changeSunQueryLabel();
        transitionSun(d);
        //TODO: signal change to other viz here
        //console.log(sunQuery);
        sunburstUpdate(sunQuery);
    }
    function transitionSun(d){
        svg.transition()
            .duration(750)
            .tween("scale", function() {
                var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                    yd = d3.interpolate(y.domain(), [d.y0, 1]),
                    yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
                return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
            })
            .selectAll("path")
            .attrTween("d", function(d) { return function() { return arc(d); }; });
    }

    //showSunBurst();
    setTimeout(showSunBurst, 1000);
}

function showSunBurst(){
    document.getElementById("loader").style.display = "none";
    document.getElementById("v1").style.display = "block";
    document.getElementById("v1_query").style.display = "block";
}

function showLoading(){
    document.getElementById("v1").style.display = "none";
    document.getElementById("v1_query").style.display = "none";
    document.getElementById("loader").style.display = "block";
}

function clearChildren(element){
    while (element.firstChild){
        element.removeChild(element.firstChild);
    }
}

function changeSunQueryLabel(){
    var p = document.getElementById("v1_query");
    clearChildren(p);
    var keys =  ["Philippines", "USA", "Germany", "Brazil", "Sweden", "Mexico",
        "Spain", "Netherlands", "Great Britain", "Australia", "Global", "Unselected"];
    var skeys = ["ph", "us", "de", "br", "se", "mx", "es", "nl", "gb", "au", "global", "table"];
    var string = keys[skeys.indexOf(sunQuery)];
    if (artistQuery.length > 0){
        string += " > " + artistQuery;
    }

    var text = document.createElement("p");
    var text2 = document.createTextNode(string);
    text.appendChild(text2);
    p.appendChild(text);
    changeNation(sunQuery);
}

var arr = [];
var countries;
function drawSunMap(){
    var width = 560,
        height = 400;

    var projection = d3.geoKavrayskiy7()
        .scale(100)
        .translate([width / 2, height / 2])
        .precision(.1);

    var path = d3.geoPath().projection(projection);

    var svg = d3.select("#sun").append("svg")
        .attr("width", width)
        .attr("height", height);

    queue()
        .defer(d3.json, "./world-110m.json")
        .defer(d3.tsv, "./world-country-names.tsv")
        .await(ready);

    function ready(error, world, names) {
        if (error) throw error;

        countries = topojson.feature(world, world.objects.countries).features;

        //map country names to IDs used on map
        arr=[];
        names.forEach(function(i){
            //console.log(i.name);
            arr[i.id]=i.name;
        });

        svg.selectAll(".country")
            .data(countries)
            .enter().insert("path", ".graticule")
            .attr("class", "suncountry")
            .attr("d", path)
            .style("fill", function(d, i) {
                var n = arr[d.id];
                var sq = keys[skeys.indexOf(sunQuery)];
                if (keys.indexOf(n) >= 0){
                    if (sq == n){
                        return "#1e3699";
                    }
                    return "#86BBD8";
                } else {
                    return "#CCCCCC";
                }
            });

        svg.insert("path", ".graticule")
            .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
            .attr("class", "boundary")
            .attr("d", path);
    }

    d3.select(self.frameElement).style("height", height + "px");
}

function changeNation(nat){

    d3.select("#sun").selectAll(".suncountry")
        .style("fill", function(d, i){
            if (nat == "global"){
                return "#1e3699";
            }

            var n = arr[d.id];
            var sq = keys[skeys.indexOf(nat)];
            if (keys.indexOf(n) >= 0){
                if (sq == n){
                    return "#1e3699";
                }
                return "#86BBD8";
            } else {
                return "#CCCCCC";
            }
        })
}