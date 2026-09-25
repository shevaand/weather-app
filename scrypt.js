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

searchButton.addEventListener('click', getWeather)

async function getWeather() {
	const city = cityInput.value.trim()

	// Geocoding API (City → Latitude & Longitude)
	const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}`
	const geoResponse = await fetch(geoUrl)
	const geoData = await geoResponse.json()
	console.log(geoData)

	const latitude = geoData.results[0].latitude
	const longitude = geoData.results[0].longitude
	const country = geoData.results[0].country

	// Weather API
	const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
	const weatherResponse = await fetch(weatherUrl)
	const weatherData = await weatherResponse.json()
	console.log(weatherData)

	const temperature = weatherData.current_weather.temperature
	const windSpeed = weatherData.current_weather.windspeed
	const weatherCode = weatherData.current_weather.weathercode
	const [weatherCondition, weatherImage] = weatherCodeMap[weatherCode]

	if (country && city !== country) {
		document.querySelector('.city').innerText = `${city}, ${country}`
	} else {
		document.querySelector('.city').innerText = `${city}`
	}
	document.querySelector('.weather-image').src = weatherImage
	document.querySelector('.temperature').innerText = temperature
	document.querySelector('.weather-condition').innerText = weatherCondition
	document.querySelector('.wind-speed').innerText = windSpeed
}
