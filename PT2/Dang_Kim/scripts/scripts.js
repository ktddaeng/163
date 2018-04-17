var rawdata = new Array, rtable1 = new Array, rtable2 = new Array, rtable3 = new Array;
var cause = ["E. coli", "Listeria monocytogenes", "Salmonella", "Undeclared Allergen",
    "Extraneous Material", "Processing Defect", "Undeclared Substance", "Other"];
var ingredientList = ["poultry", "pork", "beef", "mixed", "other"];
var highlight = ["#70D6FF", "#FF70A6", "#FF9770", "#FFD670", "#E9FF70"];
var colorblossom = ["#8E4162", "#EDA2C0", "#BF9ACA"];
//TODO: Dummy values, will change to all later
//spec ["year", "meat", "allergen"]
var spec = [["all"], ["beef"], ["all"]];
var tooltip = d3.select("body") .append("div") .attr("class", "tooltip").style("opacity", 0);

d3.csv("./CompiledData.csv", function(data){
    //load compiled data and save as a bunch of json objects to be used for later
    data.forEach(function (d){
        var r = d["Recall Date"];
        var year = r.substring(6, r.length);

        //check for which words correspond to which keyword for materials
        var ingred;
        var name = d["Product"];

        if (containsWords(name, ["chicken", "cobb", "poultry", "turkey", "egg", "liver"])) {
            ingred = "poultry";
        } else if (containsWords(name, ["pork", "bacon", "ham", "pig", "mortadella"])){
            ingred = "pork";
        } else if (containsWords(name, ["cheese", "sirloin", "beef", "burger", "patties", "ribeye", "veal"])){
            ingred = "beef";
        } else if (containsWords(name, ["lamb", "sausage", "deli", "dog", "pizza", "chili", "meatball"])){
            ingred = "mixed";
        } else {
            ingred = "other";
        }
        //console.log(ingred);

        var reason;
        name = d["Reason for Recall"];
        if (containsWords(name, ["e. coli"])){
            reason = "E. coli";
        } else {
            reason = name;
        }

        var item = {
            date: year.trim(),
            class: d["Recall Class"],
            reason: reason,
            ingredients: ingred,
            num: parseInt(d["Pounds Recalled"])
        };
        //console.log(item);
        rawdata.push(item);
    });

    //initialize chart
    updateChart();
});

//See if a word is contained within a string
function containsWords(mainstring, listofsubstr){
    var str = mainstring.toLowerCase();
    for (var i = 0; i < listofsubstr.length; i++){
        var search = listofsubstr[i];
        if (str.indexOf(search) > -1){
            return true;
        }
    }
    return false;
}
//Given an array of strings, make a comma separated string
function makeString(listOfStrings){
    var string = listOfStrings[0].toUpperCase();
    for (var i = 1; i < listOfStrings.length; i++){
        string += (", " + listOfStrings[i].toUpperCase());
    }
    return string;
}
//get rid of children in an element when renewing specs
function clearChildren(element){
    while (element.firstChild){
        element.removeChild(element.firstChild);
    }
}

/**ON CLICK**/
//when dropdown menu changes criteria of year
function onTimeChange(){
    var dropDown = document.getElementById("timeSelect");
    //change the query spec
    var years = [dropDown.value.toLowerCase()];
    spec[0] = years;
    //console.log(spec);
    updateChart();
}
//general fxn to update all visualizations if the specs change
function updateChart(){
    //process rawdata into usable data for charts
    //Vis1
    doV1(spec);
    //Vis2
    doV2(spec);
    //Vis3
    doV3(spec);
}
//when a query is changed, the specs must be changed
function changeQuery(word){
    var array, queryArray;
    array = ingredientList;
    queryArray = spec[1];

    if (!containsWords(word, queryArray)){
        //word does not yet exist in spec
        if (queryArray[0] == "all"){
            console.log("c2");
            //remove element when set to all
            var temp = queryArray;
            queryArray = new Array;
            for (var i = 0; i < ingredientList.length; i++){
                if (ingredientList[i] != word){
                    queryArray.push(ingredientList[i]);
                }
            }
        } else {
            console.log("c1");
            queryArray.push(word);
        }
    } else {
        //remove element from spec if exists
        var temp = queryArray;
        console.log("c3");
        queryArray = [];
        for (var i = 0; i < temp.length; i++){
            if (temp[i] != word){
                queryArray.push(temp[i]);
            }
        }
    }
    //if queryarray is empty reset to all
    if(queryArray.length == array.length || queryArray.length < 1){
        queryArray = ["all"];
    }
    spec[1] = queryArray;
    console.log(spec[1]);
    updateChart();
}

