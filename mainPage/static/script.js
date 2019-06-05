var imo_qty = 0;
var gcras_qty = 0;
var h_imo_qty = 0, l_imo_qty = 0, n_imo_qty = 0, h_gcras_qty = 0, l_gcras_qty = 0, n_gcras_qty = 0;
var sum = 0;

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/TextSymbol",
    "esri/widgets/Search",
    "dojo/domReady!"
], function (Map, MapView, Graphic, Point, SimpleMarkerSymbol, TextSymbol, Search) {

    //streets", "satellite", "hybrid", "terrain", "topo", "gray", "dark-gray", "oceans", "national-geographic", "osm", "dark-gray-vector", "gray-vector", "streets-vector", "topo-vector", "streets-night-vector", "streets-relief-vector", "streets-navigation-vector"

    drawpie(0, 0, 0, 0);
    var map = new Map({
        basemap: "gray-vector"
    });

    var view;
    createView(0);



    function createView(flag) {
        view = new MapView({
            container: "map",
            map: map,
            center: [54.7249, 55.9425],
            zoom: 5,
            constraints: {
                minZoom: 2
            }
        });

        view.on("click", function (evt) {
            var screenPoint = {
                x: evt.x,
                y: evt.y
            };

            view.hitTest(screenPoint).then(function (response) {
                if (response.results[0].graphic) {
                    document.getElementById("station").innerHTML = response.results[0].graphic.getAttribute("id");

                }
            });



        });

        var searchWidget = new Search({
            view: view
        });

        // Adds the search widget below other elements in
        // the top left corner of the view
        view.ui.add(searchWidget, {
            position: "top-right",
            index: 0
        });
      /*  if (flag == 0) {
            IMOs();
        }
        else {
            IMOs_corr();
        }*/
    }


    function loadValues() {
        data = '2018-01-04';
        let url = '/info/?date=' + data;
       // console.log(url);
        $.ajax(
            {
                url: url,
                success: function (json) {
                    //console.log(json);
                    showIMO(json);
                }
            });
    }
    loadValues();
    function showIMO(json) {
        jsObj = $.parseJSON(json);
       let counts = {
            '1': 0,
            '2': 0,
            '3': 0,
			'4':0
        };
		C = midC(jsObj);
        for ( key in jsObj) {
            newDrawInfo(key, jsObj[key].coords.lat, jsObj[key]['coords']['long'], jsObj[key]['eff'], C);
            counts[getClass(jsObj[key]['eff'], C)]++;
        }
		
		drawpie1(counts['1'], counts['2'], counts['3'],counts['4'],  1);
    }
function midC(jsObj){
	sum = 0;
	cnt = 0;
	   for ( key in jsObj) {
		   cnt++;
            sum+=jsObj[key]['eff'];
        }
		return sum/cnt;
}
    function fixLng(lng) {
        if (lng > 180) {
            lng = lng - 360;
        }
        return lng;
    }

    function newDrawInfo(code, lat, lng, eff, C) {
        lng = fixLng(lng);

        let point = getPoint(lat, lng);

        let style = "diamond";
        let size = "14px";
        let text = code + ' (' + eff + ' %)';


        let clas = getClass(eff, C);
        let color = getColor(clas);


        var markerSymbol = new SimpleMarkerSymbol({
            color: color,
            style: style,
            size: size,
            outline: { // autocasts as new SimpleLineSymbol()
                color: [255, 255, 255],
                width: 1
            }
        });

        var textSymbol = new TextSymbol({
            color: color,
            backgroundColor: [255, 255, 255],
            text: text,
            xoffset: 3,
            yoffset: 5,
            font: {  // autocast as esri/symbols/Font
                size: 10,
                family: "sans-serif",
                weight: "bolder"
            }
        });




        var pointGraphic = new Graphic({
            geometry: point,
            symbol: markerSymbol
        });

        pointGraphic.setAttribute("id", code);



        view.graphics.addMany([pointGraphic]);

        pointGraphic = new Graphic({
            geometry: point,
            symbol: textSymbol
        });

        view.graphics.addMany([pointGraphic]);

    }

   

    function getPoint(lat, lng) {
        let point = new Point({
            longitude: lng,
            latitude: lat
        });

        return point;
    }


    function getClass(eff, C) {
if(eff>=100)
	return '1';

        if (eff >=C)
            return '2';
        if (eff >0)
            return '3';
        return '4';
    }

    function getColor(clas) {
		if(clas=='4')
			return [0, 0, 0];
        if (clas == '3')
            return [227, 0, 0];
        if (clas == '2')
            return color = [227, 206, 0];;
        if (clas == '1')
            return color = [0, 153, 0];;
    }


    function formatDate(date) {
        //2016-11-01 
        var year = date.slice(0, 4);
        var month = date.slice(5, 7);
        var day = date.slice(8, 10);
        if (month == '01') {
            month = "Jan.";
        }
        if (month == '02') {
            month = "Feb.";
        }
        if (month == '03') {
            month = "March";
        }
        if (month == '04') {
            month = "April";
        }
        if (month == '05') {
            month = "May";
        }
        if (month == '06') {
            month = "June";
        }
        if (month == '07') {
            month = "July";
        }
        if (month == '08') {
            month = "Aug.";
        }
        if (month == '09') {
            month = "Sept.";
        }
        if (month == '10') {
            month = "Oct.";
        }
        if (month == '11') {
            month = "Nov.";
        }
        if (month == '12') {
            month = "Dec.";
        }
        // 1 Oct, 2016 
        format_date = month + " " + day + ", " + year;

        return format_date;
    }



    });


