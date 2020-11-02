import React, { useEffect, useState, useRef } from 'react';
import { connect } from "react-redux";
import { Gantry } from '../../json/Gantry';
import { GantryCoordinates } from '../../json/GantryCoordinates';
import * as turf from '@turf/turf';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css'
import { makeStyles } from '@material-ui/core/styles';
import { Paper, IconButton, Typography, Container, Slide, Dialog, Button} from '@material-ui/core';
import { ChevronLeft, ChevronRight } from '@material-ui/icons';
import { overrideUserLocation, toggleRoutePlanner,toggleMapPicker, returnMapPickerResult } from '../../Action/HomeActions';
import { getTrafficImages, getErpData, updateCameraMarkers, updateLineString, updateNextCamera } from '../../Action/MapActions';
import { tripSummary, mapMatching, updateSteps, reroute, planRoute, cancelRoute, processEndLocation,
    processStartLocation, filterRouteErp } from '../../Action/NavigationActions';
import { loadHistory, saveHistory } from '../../Action/FirebaseAction';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const useStyles = makeStyles((theme) => ({
    turnInstruction: {
        position: 'fixed',
        width: "100%",
        zIndex: '5',
        flexGrow: 1,
        textAlign: 'center',
        padding: 5,
    },
    instr: {
        flexGrow: 1,
    },
    stepsButton: {
        marginRight: theme.spacing(2),
    },
}));

const mapStateToProps = (state) => {
    const appState = {
        userLocation: state.HomeReducer.userLocation,
        navigationRoute: state.NavigationReducer.navigationRoute,
        startLocation: state.NavigationReducer.startLocation,
        endLocation: state.NavigationReducer.endLocation,
        mapMatchedRoute: state.NavigationReducer.mapMatchedRoute,
        cameras: state.MapReducer.cameras,
        ERP: state.MapReducer.ERP,
        cameraMarkers: state.MapReducer.cameraMarkers,
        stepNo: state.NavigationReducer.stepNo,
        routeInstruction: state.NavigationReducer.routeInstruction,
        lineString: state.MapReducer.lineString,
        onRoute: state.NavigationReducer.onRoute,
        user: state.FirebaseReducer.user,
        routeName: state.NavigationReducer.routeName,
        tripSummaryView: state.NavigationReducer.tripSummaryView,
        mapPickerMode: state.HomeReducer.mapPickerMode,
    };
    return appState;
};

function mapDispatchToProps(dispatch) {
    return {
        overrideUserLocation: newCoords => dispatch(overrideUserLocation(newCoords)),
        getTrafficImages: () => dispatch(getTrafficImages()),
        getErpData: () => dispatch(getErpData()),
        tripSummary: () => dispatch(tripSummary()),
        mapMatching: routeCoordinates => dispatch(mapMatching(routeCoordinates)),
        updateCameraMarkers: cameraMarker => dispatch(updateCameraMarkers(cameraMarker)),
        updateSteps: stepNo => dispatch(updateSteps(stepNo)),
        updateLineString: lineString => dispatch(updateLineString(lineString)),
        reroute: (userLocation, endLocation) => dispatch(reroute(userLocation, endLocation)),
        planRoute: (startLocation, endLocation) => dispatch(planRoute(startLocation, endLocation)),
        cancelRoute: () => dispatch(cancelRoute()),
        processStartLocation: startLocation => dispatch(processStartLocation(startLocation)),
        processEndLocation: endLocation => dispatch(processEndLocation(endLocation)),
        updateNextCamera: cameraArr => dispatch(updateNextCamera(cameraArr)),
        filterRouteErp: filteredErp => dispatch(filterRouteErp(filteredErp)),
        saveHistory: route => dispatch(saveHistory(route)),
        loadHistory: userId => dispatch(loadHistory(userId)),
        tripSummary: () => dispatch(tripSummary()),
        toggleRoutePlanner: () => dispatch(toggleRoutePlanner()),
        toggleMapPicker: () => dispatch(toggleMapPicker()),
        returnMapPickerResult: payload => dispatch(returnMapPickerResult(payload)),
    }
}

/* *
   * 
   * Map components handle events related to the map generated by MapboxApi. Routes set by user
   * will be drawn out on the map here and traffic images will be retrieved from govtech and placed
   * here as well
   * 
   * @Koh Tong Liang
   * @Version 1.0
   * @Since 19/10/2018
   * */
