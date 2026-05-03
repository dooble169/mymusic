import { domStation, storeStation } from './stateExport.js'


export const noResultsLayout = document.createElement('li')
noResultsLayout.classList.add('no-results-layout')
noResultsLayout.textContent = 'No Results...'
noResultsLayout.style.display = 'none'


const 
{
  searchTrackBar,
  audioFromTrack,

  playPauseTrackButton,

  volumeBar,
  seekBar,

  userPlaylistLayout,
} = domStation


export function loadPlaylist() 
{
  searchTrackBar.value = ''

  storeStation.tracksArray = []
  storeStation.trackMetadataArray = []

  storeStation.loadToken++
  storeStation.preloadToken++

  storeStation.isPlaylistLoaded = false
  storeStation.userInteractedEarly = false

  userPlaylistLayout.innerHTML = ''
  userPlaylistLayout.appendChild(noResultsLayout)

  const transaction = storeStation.playlistDB.transaction('tracks', 'readonly')
  const trackStore = transaction.objectStore('tracks')

  trackStore.openCursor().onsuccess = event => 
  {
    const cursor = event.target.result
    if (cursor) 
    {
      const track = cursor.value
      storeStation.tracksArray.push ({
        id: track.id,
        name: track.name.replace(/\.(mp3|mp4)$/i, ''),
        type: track.type,
      })

      const li = document.createElement('li')
      li.textContent = track.name.replace(/\.(mp3|mp4)$/i, '')
      const index = (storeStation.tracksArray.length - 1)
      li.onclick = () => 
      {
        const isSameTrack = (storeStation.currentTrackIndex === index)
        if (isSameTrack && !audioFromTrack.paused)
        {
          console.log('Track Already Playing!')
          return
        }

        playTrack(index)
      }

      const wrap = document.createElement('div')
      wrap.className = 'delete-track-button-wrapper'

      const deleteTrackButton = document.createElement('button')
      deleteTrackButton.classList.add('delete-track-button') 
      deleteTrackButton.onclick = event => deleteTrack(event, track.id)

      const wrapDeleteTrackIcon = document.createElement('div')
      wrapDeleteTrackIcon.className = 'delete-track-icon'

      deleteTrackButton.appendChild(wrapDeleteTrackIcon)
      wrap.appendChild(deleteTrackButton)
      li.appendChild(wrap)

      userPlaylistLayout.appendChild(li)
      storeStation.trackMetadataArray.push(li)

      cursor.continue()  
    } 
    
    else 
    {
      setTimeout(() => 
      {
        restoreLastTrack()
      }, 50)
      
      storeStation.isPlaylistLoaded = true

      if (searchTrackBar.value.length > 0) 
      {
        const inputEvent = new Event('input')
        searchTrackBar.dispatchEvent(inputEvent)
      }
    }
  }
}


export function saveTrack(file) 
{
  return new Promise(resolve => 
  {
    const transaction = storeStation.playlistDB.transaction('tracks', 'readwrite')
    const trackStore = transaction.objectStore('tracks')
    const checkRequest = trackStore.getAll()

    checkRequest.onsuccess = () => 
    {
      if (checkRequest.result.some(t => t.name === file.name))
      {
        return resolve()
      }

      trackStore.add ({
        name: file.name,
        data: file,
        type: file.type,
      })

      transaction.oncomplete = resolve
    }
  })
}


export function getTrackData(id)
{
  return new Promise(resolve => 
  {
    const transaction = storeStation.playlistDB.transaction('tracks', 'readonly')
    const trackStore = transaction.objectStore('tracks')
    const request = trackStore.get(id)

    request.onsuccess = event => resolve(event.target.result)
    request.onerror = () => resolve(null)
  })
}


export function playTrackById(id) 
{
  storeStation.userInteractedEarly = true

  const index = storeStation.tracksArray.findIndex(t => t.id === id)
  if (index !== -1) 
  {
    playTrack(index)
    console.log('Playing:', storeStation.tracksArray[index].name)
  }
}