function drawpie1(c1, c2, c3, c4,  flag) {
    var svg, color;
    if (flag != 1) {
        svg = d3.select("svg"),
            width = 320,
            height = 147,
            radius = Math.min(width, height) / 2,
            g = svg.append("g").attr("transform", "translate(" + width / 2.33 + "," + height / 2 + ")");
        color = d3.scaleOrdinal(["#929292", "#929292", "#929292"]);
        data = [
            { "class": "", "population": 0 },
            { "class": "", "population": 0 },
            { "class": "Loading...", "population": 100 }
        ];
    } else {
        document.getElementById("avg").innerHTML = (sum / 156).toFixed(2);
        document.getElementById("puf").style.display = "none";
        color = d3.scaleOrdinal(["#003399", "#5E8EC4", "#B2B2B2", "#000000"]);
        svg = d3.select("#rr")
            .append("svg"),
            width = 320,
            height = 147,
            radius = Math.min(width, height) / 2,
            g = svg.append("g").attr("transform", "translate(" + width / 2.33 + "," + height / 2 + ")");
        data = [
            { "class": "High", "population": c1 },
            { "class": "None", "population": c4 },
            { "class": "Eff", "population": c2 },
			{ "class": "Low", "population": c3 }
        ];
    }




    var arcw = d3.arc()
        .outerRadius(radius);

    var pie = d3.pie()
        .sort(null)
        .value(function (d) { return d.population; });

    var path = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    var label = d3.arc()
        .outerRadius(radius - 39)
        .innerRadius(radius - 50);


    var arc = g.selectAll(".arc")
        .data(pie(data))
        .enter().append("g")
        .attr("class", "arc");



    var dd = arc.append("path")
        .attr("d", path)
        .attr("fill", function (d) { return color(d.data.class); });

    if (flag == 1) {
        dd.transition()
            .duration(1000)
            //.transition()
            .ease(d3.easeLinear)
            .attrTween("d", tweenPie);

        arc.on("mouseover", function (d) {
            d3.select("#tooltip")
                .style("left", d3.event.pageX + "px")
                .style("top", d3.event.pageY + "px")
                .style("opacity", 1)
                .select("#value")
                .text(100 * ((d.value / 156).toFixed(2)));
        })
            .on("mouseout", function () {
                // Hide the tooltip
                d3.select("#tooltip")
                    .style("opacity", 0);;
            });
    }
    function tweenPie(b) {
        b.innerRadius = 0;
        var i = d3.interpolate({ startAngle: 0, endAngle: 0 }, b);
        return function (t) { return arcw(i(t)); };
    }
    if (flag != 1) {
        arc.append("text")
            .attr("transform", function (d) { return "translate(" + label.centroid(d) + ")"; })
            .attr("dy", "0.37em")
            .style("fill", "#494A46")
            .text(function (d) { return d.data.class; });
    } else {
        arc.append("text")
            .attr("transform", function (d) { return "translate(" + label.centroid(d) + ")"; })
            .attr("dy", "0.37em")
            .text(function (d) { return d.data.class; });

    }



}


