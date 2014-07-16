"use strict";

var departments = {'04':'UWaterloo', '05':'UWaterloo', '20':'UWaterloo',
                   '27':'UWaterloo', '36':'UWaterloo', 'AB':'Languages',
                   'AF':'Arts (Interdisciplinary)', 'AN':'Anthropology',
                   'AP':'UWaterloo', 'AR':'Archaeology',
                   'AS':'Astronomy', 'BF':'Brantford Foundations',
                   'BI':'Biology', 'BU':'Business', 'CA':'Other', 'CC':'Kriminology',
                   'CH':'Chemistry', 'CL':'Classical Studies',
                   'CO':'Education', 'CP':'Computer Science',
                   'CQ':'Cultural Analysis', 'CS':'Communication Studies',
                   'CT':'Sociology', 'CX':'UWaterloo',
                   'DH':'History', 'EC':'Economics', 'ED':'Education',
                   'EM':'Education', 'EN':'English', 'ES':'Environment',
                   'EU':'Education', 'FR':'Languages', 'FS':'English',
                   'GC':'Theology', 'GG':'Geography', 'GL':'Geography',
                   'GM':'Languages', 'GR':'Classical Studies',
                   'GS':'Global Studies', 'GV':'Not Applicable', 'HE':'Health',
                   'HI':'History', 'HN':'Health', 'HR':'Human Rights',
                   'HS':'Health', 'ID':'Contemporary', 'IP':'Not Applicable',
                   'IT':'Languages', 'JN':'Journalism', 'KP':'Kinesiology',
                   'KS':'Cultural Studies', 'LA':'Archaeology',
                   'LL':'Languages', 'LY':'Law', 'MA':'Math', 'MB':'Business',
                   'MF':'Business', 'MI':'Languages', 'ML':'Cultural Studies',
                   'MS':'Business', 'MU':'Music', 'MX':'Contemporary',
                   'NE':'Archaeology', 'NO':'Cultural Studies', 'OL':'Business',
                   'PC':'Physics', 'PM':'UWaterloo', 'PO':'Political Science',
                   'PP':'Philosophy', 'PS':'Psychology', 'RE':'Theology',
                   'SC':'Science', 'SE':'Arts', 'SJ':'Contemporary',
                   'SK':'Social Work', 'SL':'Social Work', 'SP':'Languages',
                   'SY':'Sociology', 'TH':'Theology', 'TM':'Business',
                   'WS':'Cultural Studies', 'YC':'Cultural Studies'};
var faculties = {'Anthropology':'Arts',
                 'Archaeology':'Arts',
                 'Arts':'Arts',
                 'Arts (Interdisciplinary)':'Arts',
                 'Classical Studies':'Arts',
                 'Communication Studies':'Arts',
                 'Kriminology':'Arts',
                 'Cultural Analysis':'Arts',
                 'Cultural Studies':'Arts',
                 'English':'Arts',
                 'Environment':'Arts',
                 'Geography':'Arts',
                 'Global Studies':'Arts',
                 'History':'Arts',
                 'Languages':'Arts',
                 'Law':'Arts',
                 'Philosophy':'Arts',
                 'Political Science':'Arts',
                 'Social Work':'Arts',
                 'Sociology':'Arts',
                 'Contemporary':'Arts',
                 'Business':'Business',
                 'Economics':'Business',
                 'Education':'Education',
                 'Health':'Human & Social Sciences',
                 'Human Rights':'Human & Social Sciences',
                 'Brantford Foundations':'Liberal Arts',
                 'Journalism':'Liberal Arts',
                 'Music':'Music',
                 'Astronomy':'Science',
                 'Biology':'Science',
                 'Chemistry':'Science',
                 'Kinesiology':'Science',
                 'Computer Science':'Science',
                 'Math':'Science',
                 'Physics':'Science',
                 'Psychology':'Science',
                 'Science':'Science',
                 'Theology':'Seminary',
                 'Not Applicable':'Other',
                 'Other':'Other',
                 'UWaterloo':'Other'};



var courses = {}; // filled with courses when user clicks tags
var refresh = true; // refresh is set to true whenever courses is modified
var nodes = [];




