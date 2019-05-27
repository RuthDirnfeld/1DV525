/*
* - The user should be able to open and play multiple memory games simultaneously.
* - The user should be able to play the game using only the keyboard.
* - One, by you decided, extended feature
*/

const template = document.createElement('template')
template.innerHTML = `
<div id="memory-app" class="ui card">
<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.12/semantic.min.css">
<link rel="stylesheet" href="css/memory-app.css">
<link rel="stylesheet" href="css/style.css">

  <div id="header" class="content">
    <i class="circular game icon"></i>Memory
    <i id="memory-close" class="right floated close icon link"></i>
  </div>
  <div id='memory-content' class='content center'>
  <h1>You have 50 seconds to finish</h1>
    <label id="timer" type="text"></label>
    <div id="memory-images">
      <template id="image">
        <a href="#"><img src="image/0.png" alt="A memory brick" /></a>
        <h1>You have 50 seconds to finish</h1>
        <label id="timer" type="text"></label>
      </template>
    </div>
  </div>
</div>
`

class MemoryApp extends window.HTMLElement {
  constructor () {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))

    this._app = this.shadowRoot.querySelector('#memory-app')
    this.header = this.shadowRoot.querySelector('#header')
    this.content = this.shadowRoot.querySelector('#memory-content')
    this._images = this.shadowRoot.querySelector('#memory-images')

    // game stuff
    this.tiles = []
  }
  static get observedAttributes () {
    return ['']
  }
  attributeChangedCallback (name, newValue) {
  }

  connectedCallback () {
    this.addEventToElements()
    this.makeBoard(4, 4, this._images)
  }

  /**
   * @param {number} rows
   * @param {number} columns
   * Make game board based on given parameters. Delete existing elememts if available. Assign values to class fields based on board * size
   */
  makeBoard (rows, cols, container) {
    var a
    var turn1
    var turn2
    var lastTile
    var pairs = 0
    var tries = 0

    // timer stuff
    var totalTime = 50
    var countdown = totalTime
    var interval = null

    this.tiles = this.getPictureArray(rows, cols)
    // importing the template from index file, 0 because we only have one
    let templateDiv = this.shadowRoot.querySelectorAll('#memory-images template')[0].content.firstElementChild
    // separate each memory game from each other, false because we don't want a copy of textnode and a tag
    let div = document.importNode(templateDiv, false)

    // ***************extra feature for showing winner and gameover***************
    // Timers stuff
    let title = this.shadowRoot.querySelector('h1')
    title.innerText = 'You have 50secs'
    let timer = this.shadowRoot.querySelector('#timer')
    timer.textContent = (countdown = totalTime)
    interval = setInterval(() => {
      timer.textContent = --countdown
      // if time is out - user can try again
      if (countdown <= 0) {
        // clearInterval is needed, otherwise it would run over
        // and over again and get costly
        clearInterval(interval)
        timer.textContent = ''
        title.innerText = 'Game Over'
      }
    }, 1000)
    // *****************extra feature eeeeeeeeeeeend**************

    // iterates tiles from 0 to 15, tile - gives the value of the picture,
    // index - we get the index of the tile in the array
    this.tiles.forEach(function (tile, index) {
      // gives us the image, imports image from the template
      a = document.importNode(templateDiv, true)

      div.appendChild(a)
      // go for click event on buttons and forms, not on images - images are not interacting by default,
      // so don't make them, by using javascript
      // one event listener and when clicked, it will present which img was clicked
      a.addEventListener('click', function (event) {
        event.preventDefault()
        // big letters when it comes to element names
        // 'IMG' ? element : element.firstElementChild ---> if the nodename is IMG, we got image,
        // otherwise we get the first child of the a type which is the image
        var img = event.target.nodeName === 'IMG' ? event.target : event.target.firstElementChild

        turnBrick(tile, index, img)
      })
      // (i+1) because picture starts at 0, but we want img1 and so on
      if ((index + 1) % cols === 0) {
        div.appendChild(document.createElement('br'))
      }
    })
    //
    // we add the div to the container after we have populated the div
    container.appendChild(div)
    // how to turn the brick? change the source of the image, tile and index
    // have nor eference to the image
    function turnBrick (tile, index, img) {
      if (turn2) { return }
      //
      img.src = 'image/' + tile + '.png'
      // first brick is clicked
      if (!turn1) {
        turn1 = img
        lastTile = tile
        // second brick is clicked
      } else {
        // img is a reference to the DOM image - we should
        // not be able to click the same image twice
        if (img === turn1) { return }
        //
        tries += 1
        //
        turn2 = img
        if (tile === lastTile) {
          // Found a pair
          pairs += 1
          // if we have found all pairs - win conditionS
          if (pairs === (cols * rows) / 2) {
            console.log('Win on ' + tries + ' number of tries')
            clearInterval(interval)
            title.innerText = 'Win on ' + tries + ' number of tries'
            timer.textContent = ''
          }
          // add removed and remove the png if a pair is found
          window.setTimeout(function () {
            turn1.parentNode.classList.add('removed')
            turn2.parentNode.classList.add('removed')
            turn1 = null
            turn2 = null
          }, 300)
        } else {
          // if not pair, turn them back around -hide
          // timeout needed, so that picture turns aroudn slowly
          window.setTimeout(function () {
            turn1.src = 'image/0.png'
            turn2.src = 'image/0.png'

            turn1 = null
            turn2 = null
          }, 500)
        }
      }
    }
  }

  getPictureArray (rows, cols) {
    var arr = []
    var i
    // we will put each img twice in the array - so divide by 2
    for (i = 1; i <= (rows * cols) / 2; i += 1) {
      arr.push(i)
      arr.push(i)
    }
    // [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8]

    // shuffle function
    for (i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1))
      var temp = arr[i]
      arr[i] = arr[j]
      arr[j] = temp
    }
    return arr
  }

  close () {
    this._app.remove()
  }

  // Handler for closing div window
  addEventToElements () {
    this._close = this.shadowRoot.querySelector('#memory-close')
    this._close.addEventListener('click', this.close.bind(this))
  }
}
window.customElements.define('memory-app', MemoryApp)
