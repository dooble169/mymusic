import { storeStation } from './stateExport.js'
import { loadPlaylist } from './function.js'


const requestDB = indexedDB.open('playlistDB', 2)
requestDB.onerror = event =>
{
  console.log('IndexedDB Error:', event.target.error)
}


requestDB.onupgradeneeded = event =>
{
  storeStation.playlistDB = event.target.result
  if (!storeStation.playlistDB.objectStoreNames.contains('tracks'))
  {
    storeStation.playlistDB.createObjectStore('tracks', { keyPath: 'id', autoIncrement: true })
  }
}


requestDB.onsuccess = event =>
{
  storeStation.playlistDB = event.target.result
  if (!storeStation.playlistDB.objectStoreNames.contains('tracks'))
  {
    console.error('Tracks Object Store Not Found!')
    return
  }

  loadPlaylist()
}