window.addEventListener('polymer-ready', function(e) {
  function sketchProc(p) {
    var orphanNodes = []; // nodes with no parents or children
    var nodeDict = {}; // dictionary that store nodes for quick lookup
    var shift = [0, 0]; // translation vector for panning
    var lastMouse = [p.mouseX, p.mouseY]; // the previous mouse position
    var mousePressed = false;
    var maxDepth = 0;
    var resetTime = p.millis();

    p.setup = function() {
      // size is set in the draw method so that scaling
      // the window will update the canvas size
      p.frameRate(30);
    };

    function millis() {
      return p.millis() - resetTime;
    }

    function reset() {
      if (!courses ||  !refresh) {
        return;
      }
      refresh = false;

      resetTime = p.millis();
      maxDepth = 0;
      shift = [0, 0];
      lastMouse = [p.mouseX, p.mouseY];
      nodes = [];
      nodeDict = {};

      for (var courseName in courses) {
        var course = courses[courseName];
        for (var child in course.children) {
          if (courses[child] !== undefined) {
            var childNode = courses[child];
            var childParents = childNode.parents;
            if (childParents.indexOf(courseName) === -1) {
              childParents.push(courseName);
            }
          }
        }
      }
      
      for (var courseName in courses) {
        createNode(courseName);
      }
    }

    function createNode(id) {
      if (nodeDict[id] !== undefined) {
        return nodeDict[id];
      }
      if (courses[id] === undefined) {
        var depCode = id.substring(0,2);
        var department = departments[depCode];
        var faculty = faculties[department];
        var externalDep = dep[faculty][department][id];
        courses[id] = {'name':externalDep.name, 'children':[], 'parents':[]}
        for (course in courses) {
          if (courses[course].children.indexOf(id) != -1) {
            courses[id].parents.push(course);
          }
          if (courses[course].parents.indexOf(id) != -1) {
            courses[id].children.push(course);
          }
        }
      }
      var course = courses[id];
      var children = course.children;
      var parents = course.parents;
      var name = course.name;

      var node = new Node(id, name, p.random(p.width), p.random(p.height));
      nodeDict[id] = node;
      //if (children.length === 0 && parents.length === 0) {
        //orphanNodes.push(node);
      //} else {
        nodes.push(node);
        children.forEach(function(child) {
          node.addChild(createNode(child));
        });
        parents.forEach(function(parent) {
          node.addParent(createNode(parent));
        });
      //}
      maxDepth = p.max(maxDepth, node.depth());
      return node;
    }

    p.mousePressed = function() {
      mousePressed = true;
    };

    p.mouseReleased = function() {
      mousePressed = false;
    };

    p.mouseClicked = function() {
      var actualMouseX = p.mouseX - p.width/2 - shift[0];
      var actualMouseY = p.mouseY - p.height/2 - shift[1];
      var closestNode = null;
      var closestDist = 1e1000;
      nodes.forEach(function(node) {
        var mouseNodeDist = p.dist(node.x, node.y, actualMouseX, actualMouseY);
        if (mouseNodeDist < 30 && mouseNodeDist < closestDist) {
          closestNode = node;
          closestDist = mouseNodeDist;
        }
      });
      if (closestNode) {
        closestNode.select();
      }
    };

    function updateMouse() {
      if (mousePressed) {
        shift[0] += p.mouseX - lastMouse[0];
        shift[1] += p.mouseY - lastMouse[1];
      }
      lastMouse[0] = p.mouseX;
      lastMouse[1] = p.mouseY;
    }

    function springDynamics() {
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        var childrenA = a.children;
        for (var j=i+1; j < nodes.length; j++) {
          var b = nodes[j];
          var childrenB = b.children;
          var aRelatives = a.children.length + Object.keys(a.parents).length;
          var bRelatives = b.children.length + Object.keys(b.parents).length;
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var dist = p.max(1, p.sqrt(dx * dx + dy * dy));

          var restingLength = p.min(aRelatives,bRelatives) * 20 + 100;
          var k = 0.05;
          var hierarchyPush = 0;
          
          var fx = 0;
          var fy = 0;
          if (aRelatives === 0 && bRelatives === 0){
            restingLength = 50;
            k = 0.0001;
          } else if (childrenA.indexOf(b) === -1 &&
              childrenB.indexOf(a) === -1) {
            if (aRelatives === 0 || bRelatives === 0){
              restingLength = 7 * nodes.length;
            } else {
              restingLength = 7 * nodes.length;
            }
            k = 1/restingLength * 1/dist * 20;
            var push = (bRelatives - aRelatives) * 1/dist;//p.min(0.1, 1 / p.abs(dy * dy)) * dy / p.abs(dy);
            //push = p.min(1, 1/p.abs(dx)) * 0.2;
            a.vy -= push;
            b.vy += push;
          } else {
              // nodes are related
            var child;
            var parent;
            hierarchyPush = 1;
            if (childrenA.indexOf(b) === -1) {
              hierarchyPush *= -2;
              child = a;
              parent = b;
            } else {
              child = b;
              parent = a;
            }
            restingLength = 250;//p.min(500, child.parents.length * 50 + 50);
          }
          

          var padding = 150;//p.min(3000, 5 * millis());
          if (dist < padding) {
            var nudge = p.min(2, 1/(dist*dist) * 200);
            a.vx += nudge * dx / dist;
            a.vy += nudge * dy / dist * 1.5;
            b.vx -= nudge * dx / dist;
            b.vy -= nudge * dy / dist * 1.5;
            
          }
          var d = restingLength - dist;
          fx = k * d * dx / dist + hierarchyPush;
          fy = k * d * dy / dist;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
          
          var alignForce = p.min(p.abs(dx * 0.1), 1/p.max(1, p.abs(dx)) * 1/(dist*dist) * millis() / 50.0) * dx / p.abs(dx);
          a.vx -= alignForce;
          b.vx += alignForce;
        }
      }
    }

    function update() {
      reset();
      updateMouse();
      springDynamics();
      nodes.forEach(function(node) {node.update();});
    }

    p.draw = function() {
      p.size(w, h);
      update();
      recenterNodes();
      p.fill(0);
      p.background(255);
      nodes.forEach(function(node) {node.drawArrows();});
      nodes.forEach(function(node) {node.drawSelectedArrows();});
      nodes.forEach(function(node) {node.drawNode();});
      nodes.forEach(function(node) {node.drawLabel();});
    };

    function recenterNodes() {
      var sumX = 0;
      var sumY = 0;
      
      nodes.forEach(function(node) {
        sumX += node.x;
        sumY += node.y;
      });

      var centerX = sumX / nodes.length;
      var centerY = sumY / nodes.length;

      nodes.forEach(function(node) {
        node.x -= centerX;
        node.y -= centerY;
      });

      var translateX = p.width/2 + shift[0];
      var translateY = p.height/2 + shift[1];
      p.translate(translateX, translateY);
    }

    function arrow(x1, y1, x2, y2) {
      //p.line(x1, y1, x2, y2);

      var dx = x2-x1;
      var dy = y2-y1;
      var controlDist = p.max(10, p.abs(dx) * 0.5);
      var width = 6;
      var r = 2;
      p.triangle(x2, y2, x2 - width, y2 - r, x2 - width, y2 + r);
      p.noFill();
      p.bezier(x1, y1, x1 + controlDist, y1, x2-controlDist, y2, x2,y2);
      //var dist = p.sqrt(dx * dx + dy * dy);
      //var arrows = 10;
      //var distBetween = 1/arrows;
      //var thick = 2;
      //for (var i = 0; i < arrows; i++) {
      //  p.pushMatrix();
      //  var param = (i + 1) * distBetween;
      //  p.translate(x1 + dx * param, y1 + dy * param);
      //  var a = p.atan2(-dx, dy);
      //  p.rotate(a);
      //  var r = distBetween * dist;
      //  p.triangle(0, 0, -thick, -r, thick, -r);
      //  p.popMatrix();
      //}
    }
   
    function Node(id, name, x, y) {
      this.id = id;
      this.name = name;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.children = [];
      this.parents = {};
      this.rate = p.random(20, 1000);
      this.selected = false;

      this.addChild = function(node) {
        this.children.push(node);
      };

      this.addParent = function(node) {
        this.parents[node.id] = [node, false];
      };

      this.numSelectedParents = function(node) {
        var numSelectedParents = 0;
        for (parent in this.parents) {
          if (this.parents[parent][1]) {
            numSelectedParents += 1;
          }
        }
        return numSelectedParents;
      }

      this.select = function() {
        var all = true;
        for (parent in this.parents) {
          var parentState = this.parents[parent][1];
          all = all && parentState;
        }
        // all sel state
        //  1 | 1 | 0
        //  1 | 0 | 1
        //  0 | 1 | 0
        //  0 | 0 | 1
        this.selected = !this.selected;//!(all && this.selected)
        var id = this.id;
        var state = this.selected;
        this.children.forEach(function(child) {
          child.selectRecursiveChildren(id, state);
        });
        var numSelectedParents = this.numSelectedParents();
        if (numSelectedParents > 0 || this.selected) {
          this.selectRecursiveParents(this.selected);
        }
      };
      
      this.selectRecursiveChildren = function(parent, state) {
        this.parents[parent][1] = state;
        this.selected = state || this.numSelectedParents() > 0;
        if (!state) {
          var toDeselect = true;
          for (var par in this.parents) {
            toDeselect = toDeselect && !this.parents[par][1];
          }
          if (toDeselect) {
            var id = this.id;
            this.children.forEach(function(child) {
              if (child.parents[id][1]) {
                child.selectRecursiveChildren(id, state);
              }
            });
          }
        } else {
          var id = this.id;
          this.children.forEach(function(child) {
            child.selectRecursiveChildren(id, state);
          });
        }
      };

      this.selectRecursiveParents = function(state) {
        var selfState = state;
        for (var i = 0; i < this.children.length; i++) {
          var child = this.children[i];
          if (child.parents[this.id][1]) {
            selfState = true;
            break;
          }
        }
        this.selected = selfState;
        
        for (var parent in this.parents) {
          this.parents[parent][1] = selfState;
        }
        for (var parent in this.parents) {
          this.parents[parent][0].selectRecursiveParents(selfState);
        };
      };

      this.update = function() {
        this.x += this.vx;
        this.y += this.vy;

        var air = 0.9;
        this.vx *= air;
        this.vy *= air;
      };

      this.depth = function() {
        var maxDepth = 0;
        this.children.forEach(function(child) {
          maxDepth = p.max(maxDepth, child.depth());
        });
        return maxDepth + 1;
      };

      this.drawArrows = function() {
        var labelWidth = p.textWidth(this.id);
        var front = this.x + labelWidth * 0.5;
        for (parent in this.parents) {
          if (!this.parents[parent][1]) {
            p.stroke(175, 175, 175);
            p.fill(175, 175, 175);
            var par = this.parents[parent][0];
            arrow(front, this.y, par.x - labelWidth * 0.5, par.y);
          }
        }
      };

      this.drawSelectedArrows = function() {
        var labelWidth = p.textWidth(this.id);
        var front = this.x + labelWidth * 0.5;
        for (parent in this.parents) {
          if (this.parents[parent][1]) {
            p.stroke(255, 0, 0);
            p.fill(255, 0, 0);
            var par = this.parents[parent][0];
            arrow(front, this.y, par.x - labelWidth * 0.5, par.y);
          }
        }
      };

      this.drawNode = function() {
        p.stroke(255);
        p.fill(255);
        var labelWidth = p.textWidth(this.id);
        var labelHeight = 12;//p.textHeight(this.id);
        p.ellipse(this.x, this.y, labelWidth, labelHeight);
      };

      this.drawLabel = function() {
        if (this.selected) {
          p.fill(255, 0, 0);
        } else {
          p.fill(175);
        }
        var labelWidth = p.textWidth(this.id);
        var labelHeight = 12;//p.textHeight(this.id);
        p.text(this.id, this.x - labelWidth * 0.5, this.y + labelHeight * 0.5);
        if (this.selected) {
          labelWidth = p.textWidth(this.name);
          p.text(this.name, this.x - labelWidth * 0.5, this.y + labelHeight * 1.5);
        }
      };
    }
  }

  var canvas = document.getElementById("mycanvas");
  var p = new Processing(canvas, sketchProc);
});
