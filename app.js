// Default Axis Categories
var chosenXAxis = "poverty";
var chosenYAxis = "healthcare";

// Select SVG Area... It may be empty
var svgArea = d3.select("#scatter").select("svg");

// Initialize SVG wrapper dimensions.
var svgWidth = 960;
var svgHeight = 500;

var margin = {
    top: 50,
    bottom: 80,
    right: 50,
    left: 85
};

var height = svgHeight - margin.top - margin.bottom;
var width = svgWidth - margin.left - margin.right;

// Append SVG element
var svg = d3
    .select("#scatter")
    .append("svg")
    .attr("height", svgHeight)
    .attr("width", svgWidth);

// function used for updating x-scale var upon click on axis label
function xScale(censusData, width) {
    // create scales
    var xLinearScale = d3.scaleLinear()
        .domain([d3.min(censusData, d => d[chosenXAxis]) * 0.8,
        d3.max(censusData, d => d[chosenXAxis]) * 1.2
        ]).range([0, width]);
    return xLinearScale;
}

// function used for updating y-scale var upon click on axis label
function yScale(censusData, height) {
    // create scales
    var yLinearScale = d3.scaleLinear()
        .domain([0, d3.max(censusData, d => d[chosenYAxis])])
        .range([height, 0]);

    return yLinearScale;
}

// function used for updating xAxis var upon click on axis label
function renderXAxis(newXScale, xAxis) {
    var bottomAxis = d3.axisBottom(newXScale);
    xAxis.transition().duration(1000).call(bottomAxis);
    return xAxis;
}

// function used for updating yAxis var upon click on axis label
function renderYAxis(newYScale, yAxis) {
    var leftAxis = d3.axisLeft(newYScale);
    yAxis.transition().duration(1000).call(leftAxis);
    return yAxis;
}

// function used for updating circles group with a transition to new circles
function renderCircles(circlesGroup, newXScale, newYScale) {
    circlesGroup.selectAll("circle").transition()
        .duration(1000)
        .attr("cx", d => newXScale(d[chosenXAxis]))
        .attr("cy", d => newYScale(d[chosenYAxis]));

    circlesGroup.selectAll("text").transition()
        .duration(1000)
        .attr("x", d => newXScale(d[chosenXAxis]) - 7)
        .attr("y", d => newYScale(d[chosenYAxis] - .2))

    return circlesGroup;
}

// function used for updating circles group with new tooltip
function updateToolTip(circlesGroup) {
    if (chosenXAxis === "poverty") {
        var xlabel = "In Poverty (%)";
    }
    else if (chosenXAxis === "age") {
        var xlabel = "Age (Median)";
    }
    else {
        var xlabel = "Household Income (Median)";
    }

    if (chosenYAxis === "healthcare") {
        var ylabel = "Lacks Healthcare (%)";
    }
    else if (chosenYAxis === "smokes") {
        var ylabel = "Smokes (%)";
    }
    else {
        var ylabel = "Obese (%)";
    }

    var toolTip = d3.tip()
        .attr("class", "tooltip")
        .offset([80, -60])
        .html(function (d) {
            return (`<p><strong>${d.state}</strong><br>${ylabel} ${d[chosenYAxis]}<br>${xlabel} ${d[chosenXAxis]}</p>`);
        });

    circlesGroup.call(toolTip);

    circlesGroup.on("mouseover", function (data) {
        toolTip.show(data, this);
    }).on("mouseout", function (data, index) {
        toolTip.hide(data, this);
    });

    return circlesGroup;
}

