window.addEventListener('polymer-ready', function(e) {
  function sketchProc(p) {
    var nodes = [];
    var orphanNodes = []
    var nodeDict = {};
    var drawing = true;
    var scale = 1;
    var shift = [0,0];
    var lastMouse = [p.mouseX, p.mouseY]
    var pointer = [p.mouseX, p.mouseY] // actual pointer position in 
    var startTime = p.millis();
    var mousePressed = false;
    var maxDepth = 0;

    p.setup = function() {
      p.frameRate(30);
    }

    function reset() {
      if (!courses ||  !refresh) {
        return;
      }
      maxDepth = 0;
      startTime = millis();
      scale = 1;
      shift = [0, 0];
      lastMouse = [p.mouseX, p.mouseY];
      pointer = [p.mouseX, p.mouseX];
      nodes = [];
      nodeDict = {};
      console.log(nodeDict)

      console.log('refresh')

      var keys = Object.keys(courses);
      for (var i = 0; i < keys.length; i++) {
        var course_name = keys[i];
        createNode(course_name);
      }
      refresh = false;
    }

    function millis() {
      return p.millis() - startTime;
    }


    function createNode(key) {
      if (nodeDict[key] != undefined) {
        return nodeDict[key];
      }
      var course = courses[key];
      var node = new Node(key, p.random(p.width), p.random(p.height));
      nodeDict[key] = node;
      if (course.children.length == 0 && course.parents.length == 0) {
        p.println(key);
        orphanNodes.push(node);
      } else {
        nodes.push(node);
        var children = course.children;
        for (var i=0; i < children.length; i++) {
          child = children[i];
          node.add_dep(createNode(child));
        }
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

    function updateMouse() {
      if (mousePressed) {
        shift[0] += p.mouseX - lastMouse[0]
        shift[1] += p.mouseY - lastMouse[1]
      }
      lastMouse[0] = p.mouseX;
      lastMouse[1] = p.mouseY;
    }

    function springDynamics() {
      for (var i=0; i < nodes.length; i++) {
        var a = nodes[i];
        var depthA = a.depth();

        for (var j=i+1; j < nodes.length; j++) {
          var b = nodes[j];
          var depthB = b.depth();

          var depthDist = p.abs(depthA - depthB);

          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var dist = p.max(10, p.sqrt(dx * dx + dy * dy));

          var restingLength = 50;
          var k = 0.01;
          var correction = 0

          if (a.children.indexOf(b) == -1 &&
                b.children.indexOf(a) == -1) {
            // if nodes are not related
            restingLength = 500;
            k *= 1 * 1/dist //(1+depthDist*depthDist)
              //k = -1/(dist*dist) * 10;
          } else {
              // nodes are related
              pushStrength = 1;
              if (a.children.indexOf(b) == -1) {
                  correction = -pushStrength;
              } else {
                  correction = pushStrength;
              }
          }
            /* var fx = k * (restingLength - dist) * dx / dist
          var fy = k * (restingLength - dist) * dy / dist */
          var d = restingLength - dist
          var fx = k * d * dx / dist
          var fy = k * d * dy / dist
            padding = 50 * 0.5;
            if (dist < padding) {
                a.vx += (padding-dist)*0.5 * dx /dist;
                a.vy += (padding-dist)*0.5 * dy / dist;
            }
          a.vx += fx + correction
          a.vy += fy
          b.vx -= fx + correction
          b.vy -= fy
        }
        var duration = 10000;
        var time = millis()
        //if (time < duration) {
          p.stroke(0);
          var seperation = 200;
          var depthValley = depthA * seperation - maxDepth * seperation / 2;
          p.line(depthValley, -1e10, depthValley, 1e10);
          var deltaX =  depthValley - a.x
          var denum = millis + 30
          var crossfade = p.min(duration, time)/duration
          var strength = crossfade + (1-crossfade) * (p.sin(time / 200) + 1)/2;
          //p.println(strength);
          //if (p.abs(deltaX) > strength) {
          //  deltaX = deltaX / p.abs(deltaX) * strength;
          //}
          //p.println('before ' + a.x)
          //a.x = depthValley * (1-strength) + a.x *(strength);
          //a.vx += deltaX * strength * 1// + a.x*(1-strength) ;
          //p.println(a.x);
          //a.vx = 0//a.vx * (1-strength);
          //a.vy = 0
        //} else if (time > duration *1.5) {
        //  startTime = p.millis();
        //}
      }
    }

    function update() {
      reset();
      updateMouse();
      
      springDynamics();
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        node.update();
      }
    }

    p.draw = function() {
      p.size(w, h)
      
      
      update();
      p.background(255);
      var min_x = 1e1000;
      var min_y = 1e1000;
      var max_x = -1e1000;
      var max_y = -1e1000;
      var sum_x = 0;
      var sum_y = 0;
      var n = 0.0;
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.x < min_x) {
          min_x = node.x
        }
        if (node.y < min_y) {
          min_y = node.y;
        }
        if (node.x > max_x) {
          max_x = node.x;
        }
        if (node.y > max_y) {
          max_y = node.y;
        }
        n += 1;
        sum_x += node.x;
        sum_y += node.y;
      }
      var span_x = max_x - min_x;
      var span_y = max_y - min_y;
      var centerX = sum_x / n;//(max_x + min_x) / 2;
      var centerY = sum_y / n;//(max_y + min_y) / 2;
      var translateX = p.width/2 + shift[0];
      var translateY = p.height/2 + shift[1];
      /* var s = p.min(p.width/span_x, p.height/span_y) * 0.9; */
      p.fill(0);
      p.translate(translateX, translateY);
      /* p.scale(s, s); */
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        node.x -= centerX;
        node.y -= centerY;
      }
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        node.draw();
      }

    };

   
    function Node(name, x, y) {
      this.name = name;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.children = [];
      this.parent = [];
      this.rate = p.random(20, 1000);

      this.add_dep = function(node) {
        this.children.push(node);
      };

      this.update_dep = function() {
        var time = 10000;
        var angle = p.sin(p.millis() / this.rate);
        var timeScale = p.max(0, time - p.millis()) / time;

        var k = 0.001 + 0.1*(angle+1)*timeScale;
        var rest = 50 + 50*angle*timeScale;
        var pushStrength = 0.01;
        for (var i = 0; i < this.children.length; i++) {
          var d = this.children[i];
          var dx = d.x - this.x;
          var dy = d.y - this.y;
          var dist = p.sqrt(dx * dx + dy * dy);
          var length = rest - dist;
          var vec =-k * length / dist ;
          var fx = vec * dx;
          var fy = vec * dy;
          
          this.vx += fx;
          this.vy += fy - pushStrength;
          d.vx -= fx;
          d.vy -= fy - pushStrength; // we push dependencies down
        }
      }

      this.update = function() {
        //this.update_dep();
        this.x += this.vx;
        this.y += this.vy;

        var air = 0.9;
        this.vx *= air;
        this.vy *= air;
        //this.vy += -0.5 * this.children.length;
      }

      this.depth = function() {
        if (this.children.length == 0) {
          return 1;
        }

        var max_depth = 0;
        for (var i = 0; i < this.children.length; i++) {
          var d = this.children[i];
          var ddepth = d.depth();
          if (ddepth > max_depth) {
            max_depth = ddepth;
          }
        }
        return max_depth + 1;
      };
      this.draw = function() {
        p.stroke(0);
        p.fill(255);
        p.ellipse(this.x, this.y, 10, 10);
        if (!drawing) {
          return;
        }
        p.fill(0);
        p.text(this.name, this.x, this.y);
        //p.text('vx ' + this.vx, this.x, this.y + 12);
        //p.text('vy ' + this.vy, this.x, this.y + 24);
        for (var i = 0; i < this.children.length; i++) {
          var d = this.children[i];
          arrow(d.x, d.y, this.x, this.y);
        }
      };
    };
  };
 
  function arrow(x1, y1, x2, y2) {
    p.fill(0, 0, 0, 50);
    p.stroke(0, 0, 0, 50);
    p.line(x1, y1, x2, y2);
    var dx = x2-x1;
    var dy = y2-y1;
    p.pushMatrix();
    p.translate(x1 + dx / 2, y1 + dy / 2);
    var a = p.atan2(-dx, dy);
    p.rotate(a);
    var r = 5;
    p.fill(0);
    p.triangle(0, 0, -r/2, -r * 2, r/2, -r * 2);
    p.popMatrix();
  };

  var canvas = document.getElementById("mycanvas");
  var p = new Processing(canvas, sketchProc);
});
