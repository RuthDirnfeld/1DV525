// 'http://vhost3.lnu.se:20080/question/1'
const template = document.createElement('template')
template.innerHTML = `
<div id="quiz-app" class="ui card">
<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.12/semantic.min.css">
<link rel="stylesheet" href="css/quiz-app.css">
<link rel="stylesheet" href="css/style.css">

  <div id="header" class="content">
  <i class="circular question icon"></i>Quiz
  <i id="quiz-close" class="right floated close icon link"></i>
  </div>
  <div id="quiz-content">
    <h1>Quiz App </h1>
    <label id="timer" type="text"></label>
    <p id="questionQuiz"></p>
    <form> 
      <div id="textAnswerContainer">
        <label class="textLabel">
        <input type="text" id="inputText">            
        </label>
      </div>
      <div id="radioBtnContainer">  
        <input type="radio" class="radios" id="radio1" value="alt1">    
        <label class="radios" id="radioLabel1"></label>
        <input type="radio" class="radios" id="radio2" value="alt2">
        <label class="radios" id="radioLabel2"></label>
        <br/>
        <input type="radio" class="radios" id="radio3"  value="alt3">
        <label class="radios" id="radioLabel3"></label>
        <input type="radio" id="radio4" value="alt4">
        <label id="radioLabel4"></label>
      </div>   
      <div id="high-score">
        <h1>High-Scores</h1>
        <ol>
          <li>--</li><li>--</li><li>--</li><li>--</li><li>--</li>
        </ol>
      </div> 
      <div id="game-over">
        <button id="restart-btn">Restart</button>
      </div>
    <button id="generalBtn" type="button"></button> 
    </form>
  </div>
</div>
`

