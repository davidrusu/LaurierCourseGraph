window.addEventListener('polymer-ready', function(e) {
  function sketchProc(p) {
    var nodes = [];
    var nodeDict = {};
    var drawing = true;
    var scale = 1;
    var shift = [0,0];
    var lastMouse = [p.mouseX, p.mouseY]
    var pointer = [p.mouseX, p.mouseY] // actual pointer position in 
    var mousePressed = false;
    
    p.setup = function() {
      p.frameRate(60);
    }

    p.mousePressed = function() {
      mousePressed = true;
    }

    p.mouseReleased = function() {
      mousePressed = false;
      shift[0] = shift[0]  + p.mouseX - startMouseX;
      shift[1] = shift[1]  + p.mouseY - startMouseY;
    }

    function updateMouse() {
      if (mousePressed) {
        shift[0] += p.mouseX - lastMouse[0]
        shift[1] += p.mouseY - lastMouse[1]
      }
      lastMouse[0] = p.mouseX;
      lastMouse[1] = p.mouseY;
    }

    function update() {
      reset();
      updateMouse();
      for (var i=0; i < nodes.length; i++) {
        var a = nodes[i];
        var depth = a.depth();
        for (var j=i+1; j < nodes.length; j++) {
          var b = nodes[j];
          var b_depth = b.depth();
          var k = -0.0001;
          var depth_dist = p.abs(depth - b_depth);
          var rest = depth_dist*depth_dist * 50 + 200;

          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var dist = p.max(1, p.sqrt(dx * dx + dy * dy));

          if (!(a.children.indexOf(b) ||
                b.children.indexOf(a))) {
            var k = 0.1;
            var rest = 400;
            var fx = 0.001 * (rest*3-dist) * dx / dist;
            var fy = 0.0001 * (rest-dist) * dy / dist;
          } else {
            var fx = -k * (rest - dist) * dx / dist
            var fy = -k * (rest - dist) * dy / dist
          }
          a.vx += fx
          a.vy += fy
          b.vx -= fx
          b.vy -= fy
        }
      }
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        node.update();
      }
    }

    function reset() {
      if (!courses ||  !refresh) {
        return;
      }
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

    function createNode(key) {
      if (nodeDict[key] != undefined) {
        return nodeDict[key];
      }
      var course = courses[key];
      var node = new Node(key, p.random(p.width), p.random(p.height));
      nodeDict[key] = node;
      nodes.push(node);
      var children = course.children;
      for (var i=0; i < children.length; i++) {
        child = children[i];
        node.add_dep(createNode(child));
      }
      return node;
    }

    p.draw = function() {
      p.size(w, h)
      update()

      p.background(255);
      var min_x = p.width;
      var min_y = p.height;
      var max_x = 0;
      var max_y = 0;
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
        node.y -= centerX;
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

      this.update_dep = function(self) {
        time = 10000;
        angle = p.sin(millis() / self.rate);
        timeScale = p.max(0, time - p.millis()) / time;

        k = 0.001 + 0.1*(angle+1)*timeScale;
        rest = 50 + 50*angle*timeScale;

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
          this.vy += fy;
          d.vx -= fx;
          d.vy -= fy - 0.3; // we push dependencies down
        }
      }
      this.update = function() {
        this.x += this.vx;
        this.y += this.vy;

        var air = 0.9;
        this.vx *= air;
        this.vy *= air;
        // nodes with lots of children float to the top
        this.vy -= this.depth() * 0.01; 
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
        for (var i = 0; i < this.children.length; i++) {
          var d = this.children[i];
          arrow(d.x, d.y, this.x, this.y);
        }
      };
    };
  };
 
  var arrow = function(x1, y1, x2, y2) {
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
    p.triangle(0, 0, -r/2, -r, r/2, -r);
    p.popMatrix();
  };

  var canvas = document.getElementById("mycanvas");
  var p = new Processing(canvas, sketchProc);
});
