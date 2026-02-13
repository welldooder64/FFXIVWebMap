import MapperRegistry from '@/net/MapperRegistry'
import {
    DiscoveryMask as FBDiscoveryMask,
    DynamicMarker as FBDynamicMarker,
    DynamicMarkerList as FBDynamicMarkerList,
    Location as FBLocation,
    MapData as FBMapData,
    MessageType,
    PlayerTransformAndCameraRotation as FBPlayerTransformAndCameraRotation,
    QuestLinkMarkerList as FBQuestLinkMarkerList,
    SelectedLocation as FBSelectedLocation,
} from '@/net/models'

import mapDiscoveryMask from './discovery-mask'
import mapDynamicMarkerList, { mapDynamicMarker } from './dynamic-marker'
import mapMapData from './map-data'
import mapLocation from './location'
import mapPlayerTransformAndCameraRotation from './player-transform-and-camera-rotation'
import mapQuestLinkMarkerList from './quest-link-marker'
import mapSelectedLocation from './selected-location'

export default new MapperRegistry()
    .register(MessageType.MapData, FBMapData, mapMapData)
    .register(MessageType.PlayerLocation, FBLocation, mapLocation)
    .register(MessageType.PlayerPosition, FBPlayerTransformAndCameraRotation, mapPlayerTransformAndCameraRotation)
    .register(MessageType.SelectedLocation, FBSelectedLocation, mapSelectedLocation)
    .register(MessageType.DiscoveryMask, FBDiscoveryMask, mapDiscoveryMask)
    .register(MessageType.QuestMarkers, FBDynamicMarkerList, mapDynamicMarkerList)
    .register(MessageType.UnacceptedQuestMarkers, FBDynamicMarkerList, mapDynamicMarkerList)
    .register(MessageType.QuestLinkMarkers, FBQuestLinkMarkerList, mapQuestLinkMarkerList)
    .register(MessageType.LevequestMarkers, FBDynamicMarkerList, mapDynamicMarkerList)
    .register(MessageType.ActiveLevequestMarker, FBDynamicMarker, mapDynamicMarker)
    .register(MessageType.GuildLeveAssignmentMarkers, FBDynamicMarkerList, mapDynamicMarkerList)
    .register(MessageType.GuildOrderGuideMarkers, FBDynamicMarkerList, mapDynamicMarkerList)
    .register(MessageType.HousingMarkers, FBDynamicMarkerList, mapDynamicMarkerList)
    .register(MessageType.TripleTriadMarkers, FBDynamicMarkerList, mapDynamicMarkerList)
    .register(MessageType.CustomTalkMarkers, FBDynamicMarkerList, mapDynamicMarkerList)
    .register(MessageType.GemstoneTraderMarkers, FBDynamicMarkerList, mapDynamicMarkerList)