export function restoreLastTrack() 
{
  if (storeStation.userInteractedEarly)
  {
    return
  }

  const savedIndex = Number(localStorage.getItem('lastSongIndex'))
  if 
  (
    (!Number.isNaN(savedIndex))
    &&
    (savedIndex >= 0)
    &&
    (savedIndex < storeStation.tracksArray.length)
  )
  {
    playTrack(savedIndex)
    console.log('Restoring Last Played Song:', storeStation.tracksArray[savedIndex].name)
  }
}


export async function playTrack(index) 
{
  if (storeStation.isPlayOneTrackMode)
  {
    return
  }

  const token = ++storeStation.loadToken
  const meta = storeStation.tracksArray[index]

  if (!meta)
  {
    return
  }

  audioFromTrack.pause()
  audioFromTrack.removeAttribute('src')
  audioFromTrack.load()

  if (token !== storeStation.loadToken)
  {
    return
  }

  const track = await getTrackData(meta.id)
  if (!track?.data) 
  {
    console.error('Invalid Audio Data!')
    console.log('Invalid Audio Data!')

    return
  }

  if (storeStation.currentTrackURL)
  {
    URL.revokeObjectURL(storeStation.currentTrackURL)
  }

  const savedSeek = Number(localStorage.getItem('seek_track_' + meta.id))
  if (!Number.isNaN(savedSeek))
  {
    audioFromTrack.currentTime = savedSeek
  }

  const blob = (track.data instanceof Blob) ? (track.data) : (new Blob([track.data], { type: meta.type }))
  storeStation.currentTrackURL = URL.createObjectURL(blob)

  audioFromTrack.src = storeStation.currentTrackURL
  audioFromTrack.play().catch(() => {})

  storeStation.currentTrackIndex = index
  playPauseTrackButton.textContent = '❚❚'

  const savedVolumeStr = localStorage.getItem('volume_track_' + meta.id)
  if (savedVolumeStr === null) 
  {
    const globalVolume = (Number(localStorage.getItem('volumeLevel')) || 0.5)
    audioFromTrack.volume = globalVolume
    volumeBar.value = (globalVolume * 10)
  } 
  
  else 
  {
    const savedSongVolume = Number(savedVolumeStr)
    audioFromTrack.volume = savedSongVolume
    volumeBar.value = (savedSongVolume * 10)
  }

  const name = meta.name.replace(/\.(mp3|mp4)$/i, '')
  document.title = name
  document.getElementById('trackNameWrapper').textContent = name

  localStorage.setItem('lastSongIndex', index)

  storeStation.trackMetadataArray.forEach(item => item.classList.remove('active-track'))
  if (storeStation.trackMetadataArray[index]) 
  {
    storeStation.trackMetadataArray[index].classList.add('active-track')
  }
  
  preloadNext()
  updateUI()
}


export function preloadNext() 
{
  if (storeStation.tracksArray.length < 2)
  {
    return
  }

  const token = ++storeStation.preloadToken
  const nextIndex = ((storeStation.currentTrackIndex + 1) % storeStation.tracksArray.length)
  const nextMeta = storeStation.tracksArray[nextIndex]

  getTrackData(nextMeta.id).then(track => 
  {
    if ((token !== storeStation.preloadToken) || (!track?.data))
    {
      return
    }

    if (storeStation.nextTrackURL)
    {
      URL.revokeObjectURL(storeStation.nextTrackURL)
    }

    try 
    {
      const blob = (track.data instanceof Blob) ? (track.data) : (new Blob([track.data], { type: nextMeta.type }))
      storeStation.nextTrackURL = URL.createObjectURL(blob)
    }
    
    catch (error) 
    {
      storeStation.nextTrackURL = null
      console.error('Preload Error:', error)
    }
  })
}


