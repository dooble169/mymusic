import { domStation, storeStation } from './stateExport.js'
import { playTrack } from './function.js'


const { playOneSongButton, playPreviousTrackButton, playPauseTrackButton, playNextTrackButton, audioFromTrack } = domStation


playOneSongButton.addEventListener('click', () =>
{
  storeStation.isPlayOneTrackMode = !storeStation.isPlayOneTrackMode
  playOneSongButton.classList.toggle('play-one-song-button-selected', storeStation.isPlayOneTrackMode)

  if (storeStation.isPlayOneTrackMode)
  {
    console.log('Play Until The End: On')
  }

  else
  {
    console.log('Play Until The End: Off')
  }
})


playPreviousTrackButton.addEventListener('click', () => 
{
  if (storeStation.isPlayOneTrackMode)
  {
    console.log('Cannot Play The Previous Track (Play One Song Until The End: On')
    return
  }

  if (storeStation.tracksArray.length < 2)
  {
    return
  }

  let previousIndex = (storeStation.currentTrackIndex - 1)
  if (previousIndex < 0)
  {
    previousIndex = (storeStation.tracksArray.length - 1)
  }

  playTrack(previousIndex)
  console.log('Playing Previous Track:', storeStation.tracksArray[previousIndex].name)
})


playPauseTrackButton.addEventListener('click', () => 
{
  if ((storeStation.currentTrackIndex === -1) || !audioFromTrack.src)
  {
    return
  }

  if (audioFromTrack.paused) 
  {
    audioFromTrack.play().catch(() => {})
    playPauseTrackButton.textContent = '❚❚'

    console.log('Playing Track:', storeStation.tracksArray[storeStation.currentTrackIndex]?.name || 'Unknown')
  } 

  else 
  {
    audioFromTrack.pause()
    playPauseTrackButton.textContent = '▶︎'

    console.log('Pausing Track:', storeStation.tracksArray[storeStation.currentTrackIndex]?.name || 'Unknown')
  }
})


playNextTrackButton.addEventListener('click', () =>
{
  if (storeStation.isPlayOneTrackMode)
  {
    console.log('Cannot Play The Next Track (Play One Song Until The End: On')
    return
  }

  if (storeStation.tracksArray.length < 2)
  {
    return
  }

  const nextIndex = ((storeStation.currentTrackIndex + 1) % storeStation.tracksArray.length)
  playTrack(nextIndex)

  console.log('Playing Next Track:', storeStation.tracksArray[nextIndex].name)
})


const controls = document.querySelector('.user-controls-layout')
const saved = JSON.parse(localStorage.getItem("controlsPos"))


let offsetX = 0
let offsetY = 0
let isDragging = false


if (saved) 
{
  controls.style.left = saved.left
  controls.style.top = saved.top
}


function startDrag(event) 
{
  if (!event.target.closest('.drag-handle'))
  {
    return
  }

  isDragging = true
  
  event.preventDefault()

  const rectangle = controls.getBoundingClientRect()
  offsetX = (event.clientX - rectangle.left)
  offsetY = (event.clientY - rectangle.top)

  controls.style.cursor = "grabbing"
}


function onDrag(event) 
{
  if (!isDragging)
  {
    return
  }

  event.preventDefault();

  let newLeft = (event.clientX - offsetX)
  let newTop = (event.clientY - offsetY)

  newLeft = Math.max(0, Math.min((window.innerWidth - controls.offsetWidth), newLeft))
  newTop = Math.max(0, Math.min((window.innerHeight - controls.offsetHeight), newTop))

  controls.style.left = (newLeft + 'px')
  controls.style.top = (newTop + 'px')
}


function stopDrag() 
{
  if (!isDragging)
  {
    return
  }

  isDragging = false;
  
  controls.style.cursor = ''

  localStorage.setItem("controlsPos", JSON.stringify ({
    left: controls.style.left,
    top: controls.style.top
  }))
}


controls.addEventListener('pointerdown', startDrag)
document.addEventListener('pointermove', onDrag)
document.addEventListener('pointerup', stopDrag)


const elementToResize = document.querySelector('.user-controls-layout')
const resizer = document.createElement('div');
const savedSize = JSON.parse(localStorage.getItem('controlSize'))


const minWidth = 120;
const minHeight = 45;
const maxWidth = 300;
const maxHeight = 250;


resizer.style.right = 0;
resizer.style.bottom = 0;
resizer.style.width = '0.625em'
resizer.style.height = '0.625em'
resizer.style.cursor = 'se-resize'
resizer.style.position = 'absolute'


if (savedSize)
{
  elementToResize.style.width = savedSize.width
  elementToResize.style.height = savedSize.height
}


elementToResize.appendChild(resizer);
resizer.addEventListener('mousedown', initResize, false);


function initResize() 
{
  addEventListener('mousemove', Resize, false)
  addEventListener('mouseup', stopResize, false)
}


function Resize(e) 
{
  elementToResize.style.width = Math.max(minWidth, Math.min(maxWidth, e.clientX - elementToResize.offsetLeft)) + 'px'
  elementToResize.style.height = Math.max(minHeight, Math.min(maxHeight, e.clientY - elementToResize.offsetTop)) + 'px'
}


function stopResize() 
{
  removeEventListener('mousemove', Resize, false);
  removeEventListener('mouseup', stopResize, false);

  localStorage.setItem('controlSize', JSON.stringify ({
    width: elementToResize.style.width,
    height: elementToResize.style.height
  }))
}