import "ol/ol.css";
import { Map, View, Feature, Overlay } from "ol";
import { defaults as defaultControls } from "ol/control.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import Point from "ol/geom/Point.js";
import { Icon, Style, Fill, Stroke, Text } from "ol/style.js";
import { toStringHDMS } from "ol/coordinate";
// import BingMaps from 'ol/source/BingMaps.js';
var moment = require("moment");
// import Plotly from 'plotly.js-dist';
// import $ from "jquery";

const map = new Map({
  target: "map",
  controls: defaultControls({
    attribution: false,
    zoom: false,
  }),
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: fromLonLat([51, 33]),
    zoom: 3,
    maxZoom: 4,
    minZoom: 3,
  }),
});
var Vector_Source = new VectorSource({});
var vector_layer = new VectorLayer({
  style: function (feature) {
    return feature.get("style");
  },
  source: Vector_Source,
});
map.addLayer(vector_layer);

var Vector_Source2 = new VectorSource({});
var vector_layer2 = new VectorLayer({
  style: function (feature) {
    return feature.get("style");
  },
  source: Vector_Source2,
});
map.addLayer(vector_layer2);

function createStyle(src, img, txt, rotationIcon, anchor) {
  return new Style({
    image: new Icon({
      anchor: anchor,
      size: [80, 80],
      opacity: 1,
      src: src,
      rotation: rotationIcon + Math.PI / 4,
      scale: 0.8,
    }),
    text: new Text({
      font: "12px Calibri,sans-serif",
      fill: new Fill({ color: "#000" }),
      stroke: new Stroke({
        color: "#fff",
        width: 2,
      }),
      offsetY: 30,
      offsetX: -20,
      // get the text from the feature - `this` is ol.Feature
      // and show only under certain resolution
      text: txt,
      scale: 2,
    }),
  });
}

var xybefore = [
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
];
var xynow = [];

function satelliteLocations(data) {
  Vector_Source.clear();
  var k = 0;
  var j = 0;
  var jj = 0;
  var l = [];
  var ll = [];
  var lines = data.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var words = line.split(":");
    if (words.length == 2) {
      l[jj] = parseFloat(words[1]);
      jj = jj + 1;
      k = k + 1;
      if (k % 13 == 0) {
        ll[j] = l;
        j = j + 1;
        k = 0;
        l = [];
        jj = 0;
      }
    }
  }
  var miu = 398600.5 * 1e9;
  var omegadote = 7.292115 * 1e-5;
  var d = new Date();
  var tofFirstDayOfGPSWeek = d.getUTCDay() * 60 * 60 * 24;
  var timeInToday =
    3600 * new Date().getHours() +
    60 * new Date().getMinutes() +
    new Date().getSeconds() -
    3 * 3600 -
    30 * 60;
  var t = timeInToday + tofFirstDayOfGPSWeek;

  var a = moment(new Date(1999, 8 - 1, 22)); //why 8-1??????
  var b = moment([
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  ]);
  var weekGPSofNow = b.diff(a, "weeks");

  // console.log(weekGPSofNow)
  if (weekGPSofNow > 1023) {
    weekGPSofNow = weekGPSofNow - 1023;
  }

  var satCoors = [];

  for (var i = 0; i < ll.length; i++) {
    var sat = ll[i];
    var a = sat[6] ** 2;
    var n = Math.sqrt(miu / a ** 3);
    var tk = t - sat[3] + (weekGPSofNow - parseInt(sat[12])) * 60 * 60 * 24 * 7;
    var mk = sat[9] + n * tk;
    var Ek0 = 0;
    var Eki = Ek0;
    var dm = 1;
    while (dm > 1e-10) {
      var mkC = Eki - sat[2] * Math.sin(Eki);
      dm = mk - mkC;
      var A = 1 - sat[2] * Math.cos(Eki);
      var dEki = (1.0 / A) * dm;
      Eki = Eki + dEki;
    }
    var Ek = Eki;

    var vk = Math.atan2(
      Math.sqrt(1 - sat[2] ** 2) * Math.sin(Ek),
      Math.cos(Ek) - sat[2]
    );
    vk = vk % (2 * Math.PI);
    var omega = sat[8];
    var phik = omega + vk;
    var rk = a * (1 - sat[2] * Math.cos(Ek));
    var xp = rk * Math.cos(phik);
    var yp = rk * Math.sin(phik);
    var omega0 = sat[7];
    var omegadot = sat[5];
    var omegak = omega0 + (omegadot - omegadote) * tk - omegadote * sat[3];

    omegak = omegak % (2 * Math.PI);
    var inc = sat[4];
    var xk = xp * Math.cos(omegak) - yp * Math.cos(inc) * Math.sin(omegak);
    var yk = xp * Math.sin(omegak) + yp * Math.cos(inc) * Math.cos(omegak);
    var zk = yp * Math.sin(inc);

    var RAD2DEG = 180 / Math.PI;
    var lon = Math.atan2(yk, xk) * RAD2DEG;
    var length = Math.sqrt(xk * xk + yk * yk);
    var lat = Math.atan2(zk, length) * RAD2DEG;

    var point_feature = new Feature({});
    var point_geom = new Point(fromLonLat([lon, lat]));
    xynow[i] = fromLonLat([lon, lat]);
    var dyi = xynow[i][1] - xybefore[i][1];
    var dxi = xynow[i][0] - xybefore[i][0];
    var vangle = Math.atan(Math.abs(dyi / dxi));
    var rotationIcon;
    if (dyi >= 0 && dxi >= 0) {
      rotationIcon = -vangle;
    } else if (dyi >= 0 && dxi <= 0) {
      rotationIcon = vangle - Math.PI;
    } else if (dyi <= 0 && dxi >= 0) {
      rotationIcon = vangle;
    } else {
      rotationIcon = Math.PI - vangle;
    }

    xybefore[i] = fromLonLat([lon, lat]);
    // console.log(Vector_Source.getRevision())
    point_feature.setGeometry(point_geom);
    point_feature.set(
      "style",
      createStyle(
        "http://localhost:8000/satellite.png",
        undefined,
        "GPS " + sat[0],
        rotationIcon,
        [0.5, 0.5]
      )
    );
    Vector_Source.addFeature(point_feature);
    satCoors[i] = [sat[0], sat[1], lon, lat];
    satCoors[i] = [xk, yk, zk];
    var altitude = Math.sqrt(xk ** 2 + yk ** 2 + zk ** 2);
    point_feature.setProperties({
      id: sat[0],
      health: sat[1],
      Eccentricity: sat[2],
      "Time of Applicability(s)": sat[3],
      "Orbital Inclination(rad)": sat[4],
      "Rate of Right Ascen(r/s)": sat[5],
      "SQRT(A)  (m 1/2)": sat[6],
      "Right Ascen at Week(rad)": sat[7],
      "Argument of Perigee(rad)": sat[8],
      "Mean Anom(rad)": sat[9],
      "Af0(s)": sat[10],
      "Af1(s/s)": sat[11],
      week: sat[12],
      lambda: lon,
      phi: lat,
      altitude: altitude,
      xk: xk,
      yk: yk,
      zk: zk,
    });
  }
}

