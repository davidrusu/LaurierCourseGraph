window.addEventListener('polymer-ready', function(e) {
  function sketchProc(p) {
    var nodes = [];
    var orphanNodes = [] // nodes with no parents or children
    var nodeDict = {}; // dictionary that store nodes for quick lookup
    var shift = [0,0]; // translation vector for panning
    var lastMouse = [p.mouseX, p.mouseY] // the previous mouse position
    var mousePressed = false;
    var maxDepth = 0; 

    p.setup = function() {
      // size is set in the draw method so that scaling
      // the window will update the canvas size
      p.frameRate(30);
    }

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
          if (courses[child] != undefined) {
            var childNode = courses[child];
            var childParents = childNode.parents;
            if (childParents.indexOf(courseName) == -1) {
              childParents.push(courseName);
            }
          }
        }
      }
      
      for (var courseName in courses) {
        createNode(courseName);
      }
    }

    function createNode(name) {
      if (nodeDict[name] != undefined) {
        return nodeDict[name];
      }
      var course = courses[name];
      var children = course.children;
      var parents = course.parents;

      var node = new Node(name, p.random(p.width), p.random(p.height));
      nodeDict[name] = node;
      if (children.length == 0 && parents.length == 0) {
        orphanNodes.push(node);
      } else {
        nodes.push(node)
        children.forEach(function(child) {
          node.addChild(createNode(child));
        });
        parents.forEach(function(parent) {
          node.addParent(createNode(parent));
        });
      }
      maxDepth = p.max(maxDepth, node.depth());
      return node;
    }

    p.mousePressed = function() {
      mousePressed = true;
    }

    p.mouseReleased = function() {
      mousePressed = false;
    }

    p.mouseClicked = function() {
      var actualMouseX = p.mouseX - p.width/2 - shift[0]
      var actualMouseY = p.mouseY - p.height/2 - shift[1]
      nodes.forEach(function(node) {
        var mouseNodeDist = p.dist(node.x, node.y, actualMouseX, actualMouseY);
        if (mouseNodeDist < 10) {
          node.select();
          return;
        }
      });
    }

    function updateMouse() {
      if (mousePressed) {
        shift[0] += p.mouseX - lastMouse[0]
        shift[1] += p.mouseY - lastMouse[1]
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
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var dist = p.max(10, p.sqrt(dx * dx + dy * dy));

          var restingLength = 150;
          var k = 0.01;
          var hierarchyPush = 0;

          if (childrenA.indexOf(b) == -1 &&
              childrenB.indexOf(a) == -1) {
            restingLength = 500;
            k *= 1 * 1/dist;
          } else {
              // nodes are related
            hierarchyPush = 1;
            if (childrenA.indexOf(b) == -1) {
              hierarchyPush *= -1;
            }
          }
          var d = restingLength - dist
          var fx = k * d * dx / dist
          var fy = k * d * dy / dist

          var padding = 25;
          if (dist < padding) {
            var nudge = (padding-dist) * 0.5;
            a.vx += nudge * dx / dist;
            a.vy += nudge * dy / dist;
          }
          a.vx += fx + hierarchyPush;
          a.vy += fy;
          b.vx -= fx + hierarchyPush;
          b.vy -= fy;
        }
      }
    }

    function update() {
      reset();
      updateMouse();
      springDynamics();
      nodes.forEach(function(node) {node.update()});
    }

    p.draw = function() {
      p.size(w, h)
      update();
      recenterNodes();
      p.fill(0);
      p.background(255);
      nodes.forEach(function(node) {node.draw()});
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
      })

      var translateX = p.width/2 + shift[0];
      var translateY = p.height/2 + shift[1];
      p.translate(translateX, translateY);
    }
    
    function arrow(x1, y1, x2, y2, param) {
      p.line(x1, y1, x2, y2);

      var dx = x2-x1;
      var dy = y2-y1;

      p.pushMatrix();
      p.translate(x1 + dx * param, y1 + dy * param);
      var a = p.atan2(-dx, dy);
      p.rotate(a);
      var r = 5;
      p.triangle(0, 0, -r/2, -r * 2, r/2, -r * 2);
      p.popMatrix();
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
      }

      this.select = function() {
        this.selectRecursive(!this.selected);
      }

      this.selectRecursive = function(state) {
        this.selected = state;
        this.parents.forEach(function(parent) {
          parent.selectRecursive(state);
        });
      }

      this.update = function() {
        this.x += this.vx;
        this.y += this.vy;

        var air = 0.9;
        this.vx *= air;
        this.vy *= air;
      }

      this.depth = function() {
        var maxDepth = 0;
        this.children.forEach(function(child) {
          maxDepth = p.max(maxDepth, child.depth());
        });
        return maxDepth + 1;
      };
      
      this.draw = function() {
        p.stroke(0);
        p.fill(255);
        p.ellipse(this.x, this.y, 10, 10);
        p.fill(0);
        p.text(this.name, this.x, this.y);

        if (this.selected) {
          p.stroke(255, 0, 0);
          p.fill(255, 0, 0);
        } else {
          p.stroke(0, 0, 0, 50);
          p.fill(0, 0, 0, 50);
        }

        for (var i = 0; i < this.parents.length; i++) {
          var parent = this.parents[i];
          arrow(this.x, this.y, parent.x, parent.y, 0.5);
        }
      };
    };
  };
 
  

  var canvas = document.getElementById("mycanvas");
  var p = new Processing(canvas, sketchProc);
});
