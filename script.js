const weatherCodeMap = {
	0: ['Clear Sky', './icon/sun.png'],
	1: ['Mainly Clear', './icon/sun.png'],
	2: ['Partly Cloudy', './icon/cloudy.png'],
	3: ['Overcast', './icon/overcast.png'],
	45: ['Fog', './icon/fog.png'],
	48: ['Depositing Rime Fog', './icon/fog.png'],
	51: ['Light Drizzle', './icon/rain.png'],
	53: ['Moderate Drizzle', './icon/rain.png'],
	55: ['Dense Drizzle', './icon/rain.png'],
	56: ['Light Freezing Drizzle', './icon/rain.png'],
	57: ['Dense Freezing Drizzle', './icon/rain.png'],
	61: ['Slight Rain', './icon/rain.png'],
	63: ['Moderate Rain', './icon/rain.png'],
	65: ['Heavy Rain', './icon/rain.png'],
	66: ['Light Freezing Rain', './icon/rain.png'],
	67: ['Dense Freezing Rain', './icon/rain.png'],
	71: ['Light Snow', './icon/snow.png'],
	73: ['Moderate Snow', './icon/snow.png'],
	75: ['Heavy Snow', './icon/snow.png'],
	77: ['Snow Grains', './icon/snow.png'],
	80: ['Slight Rain Showers', './icon/rain.png'],
	81: ['Moderate Rain Showers', './icon/rain.png'],
	82: ['Violent Rain Showers', './icon/rain.png'],
	85: ['Slight Snow Showers', './icon/snow.png'],
	86: ['Heavy Snow Showers', './icon/snow.png'],
	95: ['Thunderstorm', './icon/thunderstorm.png'],
	96: ['Thunderstorm With Slight Hail', './icon/thunderstorm.png'],
	99: ['Thunderstorm With Heavy Hail', './icon/thunderstorm.png'],
}

const cityInput = document.querySelector('.city-input')
const searchButton = document.querySelector('.search-button')
const suggestionsList = document.querySelector('.suggestions')
const modal = document.querySelector('.modal')

let currentWeather = null
let currentCityName = ''
let debounceTimer

function getWeatherInfo(code) {
	return weatherCodeMap[code] || ['Unknown', './icon/cloudy.png']
}

// ---------- Geocoding ----------
async function fetchCities(query, count = 5) {
	const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
		query
	)}&count=${count}`
	const response = await fetch(url)
	const data = await response.json()
	return data.results || []
}

// ---------- Autocomplete ----------
cityInput.addEventListener('input', () => {
	clearTimeout(debounceTimer)
	const query = cityInput.value.trim()

	if (query.length < 2) {
		hideSuggestions()
		return
	}

	// debounce
	debounceTimer = setTimeout(async () => {
		try {
			const cities = await fetchCities(query)
			renderSuggestions(cities)
		} catch (error) {
			console.error(error)
		}
	}, 300)
})

function renderSuggestions(cities) {
	suggestionsList.innerHTML = ''

	if (cities.length === 0) {
		hideSuggestions()
		return
	}

	cities.forEach(place => {
		const li = document.createElement('li')
		const region = place.admin1 ? `, ${place.admin1}` : ''
		li.textContent = `${place.name}${region}, ${place.country || ''}`
		li.addEventListener('click', () => {
			cityInput.value = place.name
			hideSuggestions()
			loadWeather(place)
		})
		suggestionsList.appendChild(li)
	})

	suggestionsList.classList.add('visible')
}

function hideSuggestions() {
	suggestionsList.classList.remove('visible')
	suggestionsList.innerHTML = ''
}

document.addEventListener('click', e => {
	if (!e.target.closest('.search-box')) hideSuggestions()
})

// ---------- Search ----------
searchButton.addEventListener('click', searchCity)
cityInput.addEventListener('keydown', e => {
	if (e.key === 'Enter') searchCity()
})

async function searchCity() {
	const query = cityInput.value.trim()
	if (!query) return

	clearTimeout(debounceTimer)
	hideSuggestions()

	try {
		const cities = await fetchCities(query, 1)
		if (cities.length === 0) {
			alert('City not found')
			return
		}
		loadWeather(cities[0])
	} catch (error) {
		console.error(error)
		alert('Something went wrong. Please try again.')
	}
}

// ---------- Weather ----------
async function loadWeather(place) {
	const { latitude, longitude, country, name } = place

	const weatherUrl =
		`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
		`&current_weather=true` +
		`&daily=weathercode,temperature_2m_max,temperature_2m_min` +
		`&hourly=temperature_2m,weathercode,precipitation_probability,windspeed_10m` +
		`&timezone=auto&forecast_days=5`

	try {
		const response = await fetch(weatherUrl)
		const weatherData = await response.json()

		currentWeather = weatherData
		currentCityName = country ? `${name}, ${country}` : name

		const { temperature, windspeed, weathercode } = weatherData.current_weather
		const [condition, image] = getWeatherInfo(weathercode)

		document.querySelector('.city').innerText = currentCityName
		document.querySelector('.weather-image').src = image
		document.querySelector('.temperature').innerText = temperature
		document.querySelector('.weather-condition').innerText = condition
		document.querySelector('.wind-speed').innerText = windspeed

		renderForecast(weatherData.daily)
		document.querySelector('.placeholder').classList.add('hidden')
		document.querySelector('.weather-result').classList.remove('hidden')

		localStorage.setItem('lastCity', JSON.stringify(place))
	} catch (error) {
		console.error(error)
		alert('Something went wrong. Please try again.')
	}
}

