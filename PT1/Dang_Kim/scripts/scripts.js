//GLOBAL VARIABLES
var rtable1 = new Array, rtable2 = new Array, raw = new Array,
    rtable3 = new Array, rtable4 = new Array;
var table1, table2 = new Array, table4 = new Array,
    table3, drafttable, namelist = new Array, namelist2 = new Array, namelist3 = new Array, nodes;
var c1 = ["#8AC6D0", "#63768D"];
var beneList = ["Benefits", "DiscEmp", "DiscCowkr", "DiscSuper", "MHSerious", "Anon", "Wellness", "Leave"];

//LOAD THE DATA
d3.csv("./scripts/survey.csv", function(data){
    data.forEach(function (d){
        var item = {Gender: d["Gender"],
                    treatment: d["treatment"],
                    state: d["state"],
                    benefits: d["benefits"],
                    mental_health_consequences: d["mental_health_consequences"],
                    coworkers: d["coworkers"],
                    supervisor: d["supervisor"],
                    mental_vs_physical: d["mental_vs_physical"],
                    anonymity: d["anonymity"],
                    wellness_program: d["wellness_program"],
                    leave: d["leave"]};

        //load data for viz 1
        var item1 = [d["Gender"], d["treatment"]];
        rtable1.push(item1);

        //load data for viz 2, filter out non-tech and non-benefits companies
        if (d["benefits"] == "Yes"){
            var item2 = d["state"];
            if (d["tech_company"] == "Yes"){
                rtable2.push(item2);
            }
        }

        var item3 = [d["benefits"], d["mental_health_consequences"], d["coworkers"],
                d["supervisor"], d["mental_vs_physical"], d["anonymity"], d["wellness_program"], d["leave"]];
        rtable3.push(item3);

        if (d["tech_company"] == "Yes"){
            raw.push(item);
        }
    });

    //call setup functions
    setUpQ1();
    makeQ1();
    setUpQ2();  //yes tech
    makeQ2();
    nodes = new Array;
    setUpQ3();
    makeQ3();
    rtable4 = new Array;
    setUpQ4();
    makeQ4();

//PROCESS THE DATA
//Q1: family history = more likely to seek help?
    function setUpQ1(){
        //indexed as fam - yes/no, treat - yes/n
        drafttable = [0, 0, 0, 0];
        //filter raw data and calculate ratios for definite yes and no
        for (var i = 0; i < rtable1.length; i++){
            if (isFemale(rtable1[i][0])){
                if (rtable1[i][1] == "Yes"){
                    drafttable[0] = drafttable[0] + 1;
                } else {
                    drafttable[1] = drafttable[1] + 1;
                }
            } else if (isMale(rtable1[i][0])) {
                if (rtable1[i][1] == "Yes"){
                    drafttable[2] = drafttable[2] + 1;
                } else {
                    drafttable[3] = drafttable[3] + 1;
                }
            }
        }
        table1 = [drafttable[0]/(drafttable[0] + drafttable[1]), drafttable[2]/(drafttable[2] + drafttable[3])];
    }
    //there are many answers so tried my best to fit to two choices. explicit trans options included
    function isMale(opt){
        if ((opt == "m") || (opt == "M") ||
            (opt == ("male")) || (opt == "Male" )){
            return true;
        }
        return false;
    }
    function isFemale(opt){
        if ((opt == "f") || (opt == "F") ||
            (opt.indexOf("fem") != -1) || (opt.indexOf("Fem") != -1) ||
            (opt.indexOf("woman") != -1) || (opt.indexOf("Woman") != -1)){
            return true;
        }
        return false;
    }
    //create viz
    function makeQ1(){
        var width = 700, height = 100, padding = 24, left_padding = 100;
        var svg = d3.select("#q1").append("svg").attr("width", width).attr("height", height + padding);

        //define scales
        var x = d3.scaleLinear().rangeRound([0, width]);
        var y = d3.scaleLinear().rangeRound([0, height]);

        //var xA = d3.axisBottom(x).ticks(2);
        var yA = d3.axisLeft(y).ticks(2).tickFormat(function (d){
            if (d < 0.5){
                return "Male";
            } else{
                return "Female";
            }
        });

        //set axes
        //svg.append("g").attr("class", "axis").attr("transform", "translate(-" + padding  + ", " + (height - padding*2) + ")").call(xA);
        var g = svg.append("g").attr("class", "axis").attr("transform", "translate(" + (left_padding - padding) + ", " + padding*2 + ")").call(yA);

        //Add bars
        //Add bars for those who didn't seek help
        g.append("g").selectAll("rect")
            .data(table1).enter().append("rect")
            .attr("x", function(d,i){
                return (width - padding*5)*d;
            }).attr("y", function(d, i){
            return -10 + i*50 - 1;
        })
            .attr("width", function(d){
                return (width - padding*5)*(1 - d);
            }).attr("height", 25)
            .attr("fill", c1[1]);
        //bars for those who need help
        g.append("g").selectAll("rect")
            .data(table1).enter().append("rect")
            .attr("x", 0).attr("y", function(d, i){
            return -10 + i*50 - 1;
        })
            .attr("width", function(d){
                return (width - padding*5)*d;
            }).attr("height", 25)
            .attr("fill", c1[0]);

        //apply title
        svg.append("text").attr("x", width/2).attr("y", padding)
            .attr("text-anchor", "middle")
            .text("Segmented Bar Graph between Family History and Seeking Help").style("fill", "#bbbbbb");

        //create legend
        var legData = 0;
        var legend1 = d3.select("#q1_legend").append("svg").attr("width", width).attr("height", 15);
        //set text data
        var leg1 = legend1.selectAll(".leg1").data(["Sought help", "Did not seek help"])
            .enter().append("g").attr("class", "legend")
            .attr("transform", function(d, i){
                if (i == 0){
                    legData = d.length + 100;
                    return "translate(0,0)";
                } else {
                    var temp = legData;
                    legData += d.length + 100;
                    return "translate(" + temp + ",0)";
                }
            });
        //add customize to the legend
        leg1.append("rect").attr("x", 0).attr("y", 2).attr("width", 10).attr("height", 10)
            .style("fill", function(d, i){
                return d3.rgb(c1[i]);
            });
        //bind text to the legend
        leg1.append("text").attr("x", 15).attr("y", 12).text(function(d, i){ return d;})
            .style("text-anchor", "start").style("fill", "#bbbbbb");
    }

//Q2:
    function setUpQ3(){
        table3 = new Array;
        //set up table of weights
        for (var l = 0; l < beneList.length; l++){
            var x = [beneList[l], 0, 0, 0, 0, 0, 0, 0, 0];
            table3.push(x);
        }

        //create an adjacency matrix of sorts depending on frequency of links
        for (var i = 0; i < rtable3.length; i++){
            var survey = rtable3[i];
            for (var j = 0; j < survey.length; j++){
                for (var k = 0; k < survey.length; k++){
                    if (j != k && isValid(survey[j], (j == 1)) && isValid(survey[k], (k == 1))){
                        table3[j][k + 1] += 1;
                    }
                }
            }
        }
        var temptable = table3;
        table3 = new Array;
        //create adjacency list of links
        temptable.forEach(function(d){
            for (var p = 1; p < d.length; p++){
                if (d[p] >=115){
                    //console.log(d[p]);
                    table3.push({source: beneList.indexOf(d[0]), target: p - 1, weight: d[p]});
                }
            }
        });
        //console.log(table3);
        //create nodes list
        for (var p = 0; p < beneList.length; p++){
            nodes.push({id: beneList[p]});
        }
        //console.log(nodes);
    }
//Are the responses valid return true or false
    function isValid(option, invert){
        if (invert == true){
            if (option == "No"){
                return true;
            }
        }
        if (option == "Yes"){
            return true;
        } else if (option == "Very easy"){
            return true;
        } else if (option == "Somewhat easy"){
            return true;
        }
        return false;
    }
    //create viz
    function makeQ3(){
        var width = 500, height = 500, radius = 5;
        var color = ["#554971",
            "#63768D",
            "#8AC6D0"];

        //put svg into div container
        var svg3 = d3.select("#q3").append("svg")
            .attr("width", width).attr("height", height);

        //create undirected graph
        var simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("link", d3.forceLink(table3).distance(200).strength(0.5));

        //select groups: links, nodes, and labels and add attributes
        //select all lines and format the thickness
        var slinks = svg3.selectAll("line").data(table3).enter()
            .append("line")
            .attr("stroke", color[1])
            .attr("stroke-width", function(d){
                var thick = d.weight/10;
                if (thick > 20){
                    thick = 10;
                } else if (thick > 15){
                    thick = 5;
                } else {
                    thick = 1;
                }
                return thick + "px";
            });
        //select all nodes and format position. also include dragging interactivity
        var snodes = svg3.selectAll("circle").data(nodes).enter()
            .append("circle")
            .attr("r", radius)
            .attr("fill", color[2])
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
        //select all labels and make sure they move with the nodes
        var labels = svg3.selectAll("text").data(nodes).enter()
            .append("text").text(function(d){ return d.id; })
            .style("text-anchor", "middle")
            .style("fill", color[2])
            .style("font-size", 12);

        //each tick update position of nodes and links and labels
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

        //console.log("Checkpt 2");
        simulation.on("tick", ticked);
    }

//Q3:
    //setup for individual word clouds
    function setUpQ2(){
        //filter out survey subjects not in the united states
        for (var i = 0; i < rtable2.length; i++){
            var s = rtable2[i];
            if (s != "NA"){
                var index = doesStateExist(s, table2);
                //check if the state already exists in the table, add the state if not existent
                if (index >= 0){
                    table2[index][1] += 1;
                } else {
                    namelist.push(s);
                    var tab = [s, 1];
                    table2.push(tab);
                }
            }
        }
        //console.log(table2);
    }
    /*function setUpQ22(){
        //filter out survey subjects not in the united states
        for (var i = 0; i < rtable2.length; i++){
            var s = rrtable2[i];
            if (s != "NA"){
                var index = doesStateExist(s, table22);
                //check if the state already exists in the table, add the state if not existent
                if (index >= 0){
                    table22[index][1] += 1;
                } else {
                    namelist2.push(s);
                    var tab = [s, 1];
                    table22.push(tab);
                }
            }
        }
        console.log(table22);
    }*/
    //check if state already exists in list while building list
    function doesStateExist(stateName, table){
        //checks if the state name already exists and returns proper index
        if (table.length < 1){
            return -1;
        }
        for (var i = 0; i < table.length; i++) {
            var check = table[i];
            if (check[0] == stateName) {
                return i;
            }
        }
        return -1;
    }
    //creat viz
    function makeQ2(){
        var width = 500, height = 200;
        var color = ["#554971",
            "#63768D",
            "#8AC6D0"];

        //add cloud for tech companies
        //Word Cloud Layout plugin by Jason Davies
        d3.layout.cloud().size([width, height])
        //turn array data into JSON object data
            .words(namelist.map(function(d){
                return {text: d, size: table2[doesStateExist(d, table2)][1]};
            }))
            //no rotating the text please
            .rotate(0)
            //determine font size of the text, very small text will be boosted a few more points
            .fontSize(function(d){
                //console.log(d);
                if (d.size < 20){
                    return 10 + d.size*2;
                }
                return d.size; })
            .on("end", function(words){
                //set d3 viz to actual div container
                d3.select("#q2").append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    //center the viz in the actual window
                    .attr("transform", "translate(" + width/2 + "," + (height/2 + 10) + ")")
                    .selectAll("text")
                    //bind data to elements
                    .data(words).enter().append("text")
                    .style("font-size", function(d){
                        return d.size + "px";
                    })
                    //set text, color, and position
                    .text(function(d){ return d.text; })
                    .attr("text-anchor", "middle")
                    //define color of the text depending on the size of the word
                    .attr("fill", function(d){
                        if (d.size >= 40){
                            namelist3.push(d.text);
                            return color[2];
                        } else if (d.size >= 20){
                            return color[1];
                        } else {
                            return color[0];
                        }
                    })
                    .attr("transform", function(d){
                        return "translate(" + [d.x, d.y] + ")";
                    });
            })
            .start();
    }


//Q4:
    function setUpQ4(){
        //create json for table
        var tt = new Array;
        var list = new Array;
        for (var j = 0; j < beneList.length; j++){
            list.push({"name": beneList[j], "size": 1});
        }
        for (var k = 0; k < namelist3.length; k++){
            var state = {"name": namelist3[k],
                "children": []};
            state.children = [{"name": "M", "children": list},
                {"name": "F", "children": list}];

            tt.push(state);
        }

        //console.log("length " + raw.length);
        var temp = new Array;
        for (var j = 0; j < namelist3.length; j++){
            var x = new Array;
            temp.push(x);
        }
        //sort through and filter responses down to only those that belong in the top states from Q3
        for (var i = 0; i < raw.length; i++){
            var subj = raw[i];
            //console.log(subj)
            var isGood = isGoodState(subj.state);
            if (isGood >= 0){
                temp[isGood].push(subj);
            }
        }
        //console.log(temp);

        //Filter to gender then fill count
        //console.log(temp2);
        for (var i = 0; i < temp.length; i++){
            var subj = temp[i];
            var f1 = freshArr();
            var m1 = freshArr();
            for (var k = 0; k < subj.length; k++){
                if (isFemale(subj[k].Gender)){
                    f1 = fillOut(f1, subj[k]);
                } else if (isMale(subj[k].Gender)){
                    m1 = fillOut(m1, subj[k]);
                }
            }
            //f1 = trim(f1);
            f1 = trim(f1);
            m1 = trim(m1);

            //replace old weights with new weights for each list per gender
            tt[i].children[0].children = m1;
            tt[i].children[1].children = f1;
        }

        //make new array
        function freshArr(){
            var list1 = new Array;
            for (var j = 0; j < beneList.length; j++){
                list1.push({"name": beneList[j], "size": 0});
            }
            return list1;
        }

        //count yes instance for each benefit
        function fillOut(arr, s){
            var x = arr;
            if (isValid(s.benefits, false)){
                x[0].size += 1;
            }
            if (isValid(s.mental_health_consequences, true)){
                x[1].size += 1;
            }
            if (isValid(s.coworkers, false)){
                x[2].size += 1;
            }
            if (isValid(s.supervisor, false)){
                x[3].size += 1;
            }
            if (isValid(s.mental_vs_physical, false)){
                x[4].size += 1;
            }
            if (isValid(s.anonymity, false)){
                x[5].size += 1;
            }
            if (isValid(s.wellness_program, false)){
                x[6].size += 1;
            }
            if (isValid(s.leave, false)){
                x[7].size += 1;
            }
            return x;
        }
        //trim results with too small numbers
        function trim(arr){
            var x = new Array;
            var ind = new Array;
            for (var i = 0; i < arr.length; i++){
                if (arr[i].size < 3) {
                    ind.push(i);
                } else {
                    x.push(arr[i]);
                }
            }
            return x;
        }

        //finalize json for use
        table4 = {"name": "table4", "children": tt};
    }
    //is the state one of the featured states to evaluate?
    function isGoodState(state){
        for (var j = 0; j < namelist3.length; j++){
            if (state == namelist3[j]){
                return j;
            }
        }
        return -1;
    }
    //make viz
    function makeQ4(){
        var width = 500, height = 500;
        var radius = Math.min(width, height)/2;
        var color = ["#34344A",
            "#2E86AB",
            "#8AC6D0",
            "#804040",
            "#CE7B91"];
        //put svg in container
        var svg4 = d3.select("#q4").append("svg")
        .attr("width", width).attr("height", height)
        .append("g")
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

        //create partition space
        var partition = d3.partition().size([2 * Math.PI, radius]);
        //find root node
        var root = d3.hierarchy(table4).sum(function(d){ return d.size; });

        //create arcs
        partition(root);
        //determine the size of the arcs
        var arc = d3.arc()
            .startAngle(function(d) { return d.x0;})
            .endAngle(function(d) { return d.x1;})
            .innerRadius(function(d){ return d.y0; })
            .outerRadius(function(d){ return d.y1; });

        //combine all arcs and put up for display
        svg4.selectAll("path")
            .data(root.descendants())
                .enter()
            //add to use for text labels if needed
            .append("g").attr("class", "node")
                .append("path")
            .attr("display", function(d){
                if (d.depth){
                    return null;
                } else {
                    return "none";
                }
            })
            .attr("d", arc)
            //outline to separate pieces
            .style("stroke", "#212121")
            .style("fill", function(d){
                //determine color levels
                if (d.depth == 1){
                    return color[0];
                } else if (d.depth == 2){
                    if (d.data.name == "M"){
                        return color[1];
                    } else {
                        return color[3];
                    }
                } else if (d.depth == 3){
                    if (d.parent.data.name == "M"){
                        return color[2];
                    } else {
                        return color[4];
                    }
                }
            });

        //apply labels for states and genders only
        svg4.selectAll(".node")
            .append("text")
            .attr("fill", "#FFF")
            //rotate labels to fit circle
            .attr("transform", function(d){
                var angle = (d.x0 + d.x1)/Math.PI * 90;
                var realangle;
                if (angle < 90 || angle > 270){
                    realangle = angle;
                } else {
                    realangle = angle + 180;
                }
                return "translate(" + arc.centroid(d) + ") rotate (" + realangle + ")";
            })
            .attr("dx", "-5")
            .attr("dy", ".2em")
            //put text but only if it's state or gender
            .text(function(d){
                if (d.depth > 2){
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
});
