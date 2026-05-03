import { domStation } from './stateExport.js'
import { saveTrack, loadPlaylist } from './function.js'


const validFileTypes = new Set(['audio/mpeg', 'audio/mp4'])
const { uploadTrack } = domStation


uploadTrack.addEventListener('change', async event => 
{
  const files = Array.from(event.target.files)
  for (let file of files) 
  {
    if (!validFileTypes.has(file.type))
    {
      console.log(`Unsupported File Type: ${ file.type } (${ file.name })`)
      alert(`Invalid File Type: ${ file.type }, (${ file.name })`)
      continue
    }

    await saveTrack(file)
  }

  loadPlaylist()
})