"use strict";
var courses = {}; // filled with courses when user clicks tags
var refresh = true; // refresh is set to true whenever courses is modified
window.addEventListener('polymer-ready', function(e) {
  function sketchProc(p) {
    var nodes = [];
    var orphanNodes = []; // nodes with no parents or children
    var nodeDict = {}; // dictionary that store nodes for quick lookup
    var shift = [0, 0]; // translation vector for panning
    var lastMouse = [p.mouseX, p.mouseY]; // the previous mouse position
    var mousePressed = false;
    var maxDepth = 0;

    p.setup = function() {
      // size is set in the draw method so that scaling
      // the window will update the canvas size
      p.frameRate(30);
    };

    function reset() {
      if (!courses ||  !refresh) {
        return;
      }
      refresh = false;

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
      console.log('num nodes', nodes.length);
    }

    function createNode(name) {
      if (nodeDict[name] !== undefined) {
        return nodeDict[name];
      }
      var course = courses[name];
      var children = course.children;
      var parents = course.parents;

      var node = new Node(name, p.random(p.width), p.random(p.height));
      nodeDict[name] = node;
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
      nodes.forEach(function(node) {
        var mouseNodeDist = p.dist(node.x, node.y, actualMouseX, actualMouseY);
        if (mouseNodeDist < 10) {
          node.select();
          return;
        }
      });
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
          var aRelatives = a.parents.length;
          var bRelatives = b.parents.length;
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var dist = p.max(1, p.sqrt(dx * dx + dy * dy));

          var restingLength = p.min(aRelatives,bRelatives) * 20 + 100;
          var k = 0.05;
          var hierarchyPush = 0;

          var fx = 0;
          var fy = 0;
          if (childrenA.indexOf(b) === -1 &&
              childrenB.indexOf(a) === -1) {
            restingLength = 7 * nodes.length;
            k = 1/restingLength * 0.01;
            var push = (bRelatives - aRelatives) * 1/dist;//p.min(0.1, 1 / p.abs(dy * dy)) * dy / p.abs(dy);
            //push = p.min(1, 1/p.abs(dx)) * 0.2;
            //a.vy -= push;
            //b.vy += push;
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
            restingLength = p.min(500, child.parents.length * 50 + 50);
          }
          
          var alignForce = p.min(0.5, 1/p.max(1, p.abs(dx)) * 1/dist) * dx / p.abs(dx) * 2;
          a.vx -= alignForce;
          b.vx += alignForce;
          

          var padding = 60;
          if (dist < padding) {
            var nudge = 1/(dist) * 20;
            a.vx += nudge * dx / dist * 0.1;
            a.vy += nudge * dy / dist;
            b.vx -= nudge * dx / dist * 0.1;
            b.vy -= nudge * dy / dist;
            
          }
          var d = restingLength - dist;
          fx = k * d * dx / dist + hierarchyPush;
          fy = k * d * dy / dist;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
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
   
    function Node(name, x, y) {
      this.name = name;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.children = [];
      this.parents = [];
      this.rate = p.random(20, 1000);
      this.selected = false;

      this.addChild = function(node) {
        this.children.push(node);
      };

      this.addParent = function(node) {
        this.parents.push(node);
      };

      this.select = function() {
        this.selectRecursive(!this.selected);
      };

      this.selectRecursive = function(state) {
        this.selected = state;
        this.parents.forEach(function(parent) {
          parent.selectRecursive(state);
        });
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
        if (this.selected) {
          return;
        } else {
          p.stroke(175, 175, 175);
          p.fill(175, 175, 175);
        }
        
        var labelWidth = p.textWidth(this.name);
        var front = this.x + labelWidth * 0.5;
        for (var i = 0; i < this.parents.length; i++) {
          var parent = this.parents[i];
          arrow(front, this.y, parent.x - labelWidth * 0.5, parent.y);
        }
      };

      this.drawSelectedArrows = function() {
        if (this.selected) {
          p.stroke(255, 0, 0);
          p.fill(255, 0, 0);
        } else {
          return
        }
        
        var labelWidth = p.textWidth(this.name);
        var front = this.x + labelWidth * 0.5;
        for (var i = 0; i < this.parents.length; i++) {
          var parent = this.parents[i];
          arrow(front, this.y, parent.x - labelWidth * 0.5, parent.y);
        }
        
      };

      this.drawNode = function() {
        p.stroke(255);
        p.fill(255);
        var labelWidth = p.textWidth(this.name);
        var labelHeight = 12;//p.textHeight(this.name);
        p.ellipse(this.x, this.y, labelWidth, labelHeight);
      };

      this.drawLabel = function() {
        p.fill(0);
        var labelWidth = p.textWidth(this.name);
        var labelHeight = 12;//p.textHeight(this.name);
        p.text(this.name, this.x - labelWidth * 0.5, this.y + labelHeight * 0.5);
      };
    }
  }

  var canvas = document.getElementById("mycanvas");
  var p = new Processing(canvas, sketchProc);
});
