import { domStation, storeStation } from './stateExport.js'
import { updateUI, preloadNext, playTrack } from './function.js'


const { playPauseTrackButton, audioFromTrack, seekBar, volumeBar } = domStation


audioFromTrack.addEventListener('ended', () => 
{
  if (storeStation.isPlayOneTrackMode)
  {
    audioFromTrack.pause()
    audioFromTrack.currentTime = 0

    playPauseTrackButton.textContent = '▶︎'

    console.log('Pausing Track:', (storeStation.tracksArray[storeStation.currentTrackIndex]?.name || 'Unknown'))

    return
  }

  const current = storeStation.tracksArray[storeStation.currentTrackIndex]
  if (current)
  {
    localStorage.setItem('seek_track_' + current.id, 0)
  }

  if (!storeStation.tracksArray.length)
  {
    return
  }

  const nextIndex = ((storeStation.currentTrackIndex + 1) % storeStation.tracksArray.length)
  if (storeStation.nextTrackURL)
  {
    if (!storeStation.nextTrackURL.startsWith('blob:'))
    {
      return
    }

    storeStation.currentTrackIndex = nextIndex

    if (storeStation.currentTrackURL)
    {
      URL.revokeObjectURL(storeStation.currentTrackURL)
    }

    storeStation.currentTrackURL = storeStation.nextTrackURL
    storeStation.nextTrackURL = null

    audioFromTrack.src = storeStation.currentTrackURL
    audioFromTrack.play().catch(() => {})

    audioFromTrack.play().catch(err =>
    {
      console.log('Play Failed:', err)
    })

    updateUI()
    preloadNext()
  }

  else
  {
    playTrack(nextIndex)
    console.log('Playing Next Track:', storeStation.tracksArray[nextIndex].name)
  }
})


audioFromTrack.addEventListener('timeupdate', () => 
{
  if (!Number.isNaN(audioFromTrack.duration)) 
  {
    seekBar.max = audioFromTrack.duration
    seekBar.value = audioFromTrack.currentTime

    if ((storeStation.currentTrackIndex !== -1) && (storeStation.tracksArray[storeStation.currentTrackIndex]))
    {
      const track = storeStation.tracksArray[storeStation.currentTrackIndex]
      localStorage.setItem('seek_track_' + track.id, audioFromTrack.currentTime)
    }
  }
})


audioFromTrack.addEventListener('error', () => 
{
  const error = audioFromTrack.error
  if (!error || (error.code === 1))
  {
    return
  }

  console.log('Audio Error:', error)
})


seekBar.addEventListener('input', () => 
{
  audioFromTrack.currentTime = seekBar.value
})


const savedVolume = (Number(localStorage.getItem('volumeLevel')) || 0.5)
audioFromTrack.volume = savedVolume

volumeBar.value = (savedVolume * 10)
volumeBar.addEventListener('input', () => 
{
  const value = Math.max(0, Math.min(1, Number(volumeBar.value) / 10))
  audioFromTrack.volume = value;

  if ((storeStation.currentTrackIndex !== -1) && storeStation.tracksArray[storeStation.currentTrackIndex])
  {
    const track = storeStation.tracksArray[storeStation.currentTrackIndex]
    localStorage.setItem(('volume_track_' + track.id), value)
  }

  else
  {
    localStorage.setItem('volumeLevel', value);
  }
})