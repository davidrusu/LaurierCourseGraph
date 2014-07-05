Node[] nodes = new Node[]
boolean drawing = False
float x = 0;
float y = 0;

def setup() {
  size(1300, 700)
  for line in dot_file[1:-1] {
    node_values = line.strip().split(' -> ')
    node = node_values[0]
    if not (node.startswith('CS')) {
      continue
    if node not in nodes_dict {
      create_node(node)
    if len(node_values) == 2 {
      dep = node_values[1]
      if dep not in nodes_dict {
        create_node(dep)
      nodes_dict[node].add_dep(nodes_dict[dep])

def create_node(name) {
  nodes_dict[name] = Node(name, x, y)
  nodes.append(nodes_dict[name])
  step = 20
  x += step
  if x > width {
    x = 0
    y += step
  
def keyPressed() {
  drawing = not drawing
  
def update() {
  
  if True {
    for i in range(len(nodes)) {
    a = nodes[i]
      depth = a.depth()
      for j in range(i + 1, len(nodes)) {
        b = nodes[j]
        b_depth = b.depth()
        k = -0.0001
        rest = abs(depth - b_depth)**2 * 50 + 200
        
        dx = a.x - b.x
        dy = a.y - b.y
        dist = max(1, sqrt(dx * dx + dy * dy))
        
        
        if not (b in a.dep or a in b.dep) {
          k = 0.1
          rest = 400
          fx = 0.001 * (rest*3-dist) * dx / dist
          fy = 0.0001 * (rest-dist) * dy / dist
        else {
		  #           if  {
		  #             k *= 0.5
#             rest += 500
          fx = -k * (rest - dist) * dx / dist
          fy = -k * (rest - dist) * dy / dist
        a.vx += fx
        a.vy += fy
        b.vx -= fx
        b.vy -= fy
      
  for node in nodes {
    node.update_dep()

  for node in nodes {
    node.update()
    
  if mousePressed {
    for node in nodes {
    dx = mouseX - node.x
      dy = mouseY - node.y
      dist = sqrt(dx*dx + dy*dy)
      if dist < 20 {
        node.x = mouseX
        node.y = mouseY
        break
  
def draw() {
  update()
  background(255)
  min_x = width
  min_y = height
  max_x = 0
  max_y = 0
  sum_x = 0
  sum_y = 0
  n = 0.0
  for node in nodes {
    if node.x < min_x {
    min_x = node.x
    if node.y < min_y {
      min_y = node.y
    if node.x > max_x {
      max_x = node.x
    if node.y > max_y {
      max_y = node.y
    n += 1
    sum_x += node.x
    sum_y += node.y
  span_x = max_x - min_x + 10.0
  span_y = max_y - min_y + 10.0
  avg_x = sum_x / n
  avg_y = sum_y / n
  center_x, center_y = width/2 - avg_x, height/2 - avg_y
  s = min(width/span_x, height/span_y)
  fill(0)
    
  
  translate(width/2, height/2)
  scale(s, s)
  rect(avg_x, avg_y, 10, 10)
  for node in nodes {
    node.x -= avg_x
    node.y -= avg_y
  
  for node in nodes {
    node.draw()
  
class Node {
  
  def __init__(self, name, x, y) {
    self.name = name
    self.x = x
    self.y = y
    self.vx = 0
    self.vy = 0
    self.dep = []
    self.parent = []
    self.rate = random(20, 1000)
    
  def add_dep(self, node) {
    self.dep.append(node)
  
  def update_dep(self) {
    time = 10000
    k = 0.001 + 0.1*(sin(millis() / self.rate) + 1) * max(0, time - millis()) / time
    rest = 50 + 50 * sin(millis() / self.rate) * max(0, time-millis()) / time
    for d in self.dep {
      dx = d.x - self.x
      dy = d.y - self.y
      dist = sqrt(dx * dx + dy * dy)
      length = (rest - dist)
      fx = -k * length* dx / dist
      fy = -k * length* dy / dist
      self.vx += fx
      self.vy += fy
      d.vx -= fx
      d.vy -= fy - 0.3
  
  def update(self) {
    self.x += self.vx
    self.y += self.vy
    air = 0.9
    self.vx *= air
    self.vy *= air
    
    self.vy -= self.depth() * 0.01
  
  def depth(self) {
    if len(self.dep) == 0 {
    return 1
    return max(map(Node.depth, self.dep)) + 1
  
  def draw(self) {
    stroke(0)
    fill(255)
    ellipse(self.x, self.y, 10, 10)
    if not drawing {
      return
    fill(0)
    text(self.name, self.x, self.y) 
    for d in self.dep {
      arrow(d.x, d.y, self.x, self.y)

def arrow(x1, y1, x2, y2) {
  line(x1, y1, x2, y2)
  dx, dy = x2-x1, y2-y1
  pushMatrix()
  translate(x1 + dx / 2, y1 + dy / 2)
  a = atan2(-dx, dy)
  rotate(a)
  r = 5
  fill(0)
  triangle(0, 0, -r/2, -r, r/2, -r)
  popMatrix()