function MapBoxView(props) {
    const [map, setMap] = useState(null);
    const [stepMarkers, setStepMarkers] = useState([]);
    const [erpMarkers, setErpMarkers] = useState([]);
    const [pinnedCameraMarkers, setPinnedCameraMarkers] = useState([]);
    const [erpInRoute, setErpInRoute] = useState([]);
    const [userMarker, setUserMarker] = useState(null)
    const mapContainer = useRef("");
    var marker = new mapboxgl.Marker();
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;
    const classes = useStyles();

    useEffect(() => {
        props.getErpData();
        props.getTrafficImages();
    }, []);

    useEffect(() => {
        if (props.user !== null) {
            props.loadHistory({ userId: props.user.uid });
        }
    }, [props.user])

    useEffect(() => {
        if (props.mapPickerMode) {
            map.on('click', (e) => {
                props.returnMapPickerResult([{lng: e.lngLat.lng, lat: e.lngLat.lat}]);
            });
        } else if (map !== null) {
            /**
             * Reset DEBUGGING action listener
             */
            map.on('click', (e) => {
                /*
                * FOR DEBUGGING and DEMO only
                * on click set user current location
                * used as temporary override user location
                */
                props.overrideUserLocation({
                    lng: e.lngLat.lng,
                    lat: e.lngLat.lat,
                });
            });
        }
    }, [props.mapPickerMode])

    /* *
     * MAP INIT
     * Create a map object, and load it into the component. Render it.
     * Maybe move this to a middleware.
     * 
     * @Koh Tong Liang
     * @Version 1.0
     * @Since 19/10/2020
     * */
    useEffect(() => {
        // init map function
        const initializeMap = ({ setMap, mapContainer }) => {
            const map = new mapboxgl.Map({
                container: mapContainer.current,
                style: "mapbox://styles/mapbox/streets-v11", // stylesheet location
                center: [103.6831, 1.3483],
                zoom: 17,
                pitch: 45,
            });

            map.on("load", () => {
                // Insert the layer beneath any symbol layer.
                var layers = map.getStyle().layers;
                var labelLayerId;
                for (var i = 0; i < layers.length; i++) {
                    if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                        labelLayerId = layers[i].id;
                        break;
                    }
                }

                // Code for making the buildings look 3D on the map
                map.addLayer({
                    'id': '3d-buildings',
                    'source': 'composite',
                    'source-layer': 'building',
                    'filter': ['==', 'extrude', 'true'],
                    'type': 'fill-extrusion',
                    'minzoom': 15,
                    'paint': {
                        'fill-extrusion-color': '#aaa',

                        // use an 'interpolate' expression to add a smooth transition effect to the
                        // buildings as the user zooms in
                        'fill-extrusion-height': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'height']
                        ],
                        'fill-extrusion-base': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'min_height']
                        ],
                        'fill-extrusion-opacity': 0.6
                    }
                }, labelLayerId);

                // map.addSource("my_data", {
                //     'type': "geojson",
                //     'data': Gantry[0]
                // });
                // map.addLayer({
                //     'id': 'erp',
                //     'type': 'line',
                //     'source': 'my_data',
                //     'layout': {
                //         'line-join': 'round',
                //         'line-cap': 'round'
                //     },
                //     'paint': {
                //         'line-color': '#000000',
                //         'line-width': 5
                //     }
                // });

                setMap(map);
                map.resize();
            });

            map.on('click', (e) => {
                /*
                * FOR DEBUGGING and DEMO only
                * on click set user current location
                * used as temporary override user location
                */
                props.overrideUserLocation({
                    lng: e.lngLat.lng,
                    lat: e.lngLat.lat,
                });
            });
        };

        if (!map) {
            // if map not yet initialized, initialize it
            initializeMap({ setMap, mapContainer });
        }
    }, [map]);

