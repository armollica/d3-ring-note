d3.ringNote = function() {
  var draggable = false,
      controlRadius = 15;
  
  var dragCenter = d3.behavior.drag()
    .origin(function(d) { return { x: 0, y: 0}; })
    .on("drag", dragmoveCenter);
  
  var dragRadius = d3.behavior.drag()
    .origin(function(d) { return { x: 0, y: 0 }; })
    .on("drag", dragmoveRadius);
  
  var dragText = d3.behavior.drag()
    .origin(function(d) { return { x: 0, y: 0 }; })
    .on("drag", dragmoveText);
  
  var path = d3.svg.line();
  
  function draw(selection, annotation) {
    
    var gAnnotation = selection.selectAll(".annotation")
        .data(annotation)
      .enter().append("g")
        .attr("class", "annotation")
        .attr("transform", function(d) {
          return "translate(" + d.cx + "," + d.cy + ")";
        });
    
    var gContent = gAnnotation.append("g")
      .attr("class", "content");
    
    var circle = gContent.append("circle")
      .attr("r", function(d) { return d.r; });
    
    var line = gContent.append("path")
      .attr("d", function(d) {
        var x = d.textOffset[0],
            y = d.textOffset[1],
            lineData = getLineData(x, y, d.r);
        return path(lineData);
      });
      
    var text = gContent.append("text")
      .each(function(d) {
        var x = d.textOffset[0],
            y = d.textOffset[1],
            region = getRegion(x, y, d.r),
            textCoords = getTextCoords(x, y, region);
        
        d3.select(this)
          .attr("x", textCoords.x)
          .attr("y", textCoords.y)
          .text(d.text)
          .call(styleText, region);
      })
      .style("cursor", draggable ? "move" : null)
      .call(draggable ? dragText : function() {});
    
    if (draggable) {
      var gControls = gAnnotation.append("g")
        .attr("class", "controls");
      
      var center = gControls.append("circle")
        .attr("class", "center")
        .call(styleControl)
        .call(dragCenter);
      
      var radius = gControls.append("circle")
        .attr("class", "radius")
        .attr("cx", function(d) { return d.r; })
        .call(styleControl)
        .call(dragRadius); 
    }
    
    return selection;
  }
  
  draw.draggable = function(_) {
    if (!arguments.length) return draggable;
    draggable = _;
    return draw;
  };
  
  function styleControl(selection) {
    selection
      .attr("r", controlRadius)
      .style("fill-opacity", "0")
      .style("stroke", "black")
      .style("stroke-dasharray", "3, 3")
      .style("cursor", "move");
  }
  
  function styleText(selection, region) {
    selection
      .each(function(d) {
        var x = d.textOffset[0],
            y = d.textOffset[1],
            textAnchor = getTextAnchor(x, y, region);
        
        var dx = textAnchor == "start" ? "0.33em" :
                 textAnchor == "end" ? "-0.33em" : "0";
        
        var dy = textAnchor !== "middle" ? ".33em" :
          ["NW", "N", "NE"].indexOf(region) !== -1 ? "-.33em" : "1em";
        
        d3.select(this)
          .style("text-anchor", textAnchor)
          .attr("dx", dx)
          .attr("dy", dy);
      });
  }
  
  function dragmoveCenter(d) {
    var gAnnotation = d3.select(this.parentNode.parentNode);
        
    d.cx += d3.event.x;
    d.cy += d3.event.y;
    
    gAnnotation
      .attr("transform", function(d) {
        return "translate(" + d.cx + "," + d.cy + ")";
      });
  }
  
  function dragmoveRadius(d) {
    var gAnnotation = d3.select(this.parentNode.parentNode),
        gContent = gAnnotation.select(".content"),
        circle = gContent.select("circle"),
        line = gContent.select("path"),
        text = gContent.select("text"),
        radius = d3.select(this);
    
    d.r += d3.event.dx;
    
    circle.attr("r", function(d) { return d.r; });
    radius.attr("cx", function(d) { return d.r; });
    line
      .attr("d", function(d) {
        var x = d.textOffset[0],
            y = d.textOffset[1],
            lineData = getLineData(x, y, d.r);
        return path(lineData);
      });
    text
      .each(function(d) {
        var x = d.textOffset[0],
            y = d.textOffset[1],
            region = getRegion(x, y, d.r),
            textCoords = getTextCoords(x, y, region);
        
        d3.select(this)
          .attr("x", textCoords.x)
          .attr("y", textCoords.y)
          .text(d.text)
          .call(styleText, region);
      });
  }
  
  function dragmoveText(d) {
    var gContent = d3.select(this.parentNode),
        line = gContent.select("path"),
        text = d3.select(this);
    
    d.textOffset[0] += d3.event.dx;
    d.textOffset[1] += d3.event.dy;
    
    text
      .each(function(d) {
        var x = d.textOffset[0],
            y = d.textOffset[1],
            region = getRegion(x, y, d.r),
            textCoords = getTextCoords(x, y, region);
        
        d3.select(this)
          .attr("x", textCoords.x)
          .attr("y", textCoords.y)
          .text(d.text)
          .call(styleText, region);
      });
      
    line
      .attr("d", function(d) {
        var x = d.textOffset[0],
            y = d.textOffset[1],
            lineData = getLineData(x, y, d.r);
        return path(lineData);
      });
  }
  
  function getLineData(x, y, r) {
    var region = getRegion(x, y, r);
    
    if (region == null) {
      // No line if text is inside the circle
      return [];
    }
    else {
      // Cardinal directions
      if (region == "N") return [[0, -r], [0, y]];
      if (region == "E") return [[r, 0], [x, 0]];
      if (region == "S") return [[0, r], [0, y]];
      if (region == "W") return [[-r, 0],[x, 0]];
      
      var d0 = r * Math.cos(Math.PI/4),
          d1 = Math.min(Math.abs(x), Math.abs(y)) - d0;
          
      // Intermediate directions
      if (region == "NE") return [[ d0, -d0], [ d0 + d1, -d0 - d1], [x, y]];
      if (region == "SE") return [[ d0,  d0], [ d0 + d1,  d0 + d1], [x, y]];
      if (region == "SW") return [[-d0,  d0], [-d0 - d1,  d0 + d1], [x, y]];
      if (region == "NW") return [[-d0, -d0], [-d0 - d1, -d0 - d1], [x, y]];
    }
  }
  
  function getTextCoords(x, y, region) {
    if (region == "N") return { x: 0, y: y };
    if (region == "E") return { x: x, y: 0 };
    if (region == "S") return { x: 0, y: y };
    if (region == "W") return { x: x, y: 0 };
    return { x: x, y: y };
  }
  
  function getTextAnchor(x, y, region) {
    if (region == null) {
      return "middle";
    }
    else {
      // Cardinal directions
      if (region == "N") return "middle";
      if (region == "E") return "start";
      if (region == "S") return "middle";
      if (region == "W") return "end";
      
      var xLonger = Math.abs(x) > Math.abs(y);
      
      // Intermediate directions`
      if (region == "NE") return xLonger ? "start" : "middle";
      if (region == "SE") return xLonger ? "start" : "middle";
      if (region == "SW") return xLonger ? "end" : "middle";
      if (region == "NW") return xLonger ? "end" : "middle"; 
    }
  }

  function getRegion(x, y, r) {
    var px = r * Math.cos(Math.PI/4),
        py = r * Math.sin(Math.PI/4);
    
    var distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    
    if (distance < r) {
      return null;
    }
    else {
      if (x > px) {
        // East
        if (y > py) return "SE"; 
        if (y < -py) return "NE";
        if (x > r) return "E";
        return null;
      }
      else if (x < -px) {
        // West
        if (y > py) return "SW";
        if (y < -py) return "NW";
        if (x < -r) return "W";
        return null;
      }
      else {
        // Center
        if (y > r) return "S";
        if (y < -r) return "N";
      }
    }
  }
  
  return draw;
};