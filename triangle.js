TRIANGLE||(TRIANGLE={});
var TRIANGLE = {
  init: triangleElement => {
    const canvas = triangleElement.querySelector("canvas");
    params = {
      color: triangleElement.dataset.trianglecolor,
      cross: triangleElement.dataset.trianglecross,
      distance: triangleElement.dataset.triangledistance,
      start: triangleElement.dataset.trianglestart,
      end: triangleElement.dataset.triangleend
    };
    TRIANGLE.injectCSS(triangleElement, canvas);
    triangleElement.style.top = TRIANGLE.getCanvasPosition() + "px";
    paper.install(window);
    paper.setup(canvas);
    TRIANGLE.variables(triangleElement);
    TRIANGLE.generateQuadrantCoordinates();
    TRIANGLE.makeCross();
    TRIANGLE.makeQuadrants();
    TRIANGLE.makeTriangle();
    TRIANGLE.events(triangleElement);
    TRIANGLE.onPageScroll();
    view.draw();
    setTimeout(()=>{
      triangleElement.style.transition = "transform 1s cubic-bezier(.17,.67,.5,1)"
    },100);
  },
  injectCSS: (div, canvas) => {
    //object.assign polyfill
    if (typeof Object.assign != 'function') {
      Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs) {
          'use strict';
          if (target == null) throw new TypeError('Cannot convert undefined or null to object');
          var to = Object(target);
          for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];
            if (nextSource != null) {
              for (var nextKey in nextSource) {
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) to[nextKey] = nextSource[nextKey];
              }
            }
          }
          return to;
        },
        writable: true,
        configurable: true
      });
    }
    divStyle = {
      width: "100%",
      height: "100vh",
      pointerEvents: "none",
      position: "absolute",
      zIndex: "7",
      top:0,
      willChange: "transform"
    };
    canvasStyle = {
      position: "absolute",
      width: "100%",
      height: "120%",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)"
    };
    Object.assign(div.style,divStyle);
    Object.assign(canvas.style,canvasStyle);
  },
  variables: triangle => {
    canvasWidth = view.size.width;
    canvasHeight = view.size.height;
    halfWidth = canvasWidth/2;
    halfHeight = canvasHeight/2;
    quadrants = [];
    quadrantPaths = [];
    crossPath = {};
    trianglePath = {};
    triangleElement = triangle;
    startElement = document.querySelector(`[data-sectionid="${params.start}"]`);
    endElement = document.querySelector(`[data-sectionid="${params.end}"]`);
    startElementInitialPos = TRIANGLE.getCoords(startElement).top;
    endElementInitialPos = TRIANGLE.getCoords(endElement).top;
  },
  events: triangleElement => {
    var newPoint = [];
    trianglePath.segments.forEach((triangleVertice, verticeIndex) => {
      var destination;
      do {
        destination = new Point.random().multiply(view.size);
      } while (!quadrantPaths[verticeIndex].contains(destination)
        || crossPath.contains(destination)
        //|| !triangleVertice.point.isClose(destination, params.distance) //raio para o próximo vértice
      )
      newPoint.push(destination);
    });
    view.onFrame = (event) => {
      var vector = [];
      trianglePath.segments.forEach((triangleVertice, verticeIndex) => {
        var verticePos = triangleVertice.point;
        vector.push(newPoint[verticeIndex].subtract(triangleVertice.point));
        verticePos.x += vector[verticeIndex].x/90;
        verticePos.y += vector[verticeIndex].y/90;
        if (vector[verticeIndex].length < 5) {
          newPoint.length = 0;
          trianglePath.segments.forEach((triangleVerticeNew, verticeIndexNew) => {
            var destination;
            do {
              destination = new Point.random().multiply(view.size);
            }
            while (!quadrantPaths[verticeIndexNew].contains(destination)
              || crossPath.contains(destination)
              || !triangleVerticeNew.point.isClose(destination, params.distance)
            )

            newPoint.push(destination);
          });
      	}
      });
    },
    view.onMouseMove = TRIANGLE.onMouseMove;
    window.addEventListener('scroll', TRIANGLE.onPageScroll);
  },
  onMouseMove: event => {
    trianglePath.segments.forEach(triangleVertice => {
      var verticePos = triangleVertice.point;
      var currentPos = event.point;
      var vector = event.delta || {x:0,y:0};
      var lastPos = {x:currentPos.x - vector.x, y:currentPos.y - vector.y};
      var closing = verticePos.getDistance(lastPos) > verticePos.getDistance(currentPos);
      var friction = verticePos.getDistance(currentPos)/20;
      if (verticePos.isClose(currentPos, 30)) {
        verticePos.x += vector.x/friction/4;
        verticePos.y += vector.y/friction/4;
      } else {
        verticePos.x += vector.x/friction;
        verticePos.y += vector.y/friction;
      }
    });
  },
  onPageScroll: () => {
    var startElementPos = startElement.getBoundingClientRect().top,
        endElementPos = endElement.getBoundingClientRect().top,
        windowHeight = window.innerHeight,
        isPartiallyVisible = (startElementPos > 0 && startElementPos < windowHeight) || endElementPos < 0,
        isFullyVisible = startElementPos <= 0 && endElementPos >= 0;
    if (isFullyVisible) triangleElement.style.transform = `translate3d(0,${startElementInitialPos - startElementPos}px,0)`;
    else if (isPartiallyVisible) {
      if (startElementPos > 0 && startElementPos < windowHeight) triangleElement.style.transform = `translate3d(0,${startElementInitialPos}px,0)`;
      if (endElementPos < 0) triangleElement.style.transform = `translate3d(0,${endElementInitialPos}px,0)`;
    } else triangleElement.style.transform = `translate3d(0,${startElementInitialPos}px,0)`;
  },
  generateQuadrantCoordinates: () => {
    quadrants.push({ //q1
      x1:0,
      y1:0,
      x2:halfWidth,
      y2:halfHeight
    });
    quadrants.push({ //q2
      x1:halfWidth,
      y1:0,
      x2:canvasWidth,
      y2:halfHeight
    });
    quadrants.push({ //q4
      x1:halfWidth,
      y1:halfHeight,
      x2:canvasWidth,
      y2:canvasHeight
    });
    quadrants.push({ //q3
      x1:0,
      y1:halfHeight,
      x2:halfWidth,
      y2:canvasHeight
    });
    var indexToBeRemoved = Math.floor(Math.random() * 4);
    quadrants.splice(indexToBeRemoved,1);
  },
  makeCross: () => {
    var verticalLine = new Rectangle(
      new Point(halfWidth - halfWidth*params.cross, 0),
      new Point(halfWidth + canvasWidth*params.cross/2, canvasHeight)
    )
    var horizontalLine = new Rectangle(
      new Point(0, halfHeight - halfHeight*params.cross),
      new Point(canvasWidth, halfHeight + canvasHeight*params.cross/2)
    )
    var verticalLinePath = new Path.Rectangle(verticalLine);
    var horizontalLinePath = new Path.Rectangle(horizontalLine);
    crossPath = new CompoundPath({
      children: [horizontalLinePath, verticalLinePath],
      //selected: true
    });
  },
  makeQuadrants: () => {
    quadrants.forEach(quadrant => {
      var quadrantElement = new Rectangle(
        new Point(quadrant.x1, quadrant.y1),
        new Point(quadrant.x2, quadrant.y2)
      );
      var quadrantPath = new Path.Rectangle(quadrantElement);
      //quadrantPath.fillColor = TRIANGLE.getRandomColor();
      quadrantPaths.push(quadrantPath);
    });
  },
  makeTriangle: () => {
    var points = [];
    quadrantPaths.forEach(quadrant => {
      var coords;
      do {
        coords = new Point.random().multiply(view.size);
      } while (!quadrant.contains(coords) || crossPath.contains(coords))
      points.push(coords);

    });
    trianglePath = new Path({
      segments: [...points],
      strokeColor: params.color,
      strokeWidth: .5,
      strokeCap: 'round',
      //selected: true,
      closed: true
    });
  },
  getCanvasPosition: () => {
    document.querySelector(`[data-sectionid="${params.start}"]`).getBoundingClientRect().top - document.body.getBoundingClientRect().top;
  },
  getCoords: elem => {
    var box = elem.getBoundingClientRect();
    var body = document.body;
    var docEl = document.documentElement;
    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;
    var top  = box.top +  scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;
    return { top: Math.round(top), left: Math.round(left) };
  },
  getRandomColor: () => {
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
    }
    return color;
  }
};


window.onload = function() {
  var triangles = document.querySelectorAll(".triangle");
  for(let i = 0; i < triangles.length; i++) {
    TRIANGLE.init(triangles[i]);
  };
}
