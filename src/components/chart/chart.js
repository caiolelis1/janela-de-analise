import * as d3 from "d3";

const MARGIN = { top: 10, left: 40, right: 80, bottom: 1 };

var windowWidth = window.innerWidth - 170;
var vw = windowWidth / 100;

var graphWidth = windowWidth - 8 * vw;

const width = { Graph: graphWidth };

export default class D3Chart {
  constructor(element, size) {
    const vis = this;
    vis.size = size;
    //Criando o svg
    vis.svg = d3
      .select(element)
      .append("svg")
      .attr("width", width.Graph + MARGIN.left + MARGIN.right)
      .attr("height", vis.size + MARGIN.top + MARGIN.bottom)
      .attr("class", "graph-svg")
      .append("g")
      .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

    //Estabelecendo o RANGE
    vis.X = d3.scaleLinear().range([0, width.Graph]);
    vis.Y = d3.scaleLinear().range([0, vis.size]);

    //Separando as LABELS
    vis.yLabelGroup = vis.svg
      .append("g")
      .attr("tranform", `translate(0,0)`)
      .attr("color", "black");

    vis.yTextLabel = vis.svg
      .append("text")
      .attr("x", 0)
      .attr("y", 10)
      .attr("text-achor", "middle")
      .attr("fill", "black");

    vis.clip = vis.svg
      .append("defs")
      .append("SVG:clipPath")
      .attr("id", "clip")
      .append("SVG:rect")
      .attr("width", width.Graph)
      .attr("height", vis.size)
      .attr("x", 0)
      .attr("y", 0);

    //TOOLTIP
    vis.focus = vis.svg.append("g");
    vis.focus
      .append("circle")
      .attr("class", "y")
      .attr("r", 2)
      .attr("stroke", "black");
    vis.focus.append("text").attr("fill", "black").style("font-size", "10px");
    vis.focus
      .append("path")
      .attr("class", "y")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", "1px")
      .attr(
        "d",
        d3.line()([
          [0, vis.size],
          [0, 0],
        ])
      );
    vis.bigRect = vis.svg
      .append("rect")
      .attr("width", width.Graph)
      .attr("height", vis.size)
      .style("fill", "none")
      .style("pointer-events", "all");

    vis.lineClip = vis.svg.append("g").attr("clip-path", "url(#clip)");
    vis.horizontalLines = vis.svg.append("g").attr("id", "horizontalLines");
    vis.horizontalLineCounter = 0;

    vis.linearText = vis.svg
      .append("g")

      .append("text")
      .attr("fill", "black")
      .attr("class", "linearText");
  }