// ---------- Daily forecast ----------
function renderForecast(daily) {
	const container = document.querySelector('.forecast')
	container.innerHTML = ''

	daily.time.forEach((date, i) => {
		const [condition, image] = getWeatherInfo(daily.weathercode[i])
		const dayName =
			i === 0
				? 'Today'
				: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })

		const card = document.createElement('div')
		card.className = 'forecast-day'
		card.innerHTML = `
			<p class="forecast-date">${dayName}</p>
			<img src="${image}" alt="${condition}" class="forecast-icon" />
			<p class="forecast-temp">
				${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(
			daily.temperature_2m_min[i]
		)}°
			</p>
		`
		card.addEventListener('click', () => openHourly(i))
		container.appendChild(card)
	})
}

// ---------- Hourly popup ----------
function openHourly(dayIndex) {
	const day = currentWeather.daily.time[dayIndex]
	const hourly = currentWeather.hourly
	const container = document.querySelector('.hourly')
	container.innerHTML = ''

	const dateLabel = new Date(day).toLocaleDateString('en-US', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
	})
	document.querySelector(
		'.modal-title'
	).innerText = `${currentCityName} — ${dateLabel}`

	hourly.time.forEach((t, i) => {
		if (!t.startsWith(day)) return

		const [condition, image] = getWeatherInfo(hourly.weathercode[i])
		const row = document.createElement('div')
		row.className = 'hourly-row'
		row.innerHTML = `
			<span class="hourly-time">${t.slice(11, 16)}</span>
			<img src="${image}" alt="${condition}" class="hourly-icon" />
			<span class="hourly-temp">${Math.round(hourly.temperature_2m[i])}°C</span>
			<span class="hourly-rain">💧 ${hourly.precipitation_probability[i]}%</span>
			<span class="hourly-wind">${Math.round(hourly.windspeed_10m[i])} km/h</span>
		`
		container.appendChild(row)
	})

	modal.classList.remove('hidden')
}

function closeModal() {
	modal.classList.add('hidden')
}

document.querySelector('.modal-close').addEventListener('click', closeModal)
modal.addEventListener('click', e => {
	if (e.target === modal) closeModal()
})
document.addEventListener('keydown', e => {
	if (e.key === 'Escape') closeModal()
})

// ---------- Restore last city ----------
const savedCity = localStorage.getItem('lastCity')
if (savedCity) {
	try {
		const place = JSON.parse(savedCity)
		cityInput.value = place.name
		loadWeather(place)
	} catch (error) {
		localStorage.removeItem('lastCity')
	}
}