/* *
    * USER LOCATION CHANGE
    * When userlocation change, detect if user has reach waypoint, if user has reach the
    * waypoint, remove the marker on the waypoint and progress to next step in step by step
    * instruction
    * 
    * @Koh Tong Liang
    * @Version 1.0
    * @Since 19/10/2020
    * */
    useEffect(() => {
        if (map != null && props.userLocation.length > 0) {
            map.flyTo({
                center: [props.userLocation[0].lng, props.userLocation[0].lat]
            });

            if (userMarker !== null) {
                userMarker.remove();
            }

            // detect if user out of route
            if (props.onRoute) {
                const routeOnMap = turf.lineString(props.navigationRoute[0].data.routes[0].geometry.coordinates);
                const userLocation = turf.point([props.userLocation[0].lng, props.userLocation[0].lat]);
                const distance = turf.nearestPointOnLine(routeOnMap, userLocation, { units: 'metres' });
                if (distance.properties.dist > 100) {
                    // if user is 100m off the plotted route, do a reroute
                    const endLocation = props.endLocation;
                    props.cancelRoute();
                    props.processStartLocation(props.userLocation);
                    props.processEndLocation(endLocation);
                    props.planRoute(props.userLocation, endLocation);
                }
            } // end of onroute

            // detect if user passed a camera location
            let tolerance = 0.0005;
            if (props.cameraMarkers.length > 0) {
                let user = props.userLocation[0];
                let nextCamera = props.cameraMarkers[0].camera.location;
                if ((user.lng - nextCamera.longitude <= tolerance &&
                    user.lng - nextCamera.longitude >= -tolerance) &&
                    (user.lat - nextCamera.latitude <= tolerance &&
                        user.lat - nextCamera.latitude >= -tolerance)) {
                    // update cameramarker state
                    // remove cameras as they pass through
                    let a = props.cameraMarkers;
                    a.splice(0, 1);
                    props.updateNextCamera(a);
                }
            }

            marker.setLngLat([props.userLocation[0].lng, props.userLocation[0].lat]);
            const stepNo = props.stepNo;
            if (marker !== undefined && stepMarkers[stepNo] !== undefined) {
                // detect if user has reached a checkpoint
                if ((marker.getLngLat().lng - stepMarkers[stepNo].getLngLat().lng <= tolerance &&
                    marker.getLngLat().lng - stepMarkers[stepNo].getLngLat().lng >= -tolerance) &&
                    (marker.getLngLat().lat - stepMarkers[stepNo].getLngLat().lat <= tolerance &&
                        marker.getLngLat().lat - stepMarkers[stepNo].getLngLat().lat >= -tolerance)) {
                    stepMarkers[stepNo].remove();

                    if (props.stepNo < props.routeInstruction.length - 1) {
                        props.updateSteps(props.stepNo + 1);
                    } else {
                        // User reaches end of the route
                        // map.removeLayer('LineString');
                        if (props.user !== null) {
                            props.saveHistory({
                                userId: props.user.uid,
                                navigationRoute: props.navigationRoute,
                                routeName: props.routeName,
                                startLocation: props.startLocation,
                                endLocation: props.endLocation,
                            });
                        }

                        clearMap();
                        props.tripSummary();
                    }
                }
            } //
            marker.addTo(map);
            setUserMarker(marker);
        }
    }, [props.userLocation])

  /* *
     * ROUTE PLOTTING
     * When a route has been set, run the following code.
     */
    useEffect(() => {
        if (props.navigationRoute !== [] && props.navigationRoute.length > 0) {
            map.flyTo({
                center: [props.startLocation[0].lng, props.startLocation[0].lat]
            });

            // setting up path
            var steps = 1;
            props.navigationRoute[0].data.routes[0].legs[0].steps.forEach(instruction => {
                var el = document.createElement('div');
                el.className = 'marker';
                el.style.backgroundColor = "black";
                el.style.textAlign = "center";
                el.textContent = steps;
                el.style.width = '30px';
                el.style.height = '30px';

                let step = new mapboxgl.Marker(el);
                step.setLngLat(instruction.maneuver.location);
                step.addTo(map);
                setStepMarkers(stepMarkers => [...stepMarkers, step]);
                steps++;
            });

            // display step by step instruction
            // plotting route on the map
            var coordinates = props.navigationRoute[0].data.routes[0].geometry;
            map.addSource('LineString', {
                'type': 'geojson',
                'data': coordinates
            });
            map.addLayer({
                'id': 'LineString',
                'type': 'line',
                'source': 'LineString',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#000000',
                    'line-width': 5
                }
            });

            // Detect if there is any traffic cameras on the way
            let cameraArr = [];

            let pivotLocation = {};
            if (props.userLocation.length > 0) {
                pivotLocation = props.userLocation[0];
            } else {
                pivotLocation = props.startLocation[0];
            }

            // process through all the cameras and store necessary cameras in a state
            props.cameras.map(c => {
                var cameraPosition = { lng: c.location.longitude, lat: c.location.latitude };
                // detect if route plot by mapbox intersects position of camera
                var points = turf.lineIntersect(turf.lineString(coordinates.coordinates), turf.polygon([[[cameraPosition.lng + 0.0005, cameraPosition.lat],
                [cameraPosition.lng, cameraPosition.lat + 0.0005], [cameraPosition.lng - 0.0005, cameraPosition.lat], [cameraPosition.lng, cameraPosition.lat - 0.0005], [cameraPosition.lng + 0.0005, cameraPosition.lat]]]));
                if (points.features.length > 0) {
                    var el = document.createElement('img');
                    el.src = c.image;
                    el.style.textAlign = "center";
                    el.style.width = '80px';
                    el.style.height = '80px';

                    let cameraMarker = new mapboxgl.Marker(el);
                    cameraMarker.setLngLat(cameraPosition);
                    cameraMarker.addTo(map);
                    setPinnedCameraMarkers(pinnedCameraMarkers => [...pinnedCameraMarkers, cameraMarker]);
                    const distance = turf.distance(turf.point([pivotLocation.lng, pivotLocation.lat]), turf.point([cameraPosition.lng, cameraPosition.lat]), { units: 'metres' });
                    cameraArr.push({ camera: c, dist: distance });
                }
            });
            // store only cameras on the route to destination
            cameraArr.sort(function (a, b) {
                return a.dist - b.dist;
            });
            props.updateCameraMarkers(cameraArr);

            // process erp data
            // take id and location of GantryCoordinates and plot stuff
            // GantryCoordinates {id,coordinates}
            // props.ERP {}
            let routeErps = [];
            var d = new Date();
            var currentDayType = '';
            if (d.getDay() === 0 || d.getDay() === 6) {
                currentDayType = 'Weekdays';
            } else {
                currentDayType = 'Weekends';
            }
            GantryCoordinates.map(gantry => {
                const gantryCoordinates = { lng: gantry.coordinates[0], lat: gantry.coordinates[1] };
                var points = turf.lineIntersect(turf.lineString(coordinates.coordinates), turf.polygon([[[gantryCoordinates.lng + 0.0005, gantryCoordinates.lat],
                [gantryCoordinates.lng, gantryCoordinates.lat + 0.0005], [gantryCoordinates.lng - 0.0005, gantryCoordinates.lat], [gantryCoordinates.lng, gantryCoordinates.lat - 0.0005], [gantryCoordinates.lng + 0.0005, gantryCoordinates.lat]]]));
                if (points.features.length > 0) {
                    var el = document.createElement('div');
                    el.className = 'marker';
                    el.style.backgroundColor = "black";
                    el.style.textAlign = "center";
                    el.textContent = 'Zone: ' + gantry.zoneId + " Charge(SGD): 0";
                    el.style.width = '120px';
                    el.style.height = '120px';

                    const distance = turf.distance(turf.point([pivotLocation.lng, pivotLocation.lat]), turf.point([gantryCoordinates.lng, gantryCoordinates.lat]), { units: 'metres' });
                    let abstract = props.ERP;
                    routeErps.push([abstract.filter(e => e.ZoneID === gantry.zoneId), distance]);

                    let erp = new mapboxgl.Marker(el);
                    erp.setLngLat(gantryCoordinates);
                    erp.addTo(map);
                    setErpMarkers(erpMarkers => [...erpMarkers, erp]);
                }
            });

            routeErps.sort(function (a, b) {
                return a[1] - b[1];
            });
            props.filterRouteErp(routeErps);

        } else {
            if (map != null) {
                // end of route, clear everything
                map.removeLayer('LineString');
                map.removeSource('LineString');
                clearMap();
            }
        }
    }, [props.navigationRoute]);

    function clearMap() {
        pinnedCameraMarkers.map(c => {
            c.remove();
        });
        stepMarkers.map(s => {
            s.remove();
        });
        erpMarkers.map(e => {
            e.remove();
        });
        setPinnedCameraMarkers([]);
        setStepMarkers([]);
        setErpMarkers([]);
        props.updateCameraMarkers([]);
        props.filterRouteErp([]);
    }

    return (
        <div>
            <div style={{ zIndex: "-1", position: "absolute", width: '100%', height: '100%', top: 0, bottom: 0 }} ref={el => (mapContainer.current = el)}></div>
            <Dialog
                open={props.tripSummaryView}
                TransitionComponent={Transition}
                keepMounted
                onClose={() => props.tripSummary()}
                aria-labelledby="alert-dialog-slide-title"
                aria-describedby="alert-dialog-slide-description"
            >
                <Container>
                    <form>
                        <Button onClick={() => props.tripSummary()}>You have reached your end point.</Button>
                    </form>
                </Container>
            </Dialog>
        </div>
    )
}

const MapBox = connect(
    mapStateToProps,
    mapDispatchToProps,
)(MapBoxView)

export default MapBox;
