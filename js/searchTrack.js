import { domStation, storeStation } from './stateExport.js'
import { noResultsLayout } from './function.js'


const { searchTrackBar } = domStation
searchTrackBar.addEventListener('input', () =>
{
  if (!storeStation.isPlaylistLoaded)
  {
    return
  }

  clearTimeout(storeStation.searchTrackTimeout)
  
  const searchValue = searchTrackBar.value.toLowerCase()
  storeStation.searchTrackTimeout = setTimeout(() =>
  {
    if (!storeStation.isPlaylistLoaded)
    {
      noResultsLayout.style.display = (searchValue.length > 0) ? (''): ('none')
      return
    }

    if (searchValue.length < 2)
    {
      storeStation.isTrackFound = false
      storeStation.trackMetadataArray.forEach(item => item.style.display = '')

      noResultsLayout.style.display = 'none'
      return
    }

    storeStation.isTrackFound = false
    storeStation.trackMetadataArray.forEach((item, index) => 
    {
      const trackName = storeStation.tracksArray[index].name.toLowerCase()
      const trackMatch = trackName.includes(searchValue)

      item.style.display = trackMatch ? ('') : ('none')

      if (trackMatch)
      {
        storeStation.isTrackFound = true
      }
    })

    noResultsLayout.style.display = storeStation.isTrackFound ? ('none') : ('')
  }, 200)
})