// Append group element
var chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Process CSV Data
d3.csv("assets/data/data.csv").then(function (censusData) {
    //console.log(censusData);

    // parse data
    censusData.forEach(function (row) {
        row.poverty = +row.poverty;
        row.healthcare = +row.healthcare;
        row.age = +row.age;
        row.smokes = +row.smokes;
        row.obesity = +row.obesity;
        row.income = +row.income;
    });

    // xLinearScale function above csv import
    var xLinearScale = xScale(censusData, width);

    // Create y scale function
    var yLinearScale = yScale(censusData, height);

    // Create initial axis functions
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    // append x axis
    var xAxis = chartGroup.append("g")
        .classed("x-axis", true)
        .attr("transform", `translate(0, ${height})`)
        .call(bottomAxis);

    // append y axis
    var yAxis = chartGroup.append("g")
        .classed("y-axis", true)
        .call(leftAxis);

    // append initial circles
    var circlesGroup = chartGroup.selectAll("g")
        .data(censusData)
        .enter()
        .append("g")

    circlesGroup.append("circle")
        .attr("cx", d => xLinearScale(d[chosenXAxis]))
        .attr("cy", d => yLinearScale(d[chosenYAxis]))
        .attr("r", 10)
        .attr("fill", 'lightskyblue')
        .attr("opacity", ".5")

    // decorate circles with state abbr
    circlesGroup.append("text")
        .attr("x", d => xLinearScale(d[chosenXAxis]) - 7)
        .attr("y", d => yLinearScale(d[chosenYAxis] - .2))
        .text(d => d.abbr)
        .attr("font-family", "sans-serif")
        .attr("font-size", "10px")
        .attr("fill", "grey");

    // updateToolTip function above csv import
    var circlesGroup = updateToolTip(circlesGroup);

    // create group for 3 x-axis labels
    var xLabelsGroup = chartGroup.append("g")
        .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.bottom) + ")")

    var povertyLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", -45)
        .attr("value", "poverty") // value to grab for event listener
        .classed("active", true)
        .text("In Poverty (%)");

    var ageLabel = xLabelsGroup.append("text")
        .attr("x", -50)
        .attr("y", -25)
        .attr("value", "age") // value to grab for event listener
        .classed("inactive", false)
        .text("Age (Median)");

    var incomeLabel = xLabelsGroup.append("text")
        .attr("x", -95)
        .attr("y", -5)
        .attr("value", "income") // value to grab for event listener
        .classed("inactive", false)
        .text("Household Income (Median)");

    // create group for 3 y-axis labels
    var yLabelsGroup = chartGroup.append("g").attr("transform", "rotate(-90)");

    var healthcareLabel = yLabelsGroup.append("text")
        .attr("x", -height / 2)
        .attr("y", 0)
        .attr("dy", "-1.5em")
        .attr("value", "healthcare") // value to grab for event listener
        .classed("active", true)
        .classed("axis-text", true)
        .text("Lacks Healthcare (%)");

    var smokesLabel = yLabelsGroup.append("text")
        .attr("x", -height / 2 - margin.left + 35)
        .attr("y", 0)
        .attr("dy", "-3em")
        .attr("value", "smokes") // value to grab for event listener
        .classed("active", false)
        .classed("axis-text", true)
        .text("Smokes (%)");

    var obesityLabel = yLabelsGroup.append("text")
        .attr("x", -height / 2 - margin.left + 38)
        .attr("y", 0)
        .attr("dy", "-4.5em")
        .attr("value", "obesity") // value to grab for event listener
        .classed("active", false)
        .classed("axis-text", true)
        .text("Obese (%)");


    // x axis labels event listener
    xLabelsGroup.selectAll("text")
        .on("click", function () {
            // get value of selection
            var value = d3.select(this).attr("value");
            if (value !== chosenXAxis) {

                // replaces chosenXAxis with value
                chosenXAxis = value;

                // functions here found above csv import
                // updates x scale for new data
                xLinearScale = xScale(censusData, width);

                // updates x axis with transition
                xAxis = renderXAxis(xLinearScale, xAxis);

                // functions here found above csv import
                // updates x scale for new data
                yLinearScale = yScale(censusData, height);

                // updates y axis with transition
                yAxis = renderYAxis(yLinearScale, yAxis);

                // updates circles with new x values
                circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale);

                // updates tooltips with new info
                circlesGroup = updateToolTip(circlesGroup);

                // changes classes to change bold text
                if (chosenXAxis === "poverty") {
                    povertyLabel
                        .classed("active", true)
                        .classed("inactive", false)
                        .transition().attr("x", 0)
                    ageLabel
                        .classed("active", false)
                        .classed("inactive", true)
                        .transition().attr("x", 0)
                    incomeLabel
                        .classed("active", false)
                        .classed("inactive", true)
                        .transition().attr("x", 0)
                }
                else if (chosenXAxis === "age") {
                    povertyLabel
                        .classed("active", false)
                        .classed("inactive", true)
                        .transition().attr("x", 0);
                    ageLabel
                        .classed("active", true)
                        .classed("inactive", false)
                        .transition().attr("x", 0);
                    incomeLabel
                        .classed("active", false)
                        .classed("inactive", true)
                        .transition().attr("x", 0)
                }
                else {
                    povertyLabel
                        .classed("active", false)
                        .classed("inactive", true)
                        .transition().attr("x", 0);
                    ageLabel
                        .classed("active", false)
                        .classed("inactive", true)
                        .transition().attr("x", 0);
                    incomeLabel
                        .classed("active", true)
                        .classed("inactive", false)
                        .transition().attr("x", 0)
                }
            }
        });

    // y axis labels event listener
    yLabelsGroup.selectAll("text")
        .on("click", function () {
            // get value of selection
            var value = d3.select(this).attr("value");
            //console.log(value);
            if (value !== chosenYAxis) {

                // replaces chosenXAxis with value
                chosenYAxis = value;

                xLinearScale = xScale(censusData, width);

                // updates x axis with transition
                xAxis = renderXAxis(xLinearScale, xAxis);

                // functions here found above csv import
                // updates x scale for new data
                yLinearScale = yScale(censusData, height);

                // updates y axis with transition
                yAxis = renderYAxis(yLinearScale, yAxis);

                // updates circles with new x values
                circlesGroup = renderCircles(circlesGroup, xLinearScale, yLinearScale);

                // updates tooltips with new info
                circlesGroup = updateToolTip(circlesGroup);

                // changes classes to change bold text
                if (chosenYAxis === "smokes") {
                    smokesLabel
                        .classed("active", true)
                        .classed("inactive", false)
                        .transition().attr("x", -height / 2);
                    healthcareLabel
                        .classed("active", false)
                        .classed("inactive", true)
                        .transition().attr("x", -height / 2);
                    obesityLabel
                        .classed("active", false)
                        .classed("inactive", true)
                        .transition().attr("x", -height / 2);
                }
                else if (chosenYAxis === "healthcare") {
                    smokesLabel
                        .classed("active", false)
                        .classed("inactive", true)
                        .transition().attr("x", -height / 2);
                    healthcareLabel
                        .classed("active", true)
                        .classed("inactive", false)
                        .transition().attr("x", -height / 2);
                    obesityLabel
                        .classed("active", false)
                        .classed("inactive", true)
                        .transition().attr("x", -height / 2);
                }
                else {
                    smokesLabel
                        .classed("active", false)
                        .classed("inactive", true)
                        .transition().attr("x", -height / 2);
                    healthcareLabel
                        .classed("active", false)
                        .classed("inactive", true)
                        .transition().attr("x", -height / 2);
                    obesityLabel
                        .classed("active", true)
                        .classed("inactive", false)
                        .transition().attr("x", -height / 2);
                }
            }
        });
});