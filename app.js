var api = require('./neo4jApi');

$(function () {
  renderGraph();
  $("#search").submit(e => {
    e.preventDefault();
    search();
  });
$("#psearch").submit(e => {
    e.preventDefault();
    psearch();
  });
$("#fsearch").submit(e => {
    e.preventDefault();
    fsearch();
  });
$("#tags").submit(e => {
    e.preventDefault();
    tags();
  });
});

function psearch(scope) {
if(scope) {
    switch(scope.split(":")[0]){
       case "#system":
          var query = 'MATCH (system:system {VASID:"' + scope.split(":")[1] + '"})-[r]-(project:CVET_project) RETURN project ORDER BY project.name';
          break;
       case "#function":
var query = 'MATCH (project:CVET_project)-[r]-(func:BRM {number: "' + scope.split(":")[1] + '"}) RETURN project ORDER BY project.name';  
          break;
case "#project":
var query = 'MATCH (project:CVET_project)-[r]-(middle)-[x]-(first:CVET_project {number:"' + scope.split(":")[1] +'"}) RETURN project ORDER BY project.name';  
          break;
     }           
  } 
  else {
     var pattern = $("#psearch").find("input[name=psearch]").val();
     var query='MATCH (project:CVET_project) WHERE project.name =~ ("(?i).*" + "' + pattern + '" + ".*") RETURN project ORDER BY project.name';
  }
//document.getElementById("debug").innerHTML = "query: "+query;
api
    .searchProjects(query)
    .then(projects => {
       var t = $("table#presults tbody").empty();
       if (projects) {
          projects.forEach(project => {
            $('<tr><td class="link"><a href="'+project.url+'"style="color:darkblue">' + project.number +     '</a></td><td>' + project.name + '</td></tr>').appendTo(t)
              .click(function() {
                    search("#project:"+project.number);
                    fsearch("#project:"+project.number);
                    psearch("#project:"+project.number);
              })
        });
      }
    });
}   

function search(scope) {
  if(scope) {
    switch(scope.split(":")[0]){
       case "#project":
          query = 'MATCH (system:system)-[r]-(project:CVET_project {number: "' + scope.split(":")[1] + '"}) RETURN system ORDER BY system.name';
          break;
       case "#function":
var query = 'MATCH (system:system)-[r]-(func:BRM {number: "' + scope.split(":")[1] + '"}) RETURN system ORDER BY system.name';  
          break;
     }           
  } 
  else {
    var pattern = $("#search").find("input[name=search]").val();
    var query='MATCH (system:system) WHERE system.systemname =~ ("(?i).*" + "' + 
  pattern + '" + ".*") RETURN system ORDER BY system.name';

  }
  api
    .searchSystems(query)
    .then(systems => {
       var t = $("table#results tbody").empty();
       if (systems) {
          systems.forEach(system => {
            $("<tr><td class='system'>" + system.name + "</td>      <td>" + system.systemname + "</td><td>" + system.org + "</td></tr>").appendTo(t)
              .click(function() {
                    fsearch("#system:"+system.VASID);
                    psearch("#system:"+system.VASID);
              })
        });
      }
    });
}   

function fsearch(scope) {
  if(scope) {
   switch(scope.split(":")[0]){
       case "#project":
          var query = 'MATCH (project:CVET_project {number:"' + scope.split(":")[1] + '"})-[r]-(func:BRM) RETURN func ORDER BY func.number';
       break;
       case "#system":
          var query = 'MATCH (system:system {VASID:"' + scope.split(":")[1] + '"})-[r]-(func:BRM) RETURN func ORDER BY func.number';
       break;
    }
} 
else {
        var pattern = $("#fsearch").find("input[name=fsearch]").val();
        var query='MATCH (func:BRM) WHERE func.name =~ ("(?i).*" + "' + pattern + '" + ".*") RETURN func ORDER BY func.number';
}
api
    .searchFunctions(query)
    .then(functions => {
      var t = $("table#brm tbody").empty();
      if (functions) {     
functions.forEach(func => {
            $("<tr><td class='func'>" + func.number + "</td>      <td>" + func.name + "</td><td>" + func.level + "</td></tr>").appendTo(t).click(function() {
                 search("#function:"+func.number);
                 psearch("#function:"+func.number);
              })
        });
      }
    });
}

function renderGraph(query) {
  var width = 800, height = 800;
  var force = d3.layout.force()
    .charge(-200).linkDistance(30).size([width, height]);
  var svg = d3.select("#graph").append("svg")
    .attr("width", "100%").attr("height", "100%")
    .attr("pointer-events", "all");
  api
    .getGraph(query)
    .then(graph => {
      force.nodes(graph.nodes).links(graph.links).start();

      var link = svg.selectAll(".link")
        .data(graph.links).enter()
        .append("line").attr("class", "link");

      var node = svg.selectAll(".node")
        .data(graph.nodes).enter()
        .append("circle")
        .attr("class", d => {
          return "node " + d.label
        })
        .attr("r",10)

        .style("fill", function(d) {
                if ("system" in d) {
                    return "palegreen";
                } else {
                    return "lightsteelblue";
                }
        })
        .call(force.drag);

      // html title attribute
      node.append("title")
        .text(d => {
          return d.title;
        });

      // force feed algo ticks
      force.on("tick", () => {
        link.attr("x1", d => {
          return d.source.x;
        }).attr("y1", d => {
          return d.source.y;
        }).attr("x2", d => {
          return d.target.x;
        }).attr("y2", d => {
          return d.target.y;
        });

        node.attr("cx", d => {
          return d.x;
        }).attr("cy", d => {
          return d.y;
        });
      });
    });
}