export function deleteTrack(event, id) 
{
  event.stopPropagation()

  const indexToDelete = storeStation.tracksArray.findIndex(t => t.id === id)
  if (indexToDelete === -1)
  {
    return
  }

  const isCurrent = (indexToDelete === storeStation.currentTrackIndex)
  if (!confirm('Delete This Track?'))
  {
    return
  }

  const transaction = storeStation.playlistDB.transaction('tracks', 'readwrite')
  transaction.objectStore('tracks').delete(id)
  transaction.oncomplete = () => 
  {
    if (storeStation.currentTrackURL) 
    {
      URL.revokeObjectURL(storeStation.currentTrackURL)
      storeStation.currentTrackURL = null
    }

    if (storeStation.nextTrackURL) 
    {
      URL.revokeObjectURL(storeStation.nextTrackURL)
      storeStation.nextTrackURL = null
    }

    if (isCurrent && (storeStation.tracksArray.length > 1)) 
    {
      const nextIndex = (indexToDelete >= (storeStation.tracksArray.length - 1)) ? (0) : (indexToDelete)
      loadPlaylist()
      setTimeout(() => playTrack(nextIndex), 40)
    }

    else 
    {
      audioFromTrack.pause()
      audioFromTrack.src = ''

      storeStation.currentTrackIndex = -1
      loadPlaylist()
    }
  }
}


function clampCardToScreen() 
{
  const userControlsLayout = document.querySelector('.user-controls-layout')
  const rectangle = userControlsLayout.getBoundingClientRect()

  let newLeft = rectangle.left
  let newTop = rectangle.top

  if (rectangle.left < 0)
  {
    newLeft = 0
  }

  if (rectangle.top < 0) 
  {
    newTop = 0
  }

  if (rectangle.right > window.innerWidth)
  {
    newLeft = (window.innerWidth - rectangle.width)
  }

  if (rectangle.bottom > window.innerHeight)
  {
    newTop = (window.innerHeight - rectangle.height)
  }

  userControlsLayout.style.left = (newLeft + 'px')
  userControlsLayout.style.top = (newTop + 'px')

  localStorage.setItem("controlsPos", JSON.stringify ({
    left: userControlsLayout.style.left,
    top: userControlsLayout.style.top
  }))
}


window.addEventListener('resize', clampCardToScreen)
window.addEventListener('load', clampCardToScreen)


