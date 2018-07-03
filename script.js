class WorldCup {
	constructor(countryCode, interval) {
		this.countryCode = countryCode
		// this.API_URL = `https://worldcup.sfg.io/matches/country?fifa_code=${countryCode}`
		this.API_URL = `http://localhost:8080/mockData.json`
		this.interval = interval
		this.requestCounter = 0
		
		this.init()
	}

	init() {
		this.showLoader()
		// setTimeout(() => {
		// 	this.enqueue()
		// }, 2000);
		
		// setInterval(() => {
		// 	this.enqueue()
		// }, this.interval)
	}

	enqueue() {
		this.getJSON().then(response => {
			if(this.isLoading) {
				this.hideLoader()
			}

			this.requestCounter++

			this.latestAnnouncedGame = [...response].pop()

			const teamKey = (this.latestAnnouncedGame.home_team.code === this.countryCode)
				? 'home_team'
				: 'away_team'

			this.teamGoals = this.latestAnnouncedGame[teamKey].goals
			this.teamEvents = this.latestAnnouncedGame[`${teamKey}_events`]
			this.gameTime = Number(this.latestAnnouncedGame.time)
			this.teamCountry = this.latestAnnouncedGame[`${teamKey}_country`]

			this.updateDOM()
			console.log( 'Number of request: ', this.requestCounter )

		})
	}

	getJSON() {
		return fetch(this.API_URL)
			.then(res => res.json())
			.then(json => json)
	}

	showLoader() {
		this.loaderElem = document.createElement('span')
		this.loaderElem.classList.add('loader')

		this.loaderElem.style = `
			font-size: 100px;
			position: absolute;
			display: flex;
			width: 100px;
			height: 100px;
			animation: spin 1.5s infinite;
			transition: opacity 1s;
		`

		this.loaderElem.innerText = "⚽"
		document.body.appendChild(this.loaderElem)
		this.isLoading = true
	}

	hideLoader() {
		// return new Promise(resolve => {
			setTimeout(() => this.loaderElem.style.opacity = '0', 10)
			this.loaderElem.addEventListener('transitionend', e => {
				document.body.removeChild(this.loaderElem)
				// resolve()
			})
			this.isLoading = false
		// })
	}

	updateDOM() {
		if(!this.textElem) {
			this.textElem = document.createElement('p')
			this.textElem.innerText = `${this.teamCountry} has ${this.teamGoals} goals in their last announced game.`
			document.body.appendChild(this.textElem)
			console.log( this.textElem )
		} else {
			this.textElem.innerText = `${this.teamCountry} has ${this.teamGoals} goals in their last announced game.`
		}
	}
}

const countryCode = 'SWE'
const interval = 5000

new WorldCup(countryCode, interval)