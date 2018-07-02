class WorldCup {
	constructor(API_URL, element, country, interval) {
		this.API_URL = API_URL
		this.element = document.querySelector(element)
		this.country = country
		this.countryScore = 0
		this.interval = interval
		this.nrOfIntervals = 0
		
		this.init()
	}

	init() {
		this.enqueue()
		
		setInterval(() => {
			this.enqueue()
		}, this.interval)
	}

	enqueue() {
		this.getAllGames().then(allGames => {
			this.allGames = allGames
			this.countryGames = this.getCountryGames()
			this.lastAnnouncedCountryGame = [...this.countryGames].pop()
			this.teamKey = this.getTeamKey(this.lastAnnouncedCountryGame.num)

			this.updateCountryScore( Number(this.lastAnnouncedCountryGame[this.teamKey]) )
			this.updateDOM()
			
			console.log('this.nrOfIntervals:', this.nrOfIntervals)
		})
	}

	updateDOM() {
		this.element.innerHTML = `<p>${this.country} has ${this.countryScore} goals in their last announced game.</p>`
	}

	updateCountryScore(score) {
		this.countryScore = score
	}
	
	getAllGames() {
		this.nrOfIntervals++

		return fetch(this.API_URL)
			.then(res => res.json())
			.then(json => json)
		
	}
	
	async updateAllGames() {
		this.allGames = await this.getAllGames()
	}

	getCountryGames() {
		return this.allGames.rounds.map(matchDay => {
			return matchDay.matches
				.filter(match => (match.team1.name === this.country) || (match.team2.name === this.country))[0]
		}).filter(countryGame => countryGame)
	}

	getTeamKey(num) {
		return (this.countryGames.filter(countryGame => {
			return countryGame.num === num
		})[0].team1.name === this.country)
			? 'score1'
			: 'score2'
	}

}

const API_URL = 'https://raw.githubusercontent.com/openfootball/world-cup.json/master/2018/worldcup.json'
const element = '#root'
const country = 'Japan'
const interval = 100000

new WorldCup(API_URL, element, country, interval)