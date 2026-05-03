if (!localStorage.getItem('themeMode')) 
{
  localStorage.setItem('themeMode', 'darkmode')
}


const themeSwitchButton = document.getElementById('themeSwitchButton')
const lightmodeThemeSwitchIcon = `<div class="lightmode-theme-switch-icon"></div>`
const darkmodeThemeSwitchIcon = `<div class="darkmode-theme-switch-icon"></div>`


let themeMode = (localStorage.getItem('themeMode') === 'lightmode')


function updateThemeUI()
{
  themeSwitchButton.innerHTML = (themeMode) ? (darkmodeThemeSwitchIcon) : (lightmodeThemeSwitchIcon)
}


themeSwitchButton.addEventListener('click', () => 
{
  themeMode = !themeMode

  localStorage.setItem('themeMode', (themeMode) ? ('lightmode') : ('darkmode'))

  updateThemeUI()
  applyThemeColors()

  console.log('Theme Mode Changed To:', (themeMode) ? ('Light Mode') : ('Dark Mode'))
})


function applyThemeColors() 
{
  const colorVariables = 
  [
    'backgroundcolor-1', 'backgroundcolor-2', 'backgroundcolor-3', 'backgroundcolor-4', 
    'backgroundcolor-a', 'backgroundcolor-b', 'backgroundcolor-c',
    'cardbackgroundcolor-1', 'cardbackgroundcolor-2', 'cardbackgroundcolor-3',
    'textcolor-1', 'textcolor-2', 'textcolor-3', 'textcolor-4', 'textcolor-a'
  ]

  const getSavedThemeMode = localStorage.getItem('themeMode')
  document.body.style.backgroundImage = `var(--${getSavedThemeMode}-background-image)`
  colorVariables.forEach(colorVariable => 
  {
    document.body.style.setProperty(`--${ colorVariable }`, `var(--${ getSavedThemeMode }-${ colorVariable })`)
  })
}


window.addEventListener("load", () => 
{
  updateThemeUI()
  applyThemeColors()
})