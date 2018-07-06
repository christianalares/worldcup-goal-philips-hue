import Hue from 'philips-hue'

class WorldCup {
	constructor(countryCode, interval, streamDelay) {
		this.countryCode = countryCode
		this.teamGoals = 0
		this.streamDelay = streamDelay
		this.API_URL = `https://worldcup.sfg.io/matches/country?fifa_code=${countryCode}`
		// this.API_URL = `http://localhost:1234/mockData.json`
		this.flagUrl = `https://restcountries.eu/data/${countryCode.toLowerCase()}.svg`

		this.interval = interval
		this.requestCounter = 0

		this.init()
	}
	
	init() {
		this.showLoader()

		this.initLights().then(lights => {
			this.hueLights = lights
			this.initialState = this.setInitialState(lights)

			// this.newGoalTrigger()

			this.intervalId = setInterval(() => {
				this.enqueue()
			}, this.interval);

		}).catch(e => console.error('initLights() Error', e))
	}

	setInitialState(lights) {
		let initialState = []
		for(const light in lights) {
			initialState.push(lights[light].state)
		}

		return initialState
	}

	returnToInitialState() {
		for(let light in this.hueLights) {
			const index = Number(light - 1)

			this.hue.light(light).setState({ bri: this.initialState[index].bri })
				.then( this.hue.light(light).setState({ hue: this.initialState[index].hue }) )
				.then( this.hue.light(light).setState({ sat: this.initialState[index].sat }) )
		}
	}

	initLights() {
		this.hue = new Hue()
		this.hue.bridge = process.env.HUE_BRIDGE
		this.hue.username = process.env.HUE_USER

		return this.hue.getLights()
	}

	getLights() {
		return this.hue.getLights().then(lights => lights)
	}

	logLights() {
		this.getLights().then(lights => console.log( 'Lights:', lights ))
	}

	onAll() {
		let lightPromises = []

		for(let light in this.hueLights) {
			lightPromises.push( this.hue.light(light).on() )
		}

		return Promise.all(lightPromises)
	}

	offAll() {
		let lightPromises = []

		for(let light in this.hueLights) {
			lightPromises.push( this.hue.light(light).off() )
		}

		return Promise.all(lightPromises)
	}

	fullBrightnessAll() {
		let lightPromises = []

		for(let light in this.hueLights) {
			lightPromises.push( this.hue.light(light).setState({ bri: 254 }) )
		}

		return Promise.all(lightPromises)
	}

	fullSaturationAll() {
		let lightPromises = []

		for(let light in this.hueLights) {
			lightPromises.push( this.hue.light(light).setState({ sat: 254 }) )
		}

		return Promise.all(lightPromises)
	}

	setTransitionTime(transitiontime) {
		let lightPromises = []

		for(let light in this.hueLights) {
			lightPromises.push( this.hue.light(light).setState({ transitiontime }) )
		}

		return Promise.all(lightPromises)
	}

	alertAll() {
		this.onAll().then(() => {
			for(let light in this.hueLights) {
				this.hue.light(light).setState({ alert: 'select' })
			}
		})
	}

	setColor(color) {
		let hue
		switch (color) {
			case 'yellow':	hue = 10000; break
			case 'blue':	hue = 46920; break
			default:		hue = 5000; break
		} 

		for(let light in this.hueLights) {
			this.hue.light(light).setState({ hue })
		}
	}

	dance({ colorPattern, iterations, speed, transitionTime }) {
		return new Promise(resolve => {		
			this.offAll()
				.then(() => this.onAll())
				.then(() => this.setTransitionTime(transitionTime))
				.then(() => this.fullBrightnessAll())
				.then(() => this.fullSaturationAll())
				.then(() => {
					this.setColor(colorPattern[0])

					for (let i = 0; i < iterations; i++) {
						setTimeout(() => {
							// Choose colorPattern[0] or colorPattern[1] depending on odd/even number in the iteration
							this.setColor(colorPattern[Number(i % 2 === 0)])
						}, (i + 1) * speed )
					}

					// Resolve the promise when all is done
					setTimeout(() => {
						resolve()
					}, iterations * speed);
				})
		})
	}

	newGoalTrigger() {
		this.dance({
			colorPattern: ['yellow', 'blue'],
			iterations: 20,
			speed: 1000,
			transitionTime: 10
		}).then(() => {
			this.returnToInitialState()
		})
	}

	setBG() {
		fetch(this.flagUrl)
			.then(res => res.text())
			.then(svg => {
				const imageURL = this.createSVG(svg)

				document.body.style = `
					background: url(${imageURL}) left top no-repeat;
					background-size: 100% 100%;
				`
			})

	}

	createSVG(svg) {
		const divElem = document.createElement('divElem')
		divElem.innerHTML = svg

		const svgElem = divElem.children[0]
		svgElem.setAttribute('preserveAspectRatio', 'none')

		const blob = new Blob([svgElem.outerHTML], {
			type: 'image/svg+xml'
		})

		return URL.createObjectURL(blob)
	}

	enqueue() {
		this.getJSON().then(response => {
			console.log( response )

			if(this.isLoading) {
				this.hideLoader()
				this.setBG()
			}

			this.requestCounter++

			this.latestAnnouncedGame = [...response].pop()

			const teamKey = (this.latestAnnouncedGame.home_team.code === this.countryCode)
				? 'home_team'
				: 'away_team'

			if(this.teamGoals !== this.latestAnnouncedGame[teamKey].goals) {
				this.teamGoals = this.latestAnnouncedGame[teamKey].goals

				setTimeout(() => this.newGoalTrigger(), this.streamDelay)
			}
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
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			font-size: 100px;
			transform-origin: 50% 44%;
			animation: spin 0.8s linear infinite;
			transition: opacity .5s;
		`

		this.loaderElem.innerText = "⚽"
		document.body.appendChild(this.loaderElem)
		this.isLoading = true
	}

	hideLoader() {
		setTimeout(() => this.loaderElem.style.opacity = '0', 10)
		this.loaderElem.addEventListener('transitionend', e => {
			document.body.removeChild(this.loaderElem)
		})
		this.isLoading = false
	}

	updateDOM() {
		if(!this.textElem) {
			this.textElem = document.createElement('p')
			this.textElem.innerText = `${this.teamCountry} has ${this.teamGoals} goals in their last announced game.`
			document.body.appendChild(this.textElem)
		} else {
			this.textElem.innerText = `${this.teamCountry} has ${this.teamGoals} goals in their last announced game.`
		}
	}
}

const countryCode = 'BRA'
const interval = 30000 // check api every 30 sec
const streamDelay = 0 // delay the blink reaction 5 sec

new WorldCup(countryCode, interval, streamDelay)