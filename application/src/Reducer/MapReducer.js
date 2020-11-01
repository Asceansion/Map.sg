import { GET_TRAFFIC_IMAGES_SUCCEEDED, GET_ERP_DATA_SUCCEEDED, UPDATE_STEPS, UPDATE_CAMERA_MARKERS, UPDATE_LINE_STRING, UPDATE_NEXT_CAMERA } from '../Constants/actionTypes';
/**
 * Map Reducer serves to update the state as certain actions are
 * 
 * @Koh Tong Liang
 * @Version 1
 * @Since 30/10/2020
*/

const initialState = {
    cameras: [],
    cameraMarkers: [],
    ERP: [],
    lineString: [],
}

export default function MapReducer (state = initialState, action) {
    // determine what action to perform and which state to update
    switch (action.type) {
        case UPDATE_CAMERA_MARKERS:
            return Object.assign({}, state, {
                cameraMarkers: initialState.cameraMarkers.concat(action.payload)
            });
        case GET_TRAFFIC_IMAGES_SUCCEEDED:
            return Object.assign({}, state, {
                cameras: initialState.cameras.concat(action.payload)
            });
        case GET_ERP_DATA_SUCCEEDED:
            return Object.assign({}, state, {
                ERP: initialState.ERP.concat(action.payload)
            });
        case UPDATE_LINE_STRING:
            return Object.assign({}, state, {
                lineString: initialState.lineString.concat(action.payload)
            });
        case UPDATE_NEXT_CAMERA:
            return Object.assign({}, state, {
                cameraMarkers: initialState.cameraMarkers.concat(action.payload)
            });
        default:
    }

    return state;
}