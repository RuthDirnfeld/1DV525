const template = document.createElement('template')
template.innerHTML = `

<div id="bart-app" class="ui card">
<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.12/semantic.min.css">
<link rel="stylesheet" href="css/bart-app.css">
<link rel="stylesheet" href="css/style.css">

  <div id="header" class="content">
  <i class="circular write icon"></i>Board
  <i id="bart-close" class="right floated close icon link"></i>
  </div>
  <div id="bart-content" text="I will blaaa ...." speed="10">
  <style>
  :host {
    background: #coral;
    font-size: 1.2em;
    color:white;
    width:250px;
    height:200px;
    padding:10px;
    border:6px solid #coral;
    border-bottom:12px solid #coral;
    overflow:hidden;
    margin:10px;
    float:left;
    border-radius: 3px;
  }
  
  p {
    margin: 0;
    padding: 0;
  }
  </style>
  
    <p id='text'></p>
  </div>
</div>
`
export class BartBoard extends window.HTMLElement {
  constructor () {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))

    this._app = this.shadowRoot.querySelector('#bart-app')
    this.header = this.shadowRoot.querySelector('#header')
    this.content = this.shadowRoot.querySelector('#bart-content')
    this._p = this.shadowRoot.querySelector('#text')
    this._intervalID = null
    this._letter = 0
    this._text = 'Leave'
    this._speed = 20
  }
  static get observedAttributes () {
    return ['text', 'speed']
  }
  attributeChangedCallback (name, oldValue, newValue) {
    if (name === 'text') {
      this._text = newValue
    } else if (name === 'speed') {
      this._speed = newValue
    }
  }
  connectedCallback () {
    this.addEventListener('mousedown', this._onWrite)
    this.addEventListener('mouseup', this.stopWriting)
    this.addEventListener('mouseleave', this.stopWriting)
    this.addEventToElements()
  }
  disconnectedCallback () {
    this.removeEventListener('mousedown', this._onWrite)
    this.removeEventListener('mouseup', this.stopWriting)
    this.removeEventListener('mouseleave', this.stopWriting)
    this.stopWriting()
  }
  _onWrite (event) {
    //  console.log('clicked')
    this._intervalID = setInterval(() => {
      if (this._p.offsetHeight >= this.offsetHeight) {
        //  console.log('Full')
        this.dispatchEvent(new window.CustomEvent('filled'))
        this.stopWriting()
        return
      }
      this._p.textContent += this._text.charAt(this._letter++)
      if (this._letter >= this._text.length) {
        this._p.textContent += ' '
        this._letter = 0
      }
    }, this._speed)
  }

  stopWriting () {
    clearTimeout(this._intervalID)
  }
  // wipe the board when the text reaches the end of the board
  wipeBoard () {
    this._p.textContent = ''
    this._letter = 0
  }
  // close the app
  close () {
    this._app.remove()
  }

  /*
  * Handler for the close button click
  */
  addEventToElements () {
    this._close = this.shadowRoot.querySelector('#bart-close')
    this._close.addEventListener('click', this.close.bind(this))
    // this._images.addEventListener('click', this.showImage.bind(this))
  }
}

window.customElements.define('bart-app', BartBoard)