/** VIS 1: SUNBURST PARTITION CHART & TIMELINE OF MEAT TYPE AND ALLERGEN**/
function doV1(specs){
    rtable1 = processV1(rawdata, specs[0]);
    //console.log(rtable1);
    makeV1(rtable1, specs[0]);
}
function processV1(raw, year){
    var arr1 = new Array;
    var list = new Array;
    for (var j = 0; j < cause.length; j++){
        list.push({"name": cause[j], "size": 0});
    }
    for (var k = 0; k < ingredientList.length; k++){
        var food = {"name": ingredientList[k], "children": list};
        arr1.push(food);
    }
    //console.log(arr1);

    //filter entries down to the right year
    var filteredtoYear = new Array;
    if (year == "all"){
        filteredtoYear = raw;
    } else {
        for (var i = 0; i < raw.length; i++){
            if (raw[i].date == year){
                filteredtoYear.push(raw[i]);
            }
        }
    }

    //collect counts of total recalls
    for (var i = 0; i < filteredtoYear.length; i++){
        var i1 = ingredientList.indexOf(filteredtoYear[i].ingredients);
        var i2 = cause.indexOf(filteredtoYear[i].reason);
        var count = parseInt(filteredtoYear[i].num);
        var orig = arr1[i1].children;

        var arr2 = new Array;
        for (var j = 0; j < cause.length; j++){
            //console.log(arr1[i1].children[i2].size)
            var s = orig[j].size;
            if (i2 == j){
                s += count;
            }
            arr2.push({"name": cause[j], "size": s});
        }
        //console.log("ingredient: " + ingredientList[i1] + " cause: " + cause[i2]);
        arr1[i1].children = arr2;
    }

    return {"name": "table", "children": arr1};
}
function makeV1(table, year){
    //clear any previous elements
    clearChildren(document.getElementById("vv1"));
    var width = 500, height = width;
    var radius = Math.min(width, height)/2;
    var svg1 = d3.select("#vv1").append("svg")
        .attr("width", width).attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    color = colorblossom;

    //create partition tree
    var partition = d3.partition().size([2 * Math.PI, radius]);
    //root node
    var root = d3.hierarchy(table).sum(function(d) { return d.size; });

    //create arcs
    partition(root);
    //arc size
    var arc = d3.arc()
        .startAngle(function(d) { return d.x0;})
        .endAngle(function(d) { return d.x1;})
        .innerRadius(function(d){ return d.y0; })
        .outerRadius(function(d){ return d.y1; });

    //display and color arcs
    svg1.selectAll("path").data(root.descendants()).enter()
        .append("g").attr("class", "node").append("path")
        .attr("display", function(d){
            //console.log(d.data.name);
            if(d.depth){
                return null;
            } else {
                return "none";
            }
        })
        .attr("d", arc)
        .style("stroke", "#292030")
        .style("fill", function(d){
            //determine color depending on what's selected/deselected
            if (d.depth == 1){
                var s = d.data.name;
                if (containsWords("all", spec[1]) || containsWords(s, spec[1])){
                    return color[1];
                } else {
                    return color[0];
                }
            } else if (d.depth == 2){
                var s = d.parent.data.name;
                if (containsWords("all", spec[1]) || containsWords(s, spec[1])){
                    return color[1];
                } else {
                    return color[0];
                }
            }
        })
        //add mouse events
        .on("mouseover", function(d){
            d3.select(this).style("cursor", "pointer");
        })
        .on("mouseout", function(d){
            d3.select(this).style("cursor", "default");
        })
        //on click, renew specs
        .on("click", function(d){
            //console.log(d.data.name + " selected");
            if (d.depth == 1){
                //console.log("selected " + d.data.name);
                changeQuery(d.data.name);
            } else if (d.depth == 2){
                changeQuery(d.parent.data.name);
            }
        })
        //on hover, display slice information
        .append("svg:title")
        .text(function(d){
            var s;
            if (d.depth == 1){
                var x = d.data.name;
                s = x[0].toUpperCase() + x.substring(1);
            } else {
                s = d.data.name + " (" + d.data.size + ")";
            }
            return s;
        });

    //add labels only to meat products bc slices can be absurdly small
    svg1.selectAll(".node")
        .append("text")
        .attr("fill", function(d){
            if (d.depth == 1){
                var s = d.data.name;
                if (containsWords("all", spec[1]) || containsWords(s, spec[1])){
                    return color[0];
                } else {
                    return color[1];
                }
            } else if (d.depth == 2){
                var s = d.parent.data.name;
                if (containsWords("all", spec[1]) || containsWords(s, spec[1])){
                    return color[0];
                } else {
                    return color[1];
                }
            }
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
        .attr("dx", "-5")
        .attr("dy", ".2em")
        .text(function(d){
            if (d.depth > 1){
                return "";
            } else {
                if (d.parent){
                    return d.data.name;
                } else {
                    return "";
                }
            }
        });

}

/** VIS 2: DONUT CHART OF ALLERGEN CLASS TYPE**/
function doV2(specs){
    rtable2 = processV2(rawdata, specs);
    makeV2(rtable2, specs);
}
function processV2(raw, specs){
    var table = [
        {type: "I", num: 0},
        {type: "II", num: 0},
        {type: "III", num: 0}
    ];
    var years = specs[0];
    var ingred = specs[1];
    var allergen = specs[2];
    //filter out information according to query of specs
    for (var i = 0; i < raw.length; i++){
        var item = raw[i];
        if (years[0] != "all"){
            if (!containsWords(item.date, years)){
                continue;
            }
            //console.log("year pass");
        }
        if (ingred[0] != "all"){
            if (!containsWords(item.ingredients, ingred)){
                continue;
            }
            //console.log("ingred pass");
        }
        if (allergen[0] != "all"){
            if (!containsWords(item.reason, allergen)){
                continue;
            }
            //console.log("reason pass");
        }

        //sort by type number into table to return
        //console.log(item.class);
        if (item.class == "I"){
            table[0].num += item.num;
        }
        if (item.class == "II"){
            table[1].num += item.num;
        }
        if (item.class == "III"){
            table[2].num += item.num;
        }
    }
    var sum = 0;
    for (i = 0; i < table.length; i++){
        sum += table[i].num;
    }
    for (i = 0; i < table.length; i++){
        table[i].num = (table[i].num)/sum;
    }
    return table;
}
function makeV2(table, specs){
    //clear any previous elements
    clearChildren(document.getElementById("vv2"));
    clearChildren(document.getElementById("q2"));

    //console.log(table);
    var width = 500 - 50;
    var height = width;
    var radius = Math.min(width, height) / 2;
    if (radius > 200){ radius = 160; }
    //console.log(radius);
    var color = d3.scaleOrdinal().range(colorblossom);

    //append svg to div, append g to svg
    var svg = d3.select("#vv2").append("svg")
        .attr("width", width).attr("height", height - 50)
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2 - 50) + ")");

    //define the size of the parts of the chart
    var arc = d3.arc().innerRadius(radius - 75).outerRadius(radius)
    //create the chart and bind data to it
    var donut = d3.pie()
        .value(function (d) {
            return d.num;
        }).sort(null);
    var path = svg.selectAll("path")
        .data(donut(table)).enter()
        .append("path")
        .attr("d", arc)
        .attr("stroke", "#292030")
        .attr("fill", function(d, i){
            return color(d.data.type);
        })
        .append("svg:title")
        .text(function(d){
            var n;
            if (d.data.type == "I"){
                n = "Urgent";
            } else if (d == "II"){
                n = "Intermediate";
            } else {
                n = "Not As Serious";
            }
            return "Type " + d.data.type + ": " + n;
        });

    //create legend
    var rectSize = 20;
    var rectSpace = 4;
    //set the position of the legend inside the donut
    var legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter()
        .append("g").attr("class", "legend2")
        .attr("transform", function(d, i){
            var height = rectSize + rectSpace;
            var offset = height * color.domain().length / 2;
            var h = -2 * rectSize;
            var v = i * height - offset;
            return ("translate(" + h + "," + v + ")");
        });
    //add the squares/colors
    legend.append("rect")
        .attr("width", rectSize).attr("height", rectSize)
        .style("fill", color).style("stroke", color);
    //Add labels to the legend's rectangles
    legend.append("text")
        .attr("x", rectSize + rectSpace)
        .attr("y", rectSize - rectSpace)
        .attr("fill", "#bbbbbb")
        .text(function (d) {
            var n;
            if (d == "I"){
                n = table[0].num;
            } else if (d == "II"){
                n = table[1].num;
            } else {
                n = table[2].num;
            }
            return d + " (" + (n*100).toFixed(2) + "%)";
        })

    //print query in the query box
    //remove any previous lines
    var querypar = document.getElementById("q2"),
        elements = querypar.getElementsByTagName("p");
    if (elements.length > 0){
        querypar.removeChild(elements[0]);
    }
    //add new line
    var years = makeString(specs[0]), ingreds = makeString(specs[1]);
    var q = years + " > " + ingreds;
    var para = document.createElement("p"),
        text = document.createTextNode(q);
    querypar.appendChild(text);
    querypar.appendChild(para);
}

