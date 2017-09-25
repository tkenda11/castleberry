require('file?name=[name].[ext]!../node_modules/neo4j-driver/lib/browser/neo4j-web.min.js');
var System = require('./models/System');
var Func = require('./models/Func');
var Project = require('./models/Project');

var _ = require('lodash');

var neo4j = window.neo4j.v1;
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "857841"));

function searchFunctions(queryString) {
  var session = driver.session();
  return session
    .run(queryString)
    .then(result => {
      session.close();
      return result.records.map(record => {
        return new Func(record.get('func'));
      });
    })
    .catch(error => {
      session.close();
      throw error;
    });
}

function searchSystems(queryString) {
  var session = driver.session();
  return session
    .run(queryString)
    .then(result => {
      session.close();
      return result.records.map(record => {
        return new System(record.get('system'));
      });
    })
    .catch(error => {
      session.close();
      throw error;
    });
}

function searchProjects(queryString) {
  var session = driver.session();
  return session
    .run(queryString)
    .then(result => {
      session.close();
      return result.records.map(record => {
        return new Project(record.get('project'));
      });
    })
    .catch(error => {
      session.close();
      throw error;
    });
}

function getGraph(scope) {
  var session = driver.session();
  if(scope) {
     var query=scope;
  }
  else {
     var query='MATCH (project:CVET_project)-[r]-(c) RETURN project.name as project,collect(c.name) AS connected,collect(labels(c)) as types';
  }
  return session.run(query)
    .then(results => {
      session.close();
      var nodes = [], rels = [], i = 0;
      results.records.forEach(res => {
        nodes.push({title: res.get('project'), label: 'project'});
        var target = i;
        i++;
        res.get('connected').forEach(name => {
          var cNode = {title: name, label: 'cNode'};
          var source = _.findIndex(nodes, cNode);
          if (source == -1) {
            nodes.push(cNode);
            source = i;
            i++;
          }
        
          rels.push({source, target})
        })
      });
      return {nodes, links: rels};
    });
}

exports.getGraph = getGraph;
exports.searchSystems = searchSystems;
exports.searchFunctions = searchFunctions;
exports.searchProjects = searchProjects;

