import './memory-app.js'
import './quiz-app'
import './bart-app.js'
import './chat-app.js'

// counter for updating the zIndex on the selected div windows, in order to
// have the sleceted window on top of all others
var i = 0

/*
* Handler for importing the shadow templates to the main div in index.html
* when any of the apps is chosen by the user.
*/
const clickHandler = () => {
  document.querySelector('nav').addEventListener('click', event => {
    if (event.target.tagName === 'I') {
      event.target.id = event.target.parentElement.id
    }
    switch (event.target.id) {
      case 'chat':
        let chatApp = document.createElement('chat-app')
        document.querySelector('#main').appendChild(chatApp)
        addDragAndDrop(chatApp.shadowRoot.querySelector('#chat-app'))
        break
      case 'memory':
        let memoryApp = document.createElement('memory-app')
        document.querySelector('#main').appendChild(memoryApp)
        addDragAndDrop(memoryApp.shadowRoot.querySelector('#memory-app'))
        break
      case 'quiz':
        let quizApp = document.createElement('quiz-app')
        addDragAndDrop(quizApp.shadowRoot.querySelector('#quiz-app'))
        document.querySelector('#main').appendChild(quizApp)
        break
      case 'bart':
        let bartApp = document.createElement('bart-app')
        bartApp.setAttribute('text', 'This was fun')
        bartApp.setAttribute('speed', 10)
        bartApp.addEventListener('filled', () => {
          bartApp.wipeBoard()
        })
        document.querySelector('#main').appendChild(bartApp)
        addDragAndDrop(bartApp.shadowRoot.querySelector('#bart-app'))
    }
  })
}
// https://www.w3schools.com/howto/howto_js_draggable.asp
const addDragAndDrop = (app) => {
  let pos1 = 0
  let pos2 = 0
  let pos3 = 0
  let pos4 = 0
  // otherwise, move the DIV from anywhere inside the DIV:
  app.onmousedown = dragMouseDown

  function dragMouseDown (e) {
    // zIndex++ to increase the index so that the window is
    // focused
    app.style.zIndex = i++
    e = e || window.event
    // can't have preventDefault, else I won't be able to type
    // in the div windows
    // e.preventDefault()

    // get the mouse cursor position at startup
    pos3 = e.clientX
    pos4 = e.clientY
    document.onmouseup = closeDragElement
    // call a function whenever the cursor moves
    document.onmousemove = elementDrag
  }

  /*
  * when the div is dragged, update position
  */
  function elementDrag (e) {
    e = e || window.event
    e.preventDefault()
    // calculate the new cursor position
    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY
    // set the element's new position
    app.style.top = (app.offsetTop - pos2) + 'px'
    app.style.left = (app.offsetLeft - pos1) + 'px'
  }

  /*
  * stop moving the the div on mouse up event
  */
  function closeDragElement () {
    // stop moving when mouse button is released
    document.onmouseup = null
    document.onmousemove = null
  }
}
clickHandler()