var createCORSRequest = function (method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // Most browsers.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // IE8 & IE9
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
};

function readTextFile(url) {
  var method = "GET";
  var xhr = createCORSRequest(method, url);

  xhr.onload = function () {
    var allText = xhr.responseText;
    satelliteLocations(allText);
    setTimeout(function () {
      satelliteLocations(allText);
    }, 1000);
    setInterval(function () {
      satelliteLocations(allText);
    }, 10000);
  };

  xhr.onerror = function () {
    // Error code goes here.
  };

  xhr.send();
}

readTextFile("/statics/almanac.yuma.week0999.147456.txt");
//run python server for icon image

var overlay = new Overlay({
  element: document.getElementById("overlay"),
  positioning: "bottom-center",
});

map.on("singleclick", function (evt) {
  var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    //you can add a condition on layer to restrict the listener
    return feature;
  });
  if (feature) {
    $("#btn-1").slideUp();
    $("#btn-2").slideUp();
    $("#btn-3").slideUp();
    $("#btn-4").slideUp();
    if (feature.get("id")) {
      //here you can add you code to display the coordinates or whatever you want to do
      overlay.setPosition(evt.coordinate);
      var element = overlay.getElement();

      var htmlP =
        "<b>ID:</b>  " +
        feature.get("id") +
        "</br><b> Health: </b> " +
        feature.get("health") +
        "</br><b>Coors:</b>   " +
        toStringHDMS([feature.get("lambda"), feature.get("phi")]) +
        "</br><b>Altitude:</b>   " +
        parseInt(feature.get("altitude") / 1000) +
        " km";

      element.innerHTML = htmlP;
      // and add it to the map
      map.addOverlay(overlay);
    } else {
      dialog.dialog("open");
    }
  } else {
    $("#btn-1").slideDown();
    $("#btn-2").slideDown();
    $("#btn-3").slideDown();
    $("#btn-4").slideDown();

    Plotly.purge("skyPlot");
    var lonlat = toLonLat(map.getCoordinateFromPixel(evt.pixel), "EPSG:3857");

    Vector_Source2.clear();
    var point_feature = new Feature({});
    var point_geom = new Point(map.getCoordinateFromPixel(evt.pixel));
    point_feature.setGeometry(point_geom);
    point_feature.set(
      "style",
      createStyle(
        "http://localhost:8000/map-marker.png",
        undefined,
        "" +
          parseFloat(lonlat[0]).toFixed(4) +
          "," +
          parseFloat(lonlat[1]).toFixed(4),
        -Math.PI / 4,
        [0.36, 0.74]
      )
    );
    Vector_Source2.addFeature(point_feature);

    map.removeOverlay(overlay);
    var SkyPlotData = getSkyPlot(lonlat);
    // document.getElementById('skyPlot').style.display="block"

    var data = [
      {
        type: "scatterpolar",
        mode: "markers",
        r: SkyPlotData[3],
        theta: SkyPlotData[1],
        text: SkyPlotData[0].map(String),
        textposition: "top",
        marker: {
          color: "red",
          symbol: "square",
          size: 10,
        },
      },
    ];

    var layout = {
      showlegend: false,
      autosize: true,
      width: 300,
      margin: {
        l: 30,
        r: 30,
        b: 0,
        t: 50,
        pad: 1,
      },
      paper_bgcolor: "#eee",
      plot_bgcolor: "#000",
      polar: {
        radialaxis: {
          tickfont: {
            size: 8,
          },
        },
        angularaxis: {
          tickfont: {
            size: 8,
          },
          direction: "clockwise",
        },
      },
    };

    Plotly.plot("skyPlot", data, layout);
  }
});