storeStation.volumeBeforeMute = (storeStation.volumeBeforeMute) ?? (audioFromTrack.volume)
document.addEventListener('keydown', event =>
{
  if (event.target.matches('input, textarea, [contenteditable="true"]'))
  {
    return
  }

  if (event.key === 'ArrowUp') 
  {        
    event.preventDefault()
    domStation.playPreviousTrackButton.click()

    console.log('Playing Previous Track:', (storeStation.tracksArray[((storeStation.currentTrackIndex - 1) + storeStation.tracksArray.length) % storeStation.tracksArray.length].name))
  }

  else if (event.key === 'ArrowDown') 
  {
    event.preventDefault()
    domStation.playNextTrackButton.click()

    console.log('Playing Next Track:', (storeStation.tracksArray[(storeStation.currentTrackIndex + 1) % storeStation.tracksArray.length].name))
  }

  else if ((event.key === 'ArrowLeft') && event.shiftKey)
  {
    event.preventDefault();

    let newVolume = (audioFromTrack.volume - 0.01)
    if (newVolume < 0)
    {
      newVolume = 0
    }

    audioFromTrack.volume = newVolume
    volumeBar.value = newVolume

    localStorage.setItem(('volume_track_' + storeStation.tracksArray[storeStation.currentTrackIndex]?.id), newVolume)
    
    console.log('Volume Down:', (Math.round(newVolume * 100) + '%'))
  }

  else if ((event.key === 'ArrowRight') && event.shiftKey)
  {
    event.preventDefault();

    let newVolume = (audioFromTrack.volume + 0.01)
    if (newVolume > 1)
    {
      newVolume = 1
    }

    audioFromTrack.volume = newVolume
    volumeBar.value = newVolume

    localStorage.setItem(('volume_track_' + storeStation.tracksArray[storeStation.currentTrackIndex]?.id), newVolume)
    
    console.log('Volume Up:', (Math.round(newVolume * 100) + '%'))
  }

  else if (event.key === 'ArrowLeft')
  {
    event.preventDefault();

    let newSeek = (audioFromTrack.currentTime - 5)
    if (newSeek < 0)
    {
      newSeek = 0
    }

    audioFromTrack.currentTime = newSeek
    seekBar.value = newSeek

    console.log('Seek Backward:', (Math.round(newSeek) + ' seconds'))
  }

  else if (event.key === 'ArrowRight')
  {
    event.preventDefault()

    let newSeek = (audioFromTrack.currentTime + 5)
    if (newSeek > audioFromTrack.duration)
    {
      newSeek = audioFromTrack.duration
    }

    audioFromTrack.currentTime = newSeek
    seekBar.value = newSeek

    console.log('Seek Forward:', Math.round(newSeek) + ' seconds')
  }


  else if (event.code === 'Space')
  {
    event.preventDefault()

    if (audioFromTrack.paused)
    {
      audioFromTrack.play()
      playPauseTrackButton.textContent = '❚❚'

      console.log('Playing:', (storeStation.tracksArray[storeStation.currentTrackIndex]?.name || 'Unknown'))
    }

    else
    {
      audioFromTrack.pause()
      playPauseTrackButton.textContent = '▶︎'

      console.log('Pausing:', (storeStation.tracksArray[storeStation.currentTrackIndex]?.name || 'Unknown'))
    }
  }

  else if (event.key === 'm')
  {
    event.preventDefault()

    if (audioFromTrack.volume > 0)
    {
      storeStation.volumeBeforeMute = audioFromTrack.volume

      audioFromTrack.volume = 0
      volumeBar.value = 0

      console.log('Track Muted!')
    }

    else
    {
      const restored = (storeStation.volumeBeforeMute) ?? (Number(localStorage.getItem('volume_track_' + storeStation.tracksArray[storeStation.currentTrackIndex]?.id)))

      audioFromTrack.volume = restored
      volumeBar.value = (restored * 10)

      console.log('Track Unmuted, Volume Restored to:', restored)
    }
  }
})


export function updateUI() 
{
  const meta = storeStation.tracksArray[storeStation.currentTrackIndex]
  if (!meta)
  {
    return
  }

  const name = meta.name.replace(/\.(mp3|mp4)$/i, '')
  document.title = name
  document.getElementById('trackNameWrapper').textContent = name

  storeStation.trackMetadataArray.forEach(item => item.classList.remove('active-track'))
  if (storeStation.trackMetadataArray[storeStation.currentTrackIndex]) 
  {
    storeStation.trackMetadataArray[storeStation.currentTrackIndex].classList.add('active-track')
  }

  if ('mediaSession' in navigator) 
  {
    navigator.mediaSession.setActionHandler('previoustrack', () => 
    {
      domStation.playPreviousTrackButton.click()

      console.log('Playing Previous Track:', (storeStation.tracksArray[((storeStation.currentTrackIndex - 1) + storeStation.tracksArray.length) % storeStation.tracksArray.length].name))
    })

    navigator.mediaSession.setActionHandler('play', () => 
    {
      audioFromTrack.play()
      playPauseTrackButton.textContent = '❚❚'

      console.log('Playing Track:', (storeStation.tracksArray[storeStation.currentTrackIndex]?.name || 'Unknown'))
    })

    navigator.mediaSession.setActionHandler('pause', () => 
    {
      audioFromTrack.pause()
      playPauseTrackButton.textContent = '▶︎'

      console.log('Pausing Track:', (storeStation.tracksArray[storeStation.currentTrackIndex]?.name || 'Unknown'))
    })

    navigator.mediaSession.setActionHandler('nexttrack', () => 
    {
      domStation.playNextTrackButton.click()

      console.log('Playing Next Track:', (storeStation.tracksArray[(storeStation.currentTrackIndex + 1) % storeStation.tracksArray.length].name))
    })
  }
}