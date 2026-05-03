import { domStation, storeStation } from './stateExport.js'


const 
{
  playOneSongButton,
  searchTrackBar,
  uploadTrack,

  playPreviousTrackButton,
  playPauseTrackButton,
  playNextTrackButton,

  audioFromTrack,

  volumeBar,
  seekBar,

  userPlaylistLayout,
} = domStation


Object.assign(domStation, 
{
  playOneSongButton,
  searchTrackBar,
  uploadTrack,

  playPreviousTrackButton,
  playPauseTrackButton,
  playNextTrackButton,

  audioFromTrack,

  volumeBar,
  seekBar,

  userPlaylistLayout,
})


storeStation.tracksArray = []
storeStation.trackMetadataArray = []

storeStation.currentTrackIndex = -1
storeStation.currentTrackURL = null
storeStation.nextTrackURL = null

storeStation.playlistDB = null
storeStation.loadToken = 0
storeStation.preloadToken = 0

storeStation.isPlaylistLoaded = false
storeStation.isTrackFound = false
storeStation.searchTrackTimeout = null

storeStation.volumeBeforeMute = null
storeStation.isPlayOneTrackMode = false
storeStation.userInteractedEarly = false