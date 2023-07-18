const center_x = 117.3;
const center_y = 172.8;
const scale_x = 0.02072;
const scale_y = 0.0205;

CUSTOM_CRS = L.extend({}, L.CRS.Simple, {
    projection: L.Projection.LonLat,
    scale: function(zoom) {

        return Math.pow(2, zoom);
    },
    zoom: function(sc) {

        return Math.log(sc) / 0.6931471805599453;
    },
    distance: function(pos1, pos2) {
        var x_difference = pos2.lng - pos1.lng;
        var y_difference = pos2.lat - pos1.lat;
        return Math.sqrt(x_difference * x_difference + y_difference * y_difference);
    },
    transformation: new L.Transformation(scale_x, center_x, -scale_y, center_y),
    infinite: true
});

var SateliteStyle = L.tileLayer('mapStyles/styleSatelite/{z}/{x}/{y}.jpg', {
        minZoom: 0,
        maxZoom: 8,
        noWrap: true,
        continuousWorld: false,
        attribution: 'Online map GTA V',
        id: 'SateliteStyle map',
    }),
    AtlasStyle = L.tileLayer('mapStyles/styleAtlas/{z}/{x}/{y}.jpg', {
        minZoom: 0,
        maxZoom: 5,
        noWrap: true,
        continuousWorld: false,
        attribution: 'Online map GTA V',
        id: 'styleAtlas map',
    })

var ExampleGroup = L.layerGroup();

var Icons = {
    "Eenheden": ExampleGroup,
};

var map = null;
//Player map markers
var mapPlayer = {};
var layerPlayer = new L.FeatureGroup();

function initMap() {
    // Map bounds (pixels)
    var mapSW = [0, 8192]; // Deepest Z/X/Y.png +1 x 256.
    var mapNE = [8192, 0]; // Deepest Z/X +1 x 256.

    if (map != undefined) {
        map.invalidateSize();
        map.off();
        map.remove();
        map = null;
    }

    map = L.map('GpsMap', {
        crs: CUSTOM_CRS,
        minZoom: 1,
        maxZoom: 5,
        Zoom: 1,
        maxNativeZoom: 5,
        preferCanvas: true,
        layers: [SateliteStyle],
        center: [0, 0],
        zoom: 1,
        attributionControl: false
    });

    map.setMaxBounds(new L.LatLngBounds(
        map.unproject(mapSW, map.getMaxZoom()),
        map.unproject(mapNE, map.getMaxZoom())
    ));

    var layersControl = L.control.layers({
        "Satelite": SateliteStyle,
        "Atlas": AtlasStyle
    }, Icons).addTo(map);

    //Add layers to map.
    layerPlayer.addTo(map);
}

//FUNCTION: Starts the update loop, marks all players as inactive.
function StartUpdateLoop() {
    for (var key in mapPlayer) {
        if (key)
            mapPlayer[key]['used'] = false;
    }
}

//FUNCTION: Consumes an json object and a list with id's to skip this loop and updates the map with it.
function UpdateAllMarkers(data, skip) {
    var dataObject = JSON.parse(data);
    var skipObject = JSON.parse(skip);

    StartUpdateLoop();
    dataObject.forEach(function(item, index) {
        if (!skipObject.includes(item['DiscordId'])) {
            UpdateMapMarker(item['DiscordId'],
                item['X'],
                item['Y'],
                item['Callsign'],
                item['Name'],
                item['Specialisaties'],
                item['VehicleType'],
                item['StatusClass']);
        } else {
            RemoveMarker(item["DiscordId"]);
            UpdateMapMarker(item['DiscordId'],
                item['X'],
                item['Y'],
                item['Callsign'],
                item['Name'],
                item['Specialisaties'],
                item['VehicleType'],
                item['StatusClass']);
        }
    });
    FinishUpdateLoop();
}

//FUNCTION: Update an already existing marker on the map, if it not exists it should add it. Also marks the player as active.
function UpdateMapMarker(id, x, y, service, name, spec, vehType, statusClass) {
    //Calculate marker position.
    var markerPos = L.latLng([parseFloat(y), parseFloat(x)]);

    if (id in mapPlayer) {
        //Create new marker at position
        mapPlayer[id]['marker'].setLatLng(markerPos, {
            draggable: false,
            autoPan: true
        }).update();

        //Mark marker as used
        mapPlayer[id]['used'] = true;
    } else {
        //Init marker
        mapPlayer[id] = {};

        if (vehType == "norm") {
            mapPlayer[id]['marker'] = new L.marker(markerPos, {
                icon: new L.DivIcon({
                    className: 'mapUnitInteractive ' + statusClass,
                    html: '<h5 class="mapUnitText text-white text-center">' + service.toString() + '</h5>',
                    iconSize: [35, 30],
                    draggable: false,
                    autoPan: true,
                    iconAnchor: [18, 30]
                })
            });
        } else {
            mapPlayer[id]['marker'] = new L.marker(markerPos, {
                icon: new L.DivIcon({
                    className: 'mapUnitInteractive fas ' + statusClass,
                    html: '<h5 class="mapUnitText text-white text-center">' + service.toString() + '</h5>',
                    iconSize: [35, 30],
                    draggable: false,
                    autoPan: true,
                    iconAnchor: [18, 30]
                })
            });
        }

        //Add marker to layer
        layerPlayer.addLayer(mapPlayer[id]['marker']);

        //Set popup
        mapPlayer[id]['marker'].bindPopup("<b>" + service + "</b><br>Naam: " + name + ".");

        //Mark marker as used
        mapPlayer[id]['used'] = true;
    }
}

//FUNCTION: Loop trough all player markers and delete the inactive ones.
function FinishUpdateLoop() {
    for (var key in mapPlayer) {
        if (key)
            if (!mapPlayer[key]['used']) {
                RemoveMarker(key);
            }
    }
}

function RemoveMarker(key) {
    map.removeLayer(mapPlayer[key]['marker']);
    delete mapPlayer[key];
}