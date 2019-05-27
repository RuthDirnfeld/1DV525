const template = document.createElement('template')
template.innerHTML = `
<div id="chat-app" class="ui card">
<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.12/semantic.min.css">
<link rel="stylesheet" href="css/chat-app.css">
<link rel="stylesheet" href="css/style.css">
  
  <div id="header" class="content">
  <i class="circular chat icon"></i>Chat
  <i id="chat-close" class="right floated close icon link"></i>
  </div>
  
  <div id="chat-content">

    <div id='chat-messagesDiv'>

      <div id='chat-messagesList'>
        <template id='message'>
          <div class='newMsg'>
            <div class='content'>
              <span class='client'></span>
              <div class='text'></div>
            </div>
          </div>
        </template> 
      </div>

      <form class='ui reply form'>
        <div class='field'>
          <textarea id='chat-msgInput' placeholder='Enter a message..'></textarea>
        </div>
      </form>

    </div>
    
    <div id='chat-welcomeDiv'>
      <div class='ui fluid icon input'>
        <input id='chat-username' type='text' placeholder='Username'>
      </div>
      <br />
      <div class='ui fluid icon input'>
        <input id='chat-channel' type='text' placeholder='Channel'>            
      </div>
      <br />

      <div id='chat-doneBtn' class='ui bottom attached button'>Enter</div>
    </div>
  </div>
</div>
`

class ChatApp extends window.HTMLElement {
  constructor () {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))

    this._app = this.shadowRoot.querySelector('#chat-app')
    this.header = this.shadowRoot.querySelector('#header')

    this.chatContent = this.shadowRoot.querySelector('#chat-content')
    this.messagesDiv = this.shadowRoot.querySelector('#chat-messagesDiv')
    this._username = this.shadowRoot.querySelector('#chat-username')
    this._channel = this.shadowRoot.querySelector('#chat-channel')
    this.welcomeDiv = this.shadowRoot.querySelector('#chat-welcomeDiv')
    this.doneBtn = this.shadowRoot.querySelector('#chat-doneBtn')
    this.messageList = this.shadowRoot.querySelector('#chat-messagesList')
    this.msgInput = this.shadowRoot.querySelector('#chat-msgInput')
    this.messages = null
    // if user is null the it is '' otherwise get the stored user
    this.username = window.localStorage.getItem('user') === null ? '' : JSON.parse(window.localStorage.getItem('user')).username
    this.channel = window.localStorage.getItem('user') === null ? '' : JSON.parse(window.localStorage.getItem('user')).channel
    // socket used for connecting
    this.socket = null
  }
  static get observedAttributes () {
    return ['']
  }
  attributeChangedCallback (name, newValue) {
  }

  connectedCallback () {
    this.addEventToElements()
    // if local storage is empty, let the user enter a
    // username, otherwise go straight to chatwindow
    if (this.username === '') {
      this.welcomeScreen()
    } else {
      this.showChatWindow()
    }
  }

  // showing and hiding stuff at launching window
  welcomeScreen () {
    this.messagesDiv.style.display = 'none'
    this.messageList.style.display = 'none'
    this.welcomeDiv.style.display = ''
  }

  // showing and hiding stuff when username and channel
  // were added or are already stored
  showChatWindow () {
    this.welcomeDiv.style.display = 'none'
    this.messagesDiv.style.display = ''
    this.messageList.style.display = ''
    this.displayMessagesList()
  }

  // save the user to the local storage
  saveUser () {
    let username = ('' + this._username.value).trim()
    let channel = ('' + this._channel.value).trim()
    // check if the length of the input is longer than 0
    if (username.length > 0) {
      // save user to local storage
      window.localStorage.setItem('user', JSON.stringify({
        username: (this.username = username),
        // optional - new channel
        channel: (this.channel = channel)
      }))
      // show the chat window
      this.showChatWindow()
    }
  }

  // The web socket server will send a "heartbeat" message to
  // keep the connection open. This message is sent every 40 seconds
  // and have the following structure
  displayMessage (response) {
    if (response.type !== 'heartbeat') {
      // templateDiv for each new message
      let templateDiv = this.shadowRoot.querySelectorAll('#chat-messagesList template')[0].content.firstElementChild
      // import the template div
      let message = document.importNode(templateDiv, true)
      // loop over all children of the template
      Array.prototype.forEach.call(message.children[0].children, child => {
        // check all elements with attribute class and assign
        // value to each case
        switch (child.getAttribute('class')) {
          case 'client': child.textContent = response.username
            break
          case 'text': child.textContent = response.data
        }
      })
      // append each new message to the messagelist div
      this.messageList.appendChild(message)
    }
  }

  // connect to server if not connected yet
  displayMessagesList () {
    if (this.socket === null) {
      this.connect()
        .then(socket => this.sendText(socket))
    }
    /*  if (this.messages !== null) {
        this.messageList.appendChild(this.messages)
        this.messages = null
      } */
  }

  sendText (event) {
    // 13 so that it sends the message on enter
    if (event.keyCode === 13) {
      this.socket.send(JSON.stringify({
        type: 'message',
        // "The message text is sent using the data property"
        data: event.target.value,
        // username - either in localstorage or new username
        username: this.username,
        // "my, not so secret, channel"
        channel: this.channel,
        // "A api-key. Found when logged in on the course webpage"
        key: 'eDBE76deU7L0H9mEBgxUKVR0VCnq0XBd'
      }))
      event.target.value = ''
      event.preventDefault()
    }
  }

  // connect method which actually connects to the server
  // and shows the messages
  // Promise(resolve,reject) syntax only
  connect () {
    return new Promise((resolve, reject) => {
      // protocol, if it is secure then ws
      this.socket = new window.WebSocket('ws://vhost3.lnu.se:20080/socket/')
      // handshake init to open connection
      // when it is open, we can send data
      this.socket.onopen = () => resolve(this.socket)
      // error handler in case we have an error
      this.socket.onerror = () => reject(this.socket)
      // when the server sends us smthg (event is triggered and added to the queue)
      // on message -> display the message
      this.socket.onmessage = (event) => this.displayMessage(JSON.parse(event.data))
    })
  }

  // when user clicks on closing the window
  close () {
    if (this.socket !== null) {
      // socket.close for closing the connection
      this.socket.close()
    }
    this._app.remove()
  }

  /*
  * Handlers for some buttons and inputs
  */
  addEventToElements () {
    this._close = this.shadowRoot.querySelector('#chat-close')
    this._close.addEventListener('click', this.close.bind(this))
    this.doneBtn.addEventListener('click', this.saveUser.bind(this))
    this.msgInput.addEventListener('keydown', this.sendText.bind(this))
  }
}
window.customElements.define('chat-app', ChatApp)