/** VIS 3: UNDIRECTED WEIGHTED GRAPH OF MEATS CONNECTED BY ALLERGEN TYPE**/
function doV3(specs){
    rtable3 = processV3(rawdata, specs);
    var nodes = rtable3[0], links = rtable3[1];
    //console.log(nodes);
    //console.log(links);
    makeV3(rtable3, specs, nodes, links);
}
function processV3(raw, specs, nodes, links){
    var table = new Array;
    var years = specs[0];
    var ingred = specs[1];
    var allergen = specs[2];
    if (ingred[0] == "all"){
        ingred = ingredientList;
    }

    //initiate list of weights
    for (var i = 0; i < ingred.length; i++){
        var x = [ingred[i]];
        for (var j = 0; j < (cause.length); j++){
            x.push(0);
        }
        table.push(x);
    }

    //fill adjacency matrix for ingredients
    for (i = 0; i < raw.length; i++){
        var item = raw[i];
        if (years[0] != "all"){
            if (!containsWords(item.date, years)){
                continue;
            }
            //console.log("year pass");
        }
        for (j = 0; j < table.length; j++){
            //check item's ingredient
            if (item.ingredients == table[j][0]){
                //check item's reason
                for (var k = 1; k < cause.length; k++){
                    if (item.reason == cause[k - 1]){
                        table[j][k] += 1;
                    }
                }
            }
        }
    }

    //create links from ingredients to allergens
    var nodes = new Array, links = new Array;
    table.forEach(function(d){
        for (i = 1; i < d.length; i++){
            if (d[i] > 0){
                links.push({source: ingred.indexOf(d[0]),
                    target: (ingred.length + (i - 1)),
                    weight: d[i]});
            }
        }
    });
    //create nodes list
    for (i = 0; i < ingred.length; i++){
        nodes.push({id: ingred[i], ctype: "ingredient"});
    }
    for (i = 0; i < cause.length; i++){
        nodes.push({id: cause[i], ctype: "cause"});
    }
    //package nodes and links to be processed outside
    return [nodes, links];
}
function makeV3(table, specs, nodes, links){
    //clear any previous elements
    clearChildren(document.getElementById("vv3"));

    var width = 500, height = 500, radius = 10;
    var color1 = colorblossom;
    //put svg in div container
    var svg3 = d3.select("#vv3").append("svg").attr("width", width).attr("height", height);
    //create undirected graph
    var simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("link", d3.forceLink(links).distance(200).strength(0.5));

    //select links, nodes, and labels and add attributes, color of nodes depends on type
    var slinks = svg3.selectAll("line").data(links).enter()
        .append("line")
        .attr("stroke", color1[0])
        .attr("stroke-width", "3px");
    var snodes = svg3.selectAll("circle").data(nodes).enter()
        .append("circle")
        .attr("r", radius)
        .attr("fill", function(d){
            if (d.ctype == "ingredient"){
                return color1[1];
            } else {
                return color1[2];
            }
        })
        .on("mouseover", function(d){
            d3.select(this).style("cursor", "move");
        })
        .on("mouseout", function(d){
            d3.select(this).style("cursor", "default");
        })
        .call(d3.drag()
            .on("start", function(d){
                if (!d3.event.active){
                    simulation.alphaTarget(0.3).restart();
                }
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", function(d){
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            })
            .on("end", function(d){
                if (!d3.event.active){
                    simulation.alphaTarget(0);
                }
                d.fx = null;
                d.fy = null;
            })
        );
    var labels = svg3.selectAll("text").data(nodes).enter()
        .append("text")
        .text(function(d){
            if (d.ctype == "ingredient"){
                return (d.id).toUpperCase();
            }
            return d.id;
        })
        .style("text-anchor", "middle")
        .style("fill", color1[1])
        .style("font-size", 12);

    //update position of node, links, and labels each tick update
    function ticked(){
        updateLinks();
        updateNodes();
        updateLabels();
    }
    function updateLinks() {
        slinks
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    }
    function updateNodes() {
        snodes
            .attr("cx", function(d) {
                return d.x = Math.max(radius, Math.min(width - radius, d.x));
            })
            .attr("cy", function(d) {
                return d.y = Math.max(radius, Math.min(height - radius, d.y));
            });
    }
    function updateLabels(){
        labels
            .attr("x", function(d){ return d.x; })
            .attr("y", function(d){ return d.y - 15; });
    }

    simulation.on("tick", ticked);
}