  update(
    data,
    yAxis,
    s,
    newXdomain,
    handleVericalLine,
    regression,
    colors,
    handleLinearText
  ) {
    const vis = this;
    if (data) {
      vis.data = data;
      vis.xData = [];
      vis.yData = [];
      vis.data.map((lap, i) => {
        vis.xData.push([]);
        vis.yData.push([]);
        lap.map((d) => {
          vis.xData[i].push(d[0]);
          vis.yData[i].push(d[1]);
        });
        return 0;
      });

      const xDomain = d3.extent(vis.data.map((d) => d[0]));
      const yDomain = d3.extent(vis.data.map((d) => d[1]));
      vis.X.domain([0, 49]);
      vis.Y.domain([0, 49]);

      vis.xLabel = d3.axisBottom(vis.X);
      vis.yLabel = d3.axisLeft(vis.Y);
      vis.yLabelGroup.transition().duration(1000).call(vis.yLabel.ticks(6));
      vis.yTextLabel.text(yAxis);

      //ZOOM()
      const zoom = d3
        .zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([
          [0, 0],
          [width.Graph, vis.size],
        ])
        .extent([
          [0, 0],
          [width.Graph, vis.size],
        ]);
      if (newXdomain && s) {
        vis.X.domain(newXdomain);
        vis.bigRect.call(
          zoom.transform,
          d3.zoomIdentity.scale(width.Graph / (s[1] - s[0])).translate(-s[0], 0)
        );
      }

      //LINEGENERATOR

      //JOIN()
      vis.lines = vis.lineClip.selectAll(`.line`).data([vis.data]);

      //ENTER()

      let colors = ["#003cff", "ff0000"];

      for (let i = 0; i < vis.data.length; i++) {
        vis.lines
          .enter()
          .append("path")
          .attr("class", `line`)
          .attr("d", d3.line()(vis.data[i]))
          .attr("fill", "none")
          .attr("stroke", colors[i])
          .attr("stroke-width", "2px");
      }

      //EXIT()
      vis.lines.exit().remove();

      //UPDATE()
      //  vis.lines.transition().duration(1500).attr("d", lineGenerator);

      if (regression) {
        let xAvarage = 0,
          yAvarage = 0,
          x2 = 0,
          y2 = 0,
          xy = 0;
        for (let i = 0; i < vis.xData.length; i++) {
          xAvarage = xAvarage + vis.xData[i];
          yAvarage = yAvarage + vis.yData[i];
          xy = xy + vis.xData[i] * vis.yData[i];
          y2 = y2 + vis.yData[i] * vis.yData[i];
          x2 = x2 + vis.xData[i] * vis.xData[i];
        }
        let b =
          (vis.xData.length * xy - xAvarage * yAvarage) /
          (vis.xData.length * x2 - xAvarage * xAvarage);

        yAvarage = yAvarage / vis.xData.length;
        xAvarage = xAvarage / vis.xData.length;
        let a = yAvarage - b * xAvarage;
        let linearRegression = [];
        linearRegression = vis.xData.map((d) => [d, a + b * d]);
        const linearText = `y = ${b.toFixed(3)}x + ${a.toFixed(2)}`;
        const linearPlot = d3
          .line()
          .x((d) => vis.X(d[0]).toFixed(2))
          .y((d) => vis.Y(d[1]).toFixed(2));

        vis.linearLine = vis.lineClip
          .selectAll(".linearLine")
          .data([linearRegression]);

        vis.linearLine
          .enter()
          .append("path")
          .attr("class", "linearLine")
          .attr("d", linearPlot(linearRegression))
          .attr("fill", "none")
          .attr("stroke", "red")
          .attr("stroke-width", "2px");
        vis.linearLine
          .transition()
          .duration(1000)
          .attr("d", linearPlot(linearRegression))
          .attr("fill", "none")
          .attr("stroke", "red")
          .attr("stroke-width", "2px");
        vis.linearText
          .style("display", "block")
          .style("font-size", "1vh")
          .attr("x", width.Graph)
          .attr("y", 20)
          .text(linearText);
        handleLinearText(linearText);
      } else if (vis.linearLine) {
        vis.lineClip.selectAll(".linearLine").remove();
        vis.linearText.style("display", "none");
      }

      //TOOLTIP
      vis.bigRect
        .on("mouseover", function () {
          vis.focus.style("opacity", "1");
        })
        .on("mouseout", function () {
          vis.focus.style("opacity", "0.6");
        })
        .on("mousemove", mousemove)
        .on("click", mouseclick);
      function mousemove() {
        const x0 = vis.X.invert(d3.mouse(this)[0]);

        const Index = d3.bisect(vis.xData, x0);
        handleVericalLine(Index);
      }
      function mouseclick() {
        const x0 = vis.X.invert(d3.mouse(this)[0]);
        const Index = d3.bisect(vis.xData, x0);
        const coordenadaY = vis.yData[Index];
        const toolTipY = vis.Y(coordenadaY);
        vis.horizontalLines
          .append("line")
          .attr("x1", 0)
          .attr("y1", toolTipY)
          .attr("x2", width.Graph)
          .attr("y2", toolTipY)
          .attr("stroke", "black")
          .attr("stroke-width", 2)
          .attr("opacity", 0.6)
          .attr("id", `line${vis.horizontalLineCounter}`);

        if (toolTipY >= 190) {
          vis.horizontalLines
            .append("text")
            .attr("id", `text${vis.horizontalLineCounter}`)
            .style("font-size", "10px")
            .attr("class", "text")
            .attr("y", toolTipY)
            .text(`${coordenadaY.toFixed(3)}`)
            .attr("x", width.Graph)
            .on("mousedown", function () {
              vis.horizontalLines.select(`#${this.id}`).remove();
              const auxLine = this.id.replace("text", "line");
              vis.horizontalLines.select(`#${auxLine}`).remove();
            });
        } else
          vis.horizontalLines
            .append("text")
            .attr("id", `text${vis.horizontalLineCounter}`)
            .style("font-size", "10px")
            .attr("class", "text")
            .attr("y", toolTipY + 10)
            .text(`${coordenadaY.toFixed(3)}`)
            .attr("x", width.Graph)
            .on("mousedown", function () {
              vis.horizontalLines.select(`#${this.id}`).remove();
              const auxLine = this.id.replace("text", "line");
              vis.horizontalLines.select(`#${auxLine}`).remove();
            });
        vis.horizontalLineCounter++;
      }
    }
  }
  verticalLine(vertical) {
    const vis = this;
    const coordenadaX = vis.xData[vertical];
    const coordenadaY = vis.yData[vertical];
    if (
      (coordenadaY && coordenadaX) ||
      coordenadaX === 0 ||
      coordenadaY === 0
    ) {
      const toolTipX = vis.X(coordenadaX);
      const toolTipY = vis.Y(coordenadaY);
      vis.focus
        .select("circle.y")
        .attr("transform", `translate(${toolTipX}, ${toolTipY})`);
      vis.focus.select("path.y").attr("transform", `translate(${toolTipX},0)`);
      if (toolTipY >= 190) {
        vis.focus
          .select("text")
          .attr("x", toolTipX)
          .attr("y", toolTipY - 10)
          .text(`(${coordenadaX.toFixed(3)}, ${coordenadaY.toFixed(3)})`);
      } else
        vis.focus
          .select("text")
          .attr("x", toolTipX)
          .attr("y", toolTipY + 10)
          .text(`(${coordenadaX.toFixed(3)}, ${coordenadaY.toFixed(3)})`);
    }
  }
}