function drawpie(high, low, none, flag) {
    var svg, color;
    if (flag != 1) {
        svg = d3.select("svg"),
            width = 320,
            height = 147,
            radius = Math.min(width, height) / 2,
            g = svg.append("g").attr("transform", "translate(" + width / 2.33 + "," + height / 2 + ")");
        color = d3.scaleOrdinal(["#929292", "#929292", "#929292"]);
        data = [
            { "class": "", "population": 0 },
            { "class": "", "population": 0 },
            { "class": "Loading...", "population": 100 }
        ];
    } else {
        document.getElementById("avg").innerHTML = (sum / 156).toFixed(2);
        document.getElementById("puf").style.display = "none";
        color = d3.scaleOrdinal(["#003399", "#5E8EC4", "#B2B2B2"]);
        svg = d3.select("#rr")
            .append("svg"),
            width = 320,
            height = 147,
            radius = Math.min(width, height) / 2,
            g = svg.append("g").attr("transform", "translate(" + width / 2.33 + "," + height / 2 + ")");
        data = [
            { "class": "High", "population": high },
            { "class": "Low", "population": low },
            { "class": "None", "population": none }
        ];
    }




    var arcw = d3.arc()
        .outerRadius(radius);

    var pie = d3.pie()
        .sort(null)
        .value(function (d) { return d.population; });

    var path = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    var label = d3.arc()
        .outerRadius(radius - 39)
        .innerRadius(radius - 50);


    var arc = g.selectAll(".arc")
        .data(pie(data))
        .enter().append("g")
        .attr("class", "arc");



    var dd = arc.append("path")
        .attr("d", path)
        .attr("fill", function (d) { return color(d.data.class); });

    if (flag == 1) {
        dd.transition()
            .duration(1000)
            //.transition()
            .ease(d3.easeLinear)
            .attrTween("d", tweenPie);

        arc.on("mouseover", function (d) {
            d3.select("#tooltip")
                .style("left", d3.event.pageX + "px")
                .style("top", d3.event.pageY + "px")
                .style("opacity", 1)
                .select("#value")
                .text(100 * ((d.value / 156).toFixed(2)));
        })
            .on("mouseout", function () {
                // Hide the tooltip
                d3.select("#tooltip")
                    .style("opacity", 0);;
            });
    }
    function tweenPie(b) {
        b.innerRadius = 0;
        var i = d3.interpolate({ startAngle: 0, endAngle: 0 }, b);
        return function (t) { return arcw(i(t)); };
    }
    if (flag != 1) {
        arc.append("text")
            .attr("transform", function (d) { return "translate(" + label.centroid(d) + ")"; })
            .attr("dy", "0.37em")
            .style("fill", "#494A46")
            .text(function (d) { return d.data.class; });
    } else {
        arc.append("text")
            .attr("transform", function (d) { return "translate(" + label.centroid(d) + ")"; })
            .attr("dy", "0.37em")
            .text(function (d) { return d.data.class; });

    }



}