class QuizApp extends window.HTMLElement {
  constructor () {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))

    this._header = this.shadowRoot.querySelector('#header')
    this._title = this.shadowRoot.querySelector('h1')
    this._question = this.shadowRoot.querySelector('p')
    this.userAnswer = ''
    this.isfirstQuestion = true
    this.username = ''
    this.response = ''
    this.alternatives = null
    this._button = this.shadowRoot.querySelector('#generalBtn')
    this._inputText = this.shadowRoot.querySelector('#inputText')
    this.scoreboard = this.shadowRoot.querySelector('#high-score')
    this._restart = this.shadowRoot.querySelector('#game-over')
    this._url = 'http://vhost3.lnu.se:20080/question/1'

    // timer stuff
    this.totalTime = 20
    this.countdown = this.totalTime
    this.timeUsed = 0
    this._timer = this.shadowRoot.querySelector('#timer')
    this._interval = null

    this._app = this.shadowRoot.querySelector('#quiz-app')
  }
  static get observedAttributes () {
    return ['src']
  }
  attributeChangedCallback (name, oldValue, newValue) {
    if (name === 'src') {
      this._url = newValue
    }
  }

  /**
 * connectedCallback: called when the element is added
 * to the document
 * On button clicked - check if is first question
 * if true: save getUsername and finish event
 * if false: get the next answer
 * POST - user answer
 * get answer from server = new url
 */
  connectedCallback () {
    this.welcomeScreen()
    this._button.addEventListener('click', async e => {
      if (this.isfirstQuestion) {
        this.getUsername()
        this.updateQuestionView()
        return
      }
      this.getAnswer()
      this.getResponse()
    })
    this.addEventToElements()
  }

  async updateQuestionView () {
    this.response = await this.loadUrl()
    this._question.innerText = this.response.question
    if (this.response.alternatives) {
      this.showAlternatives()
    } else {
      this.showTextbox()
    }
    this.startTimer()
    this.clearBox()
  }
  /**
   * Alternatives handling is at the end of document
   */
  async loadUrl (url) {
    let fetcher = await window.fetch(`${this._url}`)
    fetcher = await fetcher.json()
    if (fetcher.nextURL) {
      this._nextUrl = fetcher.nextURL
      // answer urls
      /*  console.log('this._nextUrl ' + this._nextUrl)
        console.log('fetcher.nextURL ' + fetcher.nextURL) */
    } else {
      this.isfirstQuestion = false
      this.gameOver()
    }
    return fetcher
  }

  /**
   * copied from mozilla web.
   */
  getResponse () {
    this.stopTimer()
    return window.fetch(`${this.response.nextURL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ answer: this.userAnswer })
    })
      .then(res => {
        if (res.ok) {
          return res.json()
        } else {
          console.log('wrong answer :(')
          throw new Error()
        }
      })
      .then(data => {
        console.log('DATA1 ' + JSON.stringify(data))
        // this.response string: send which is right as the answer via HTTP POST to the nextURL in JSON-format
        // console.log('POST JSON this.response ' + JSON.stringify(this.response))
        // this.response.nextURL is http://vhost3.lnu.se:20080/answer/..
        this.response = data
        this._url = this.response.nextURL
        if ((this.response = data).nextURL) {
          // this.response.nextURL is http://vhost3.lnu.se:20080/question/..
          // data.nextURL "http://vhost3.lnu.se:20080/question/..
          this.updateQuestionView()
        } else {
          // if the User answers everything correctly -> game is over and we are done
          // go to gameOver and handle the presentation of the scoreboard
          this.gameOver()
        }
      })
      .catch(() => this.gameOver())
  }
  /**
   * array with all children of the radio container div
   * if any of them is "checked" assign that value
   * to userAnswer and stop the loop
   */
  getAnswer () {
    if (this.response.alternatives) {
      let parent = this.shadowRoot.querySelector('#radioBtnContainer').children
      Array.from(parent).some((element) => {
        if (element.checked) {
          console.log('getRadioAnswer:' + element.value)
          this.userAnswer = element.value
          return true
        } else return false
      })
    } else {
      this.userAnswer = this._inputText.value
    }
  }

  welcomeScreen () {
    this._header.style.display = ''
    this.hideAlternatives()
    this._restart.style.display = 'none'
    this.scoreboard.style.display = 'none'
    this._question.innerText = 'Enter your username below'
    this._button.innerText = 'Continue'
    this._inputText.style.display = ''
  }
  getUsername () {
    this.username = this._inputText.value
    this._title.innerText = `${this.username} is Playing!`
    this.isfirstQuestion = false
  }
  clearBox () {
    this._inputText.value = ''
  }
  hideAlternatives () {
    let parent = this.shadowRoot.querySelector('#radioBtnContainer')
    Array.from(parent.children).forEach((radio) => {
      radio.style.display = 'none'
    })
  }
  hideTextbox () {
    this._inputText.style.display = 'none'
  }
  showTextbox () {
    this._inputText.style.display = 'block'
    this.hideAlternatives()
  }

  showAlternatives () {
    /** labels - show alternatives and let inner.text = to alt1..alt4
     * not sure how to loop when having alt1...alt4 options
     */
    let showRadio = this.shadowRoot.querySelector('#radioLabel1')
    showRadio.style.display = ''
    showRadio.innerText = this.response.alternatives.alt1
    showRadio = this.shadowRoot.querySelector('#radioLabel2')
    showRadio.style.display = ''
    showRadio.innerText = this.response.alternatives.alt2
    showRadio = this.shadowRoot.querySelector('#radioLabel3')
    showRadio.style.display = ''
    showRadio.innerText = this.response.alternatives.alt3
    if (this.response.alternatives.alt4) {
      showRadio = this.shadowRoot.querySelector('#radioLabel4')
      showRadio.style.display = ''
      showRadio.innerText = this.response.alternatives.alt4
    }
    // buttons - if not alt4 - hide alt4
    let parent = this.shadowRoot.querySelector('#radioBtnContainer')
    Array.from(parent.children).forEach((radio) => {
      radio.style.display = ''
      radio.checked = false
      if (!this.response.alternatives.alt4) {
        showRadio = this.shadowRoot.querySelector('#radio4')
        showRadio.style.display = 'none'
        showRadio = this.shadowRoot.querySelector('#radioLabel4')
        showRadio.style.display = 'none'
      }
    })
    this.hideTextbox()
  }

  /**
   * if it was the last question - show scoreboard
   * else let the user restart the game
   */
  gameOver () {
    this.stopTimer()
    if (!this.response.nextURL) {
      console.log('******WIN*******')
      this.getScoreBoard()
      this._restart.style.display = ''
    } else {
      // hide all unnecessary stuff
      this._timer.textContent = ''
      this._button.style.display = 'none'
      this._question.style.display = 'none'
      this.hideTextbox()
      this.hideAlternatives()
      this._title.innerText = 'You lost, but you can try again'
      this._restart.style.display = ''
      console.log('**********WRONG*******************')
    }
  }
  getScoreBoard () {
    // hide all unnecessary stuff
    this._title.innerText = `${this.username} Finished!`
    this.hideAlternatives()
    this._timer.style.display = 'none'
    this._question.style.display = 'none'
    this._button.style.display = 'none'

    // If the user answers all of the questions correctly the game records the users total time and presents this in a
    // high-score list with the five fastest times. The high-score is saved in the browsers Web Storage.

    // Get key from localStorage, check if localstorage already exists
    // source: https://www.taniarascia.com/how-to-use-local-storage-with-javascript/
    let users = JSON.parse(window.localStorage.getItem('users')) === null ? [] : JSON.parse(window.localStorage.getItem('users'))
    users.push({ name: this.username, score: this.timeUsed })
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
    users.sort((u1, u2) => {
      return u1.score - u2.score
    })
    users.splice(5, 1)
    this.elements = this.shadowRoot.querySelectorAll('#high-score ol li')
    // visualization of name and time
    users.forEach((user, row) => {
      this.elements[row].textContent = user.name + ': ' + user.score + ' seconds'
    })
    this.scoreboard.style.display = ''
    window.localStorage.setItem('users', JSON.stringify(users))
  }

  // Timers stuff
  startTimer () {
    this._timer.textContent = (this.countdown = this.totalTime)
    this._interval = setInterval(() => {
      this._timer.textContent = --this.countdown
      // if time is out - user can try again
      if (this.countdown <= 0) {
        this.gameOver()
      }
    }, 1000)
  }

  // clearInterval is needed, otherwise it would run over
  // and over again and get costly
  stopTimer () {
    clearInterval(this._interval)
    this.timeUsed += this.totalTime - this.countdown
  }

  close () {
    if (this._interval !== null) {
      this.stopTimer()
    }

    this._app.remove()
  }

  addEventToElements () {
    this._close = this.shadowRoot.querySelector('#quiz-close')
    this._close.addEventListener('click', this.close.bind(this))
  }
}

window.customElements.define('quiz-app', QuizApp)