function getSkyPlot(lonlat) {
  var j = 0;
  var phi = (Math.PI * lonlat[1]) / 180;
  var lambda1 = (Math.PI * lonlat[0]) / 180;
  var h = 1722;

  var a = 6378137.0;
  var b = 6356752.31425;
  var e = Math.sqrt((a ** 2 - b ** 2) / a ** 2); //eccenntry of the earth
  var N = a / Math.sqrt(1 - (e * Math.sin(phi)) ** 2);
  var x = (N + h) * Math.cos(phi) * Math.cos(lambda1);
  var y = (N + h) * Math.cos(phi) * Math.sin(lambda1);
  var z = (h + N * (b / a) ** 2) * Math.sin(phi);

  var features = Vector_Source.getFeatures();
  var xki, yki, zki, East, North, Up, dx, dy, dz, azimuth, height, rTest;
  var azimuths = [];
  var heights = [];
  var ids = [];
  var rTests = [];
  for (var i = 0; i < features.length; i++) {
    xki = features[i].get("xk");
    yki = features[i].get("yk");
    zki = features[i].get("zk");

    dx = xki - x;
    dy = yki - y;
    dz = zki - z;

    East = -Math.sin(lambda1) * dx + Math.cos(lambda1) * dy;
    North =
      -Math.cos(lambda1) * Math.sin(phi) * dx -
      Math.sin(phi) * Math.sin(lambda1) * dy +
      Math.cos(phi) * dz;
    Up =
      Math.sin(phi) * Math.cos(lambda1) * dx +
      Math.cos(phi) * Math.sin(lambda1) * dy +
      Math.sin(phi) * dz;
    azimuth = (Math.atan(Math.abs(East / North)) * 180) / Math.PI;
    if (North < 0 && East > 0) {
      azimuth = 180 - azimuth;
    } else if (North > 0 && East < 0) {
      azimuth = 360 - azimuth;
    } else if (North < 0 && East < 0) {
      azimuth = azimuth + 180;
    }
    height =
      (Math.atan(Up / Math.sqrt(North ** 2 + East ** 2)) * 180) / Math.PI;
    rTest = Math.sqrt(East ** 2 + North ** 2);
    if (height > 0) {
      ids[j] = features[i].get("id");
      azimuths[j] = azimuth;
      heights[j] = height;
      rTests[j] = rTest;
      j = j + 1;
    }
  }

  return [ids, azimuths, heights, rTests];
}

$("#btn-4").click(function (e) {
  $("#skyPlot").slideToggle();
});
function startDate() {
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth() + 1;
  var day = today.getDate();
  document.getElementById("date").innerHTML =
    year + "-" + month + "-" + day + "</br>";
}
startDate();

function startTime() {
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();
  m = checkTime(m);
  s = checkTime(s);
  document.getElementById("time").innerHTML = h + ":" + m + ":" + s;
  var t = setTimeout(startTime, 500);
}

function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  } // add zero in front of numbers < 10
  return i;
}
startTime();

var dialog = $("#dialog-form").dialog({
  autoOpen: false,
  height: 230,
  width: 210,
  modal: true,
  buttons: {
    Cancel: function () {
      dialog.dialog("close");
    },
    Go: function () {
      dialog.dialog("close");
      GoToXy();
    },
  },
});

function GoToXy() {
  Vector_Source2.clear();
  var lonlat = [
    parseFloat($("#Longitude").val()),
    parseFloat($("#Latitude").val()),
  ];
  var point_feature = new Feature({});
  var point_geom = new Point(fromLonLat(lonlat));
  point_feature.setGeometry(point_geom);
  point_feature.set(
    "style",
    createStyle(
      "http://localhost:8000/map-marker.png",
      undefined,
      "" +
        parseFloat(lonlat[0]).toFixed(4) +
        "," +
        parseFloat(lonlat[1]).toFixed(4),
      -Math.PI / 4,
      [0.36, 0.74]
    )
  );
  Vector_Source2.addFeature(point_feature);
  $("#btn-1").slideDown();
  $("#btn-2").slideDown();
  $("#btn-3").slideDown();
  $("#btn-4").slideDown();
}
