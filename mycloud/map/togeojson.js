/*
togeojson.js
Converts KML/GPX to GeoJSON.
https://github.com/mapbox/togeojson

(c) 2013, Mapbox
(c) 2013, Tom MacWright
License: BSD (see LICENSE file)
*/
(function() {

    'use strict';

    var removeSpace = /\s*/g,
        trimSpace = /^\s*|\s*$/g,
        splitSpace = /\s+/;

    // generate a short, numeric hash of a string
    function okhash(x) {
        if (!x || !x.length) return 0;
        for (var i = 0, h = 0; i < x.length; i++) {
            h = ((h << 5) - h) + x.charCodeAt(i) | 0;
        }
        return h;
    }

    // get the tag contents of a given DOM node
    function get(x, y) {
        return x.getElementsByTagName(y);
    }

    function get1(x, y) {
        return x.getElementsByTagName(y)[0];
    }

    // extract the text value of a node, including its children
    function nodeVal(x) {
        if (x) {
            return x.textContent || x.text;
        }
        return null; // Ensure a return value
    }

    // get one of several child tags for a node
    function getAny(x, y) {
        var z = {};
        for (var i = 0; i < y.length; i++) {
            var contents = get1(x, y[i]);
            if (contents) {
                z[y[i]] = nodeVal(contents);
            }
        }
        return z;
    }

    // Helper to get the first geometry node
    function get_geom(node) {
        for (var i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === 1 && node.childNodes[i].nodeName.match(/(Point|LineString|Polygon|MultiGeometry|track|gx:Track)/)) {
                return node.childNodes[i];
            }
        }
        return null;
    }

    // parse a coordinate string, turning it into an array of numbers
    function coord(v) {
        return v.replace(removeSpace, '').split(',').map(Number);
    }

    // parse a coordinate string, turning it into an array of arrays of numbers
    function multi_coord(v) {
        return v.replace(trimSpace, '').split(splitSpace).map(coord);
    }

    // KML-specific functions
    function kmlColor(v) {
        var color = {};
        color.a = parseInt(v.substr(0, 2), 16) / 255;
        color.b = parseInt(v.substr(2, 2), 16) / 255;
        color.g = parseInt(v.substr(4, 2), 16) / 255;
        color.r = parseInt(v.substr(6, 2), 16) / 255;
        return color;
    }

    function kmlTrack(node) {
        var track = get(node, 'gx:Track');
        if (!track.length) track = get(node, 'Track');
        if (!track.length) return null;
        track = track[0];
        var times = get(track, 'when');
        var coords = get(track, 'gx:coord');
        if (!coords.length) coords = get(track, 'coord');
        var features = [];
        var i;
        for (i = 0; i < times.length; i++) {
            features.push(coord(nodeVal(coords[i])).concat([nodeVal(times[i])]));
        }
        return {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: features
            }
        };
    }

    function kmlgxTrack(node) {
        var track = get1(node, 'gx:Track');
        if (!track) return null;
        var times = get(track, 'when');
        var coords = get(track, 'gx:coord');
        var features = [];
        var i;
        for (i = 0; i < times.length; i++) {
            features.push(coord(nodeVal(coords[i])).concat([nodeVal(times[i])]));
        }
        return {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: features
            }
        };
    }

    function kmlMultiGeometry(node) {
        var geoms = [];
        for (var i = 0; i < node.childNodes.length; i++) {
            var child = node.childNodes[i];
            if (child.nodeType === 1 && child.nodeName.match(/(Point|LineString|Polygon)/)) {
                if (kml[child.nodeName]) {
                    geoms.push(kml[child.nodeName](child));
                }
            }
        }
        return {
            type: 'GeometryCollection',
            geometries: geoms
        };
    }

    function kmlPoint(node) {
        return {
            type: 'Point',
            coordinates: coord(nodeVal(get1(node, 'coordinates')))
        };
    }

    function kmlLineString(node) {
        return {
            type: 'LineString',
            coordinates: multi_coord(nodeVal(get1(node, 'coordinates')))
        };
    }

    function kmlPolygon(node) {
        var outer = get1(get1(node, 'outerBoundaryIs'), 'LinearRing');
        var inner = get(get1(node, 'innerBoundaryIs'), 'LinearRing');
        var coords = [multi_coord(nodeVal(get1(outer, 'coordinates')))];
        for (var i = 0; i < inner.length; i++) {
            coords.push(multi_coord(nodeVal(get1(inner[i], 'coordinates'))));
        }
        return {
            type: 'Polygon',
            coordinates: coords
        };
    }

    function kmlExtendedData(node) {
        var extendedData = {};
        var data = get(node, 'Data');
        for (var i = 0; i < data.length; i++) {
            extendedData[data[i].getAttribute('name')] = nodeVal(get1(data[i], 'value'));
        }
        var schemaData = get(node, 'SchemaData');
        for (var j = 0; j < schemaData.length; j++) {
            var simpleData = get(schemaData[j], 'SimpleData');
            for (var k = 0; k < simpleData.length; k++) {
                extendedData[simpleData[k].getAttribute('name')] = nodeVal(simpleData[k]);
            }
        }
        return extendedData;
    }

    // Corrected getGeomType to directly return nodeName of the geometry node
    function getGeomType(node) {
        return node.nodeName;
    }

    // Define kml object *after* its functions are defined
    var kml = {
        gx: 'http://www.google.com/kml/ext/2.2',
        Point: kmlPoint,
        LineString: kmlLineString,
        Polygon: kmlPolygon,
        MultiGeometry: kmlMultiGeometry,
        track: kmlTrack,
        'gx:Track': kmlgxTrack
    };

    function kmlPlacemark(node) {
        var geometryNode = get_geom(node);
        if (!geometryNode) return null;

        var properties = getAny(node, ['name', 'description', 'visibility', 'open', 'address', 'phoneNumber']);
        properties.styleUrl = nodeVal(get1(node, 'styleUrl'));
        var extendedData = get1(node, 'ExtendedData');
        if (extendedData) {
            properties.ExtendedData = kmlExtendedData(extendedData);
        }
        if (get1(node, 'TimeStamp')) {
            properties.timespan = nodeVal(get1(get1(node, 'TimeStamp'), 'when'));
        }
        if (get1(node, 'TimeSpan')) {
            properties.timespan = getAny(get1(node, 'TimeSpan'), ['begin', 'end']);
        }

        var geomType = getGeomType(geometryNode);
        if (geomType && kml[geomType]) {
            return {
                type: 'Feature',
                geometry: kml[geomType](geometryNode),
                properties: properties
            };
        }
        return null;
    }

    function kmlFolder(node) {
        var features = [];
        var placemarks = get(node, 'Placemark');
        for (var i = 0; i < placemarks.length; i++) {
            var placemark = kmlPlacemark(placemarks[i]);
            if (placemark) features.push(placemark);
        }
        var folders = get(node, 'Folder');
        for (var j = 0; j < folders.length; j++) {
            var folder = kmlFolder(folders[j]);
            if (folder && folder.features) features = features.concat(folder.features);
        }
        var documents = get(node, 'Document');
        for (var k = 0; k < documents.length; k++) {
            var document = kmlDocument(documents[k]);
            if (document && document.features) features = features.concat(document.features);
        }
        return {
            type: 'FeatureCollection',
            features: features.filter(Boolean)
        };
    }

    function kmlDocument(node) {
        return kmlFolder(node);
    }

    // GPX-specific functions
    function gpxCoord(node) {
        return [
            parseFloat(node.getAttribute('lon')),
            parseFloat(node.getAttribute('lat')),
            nodeVal(get1(node, 'ele')) || null,
            nodeVal(get1(node, 'time')) || null
        ].filter(function(x) { return x !== null; });
    }

    function gpxTrk(node) {
        var segments = get(node, 'trkseg');
        var multi = [];
        for (var i = 0; i < segments.length; i++) {
            var pts = get(segments[i], 'trkpt');
            var line = [];
            for (var j = 0; j < pts.length; j++) {
                line.push(gpxCoord(pts[j]));
            }
            multi.push(line);
        }
        return {
            type: 'Feature',
            properties: getAny(node, ['name', 'cmt', 'desc', 'src', 'link', 'number', 'type']),
            geometry: {
                type: (multi.length === 1) ? 'LineString' : 'MultiLineString',
                coordinates: (multi.length === 1) ? multi[0] : multi
            }
        };
    }

    function gpxWpt(node) {
        return {
            type: 'Feature',
            properties: getAny(node, ['name', 'cmt', 'desc', 'src', 'link', 'sym', 'type']),
            geometry: {
                type: 'Point',
                coordinates: gpxCoord(node)
            }
        };
    }

    function gpxRte(node) {
        var pts = get(node, 'rtept');
        var line = [];
        for (var i = 0; i < pts.length; i++) {
            line.push(gpxCoord(pts[i]));
        }
        return {
            type: 'Feature',
            properties: getAny(node, ['name', 'cmt', 'desc', 'src', 'link', 'number', 'type']),
            geometry: {
                type: 'LineString',
                coordinates: line
            }
        };
    }

    // Main data parsing functions
    function kmlData(doc) {
        var features = [];
        // Get all top-level Placemarks, Folders, and Documents directly under <kml>
        var placemarks = get(doc, 'Placemark');
        for (var i = 0; i < placemarks.length; i++) {
            var placemark = kmlPlacemark(placemarks[i]);
            if (placemark) features.push(placemark);
        }

        var folders = get(doc, 'Folder');
        for (var j = 0; j < folders.length; j++) {
            var folder = kmlFolder(folders[j]);
            if (folder && folder.features) features = features.concat(folder.features);
        }

        var documents = get(doc, 'Document');
        for (var k = 0; k < documents.length; k++) {
            var document = kmlDocument(documents[k]);
            if (document && document.features) features = features.concat(document.features);
        }

        // Handle cases where the root element itself is a Document or Folder
        var rootElement = doc.documentElement;
        if (rootElement && rootElement.nodeName === 'kml') {
            var topLevelDocument = get1(rootElement, 'Document');
            if (topLevelDocument) {
                var docFeatures = kmlDocument(topLevelDocument).features;
                if (docFeatures) {
                    features = features.concat(docFeatures);
                }
            }
            var topLevelFolder = get1(rootElement, 'Folder');
            if (topLevelFolder) {
                var folderFeatures = kmlFolder(topLevelFolder).features;
                if (folderFeatures) {
                    features = features.concat(folderFeatures);
                }
            }
        }

        return {
            type: 'FeatureCollection',
            features: features.filter(Boolean)
        };
    }

    function gpxData(doc) {
        var features = [];
        var trks = get(doc, 'trk');
        for (var i = 0; i < trks.length; i++) {
            var trk = gpxTrk(trks[i]);
            if (trk) features.push(trk);
        }
        var wpts = get(doc, 'wpt');
        for (var j = 0; j < wpts.length; j++) {
            var wpt = gpxWpt(wpts[j]);
            if (wpt) features.push(wpt);
        }
        var rtes = get(doc, 'rte');
        for (var k = 0; k < rtes.length; k++) {
            var rte = gpxRte(rtes[k]);
            if (rte) features.push(rte);
        }
        return {
            type: 'FeatureCollection',
            features: features.filter(Boolean)
        };
    }

    // Export the toGeoJSON object
    var toGeoJSON = {
        kml: kmlData,
        gpx: gpxData
    };

    if (typeof module !== 'undefined') {
        module.exports = toGeoJSON;
    } else {
        window.togeojson = toGeoJSON;
    }

})();
