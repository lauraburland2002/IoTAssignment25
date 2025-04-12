document.addEventListener("DOMContentLoaded", () => {
    // DOM elements
    const slider = document.getElementById("temperatureSlider");
    const output = document.getElementById("temperatureValue");
    const submitButton = document.getElementById("submitVote");
    const message = document.getElementById("message");
    const outsideTemp = document.getElementById("outsideTemp");
    const weatherCondition = document.getElementById("weatherCondition");
    const weatherIcon = document.getElementById("weatherIcon");
    const pastVotesTable = document.getElementById("pastVotes");

    // Weather code mappings
    const weatherDescriptions = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Rime Fog", 51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Heavy Drizzle",
        61: "Light Rain", 63: "Moderate Rain", 65: "Heavy Rain", 80: "Light Showers",
        81: "Moderate Showers", 82: "Heavy Showers", 95: "Thunderstorm", 96: "Thunderstorm with hail",
        99: "Severe Thunderstorm"
    };

    const weatherIcons = {
        0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
        51: "🌦️", 53: "🌧️", 55: "🌧️", 61: "🌧️", 63: "🌧️", 65: "🌧️",
        80: "🌦️", 81: "🌦️", 82: "⛈️", 95: "⛈️", 96: "⛈️", 99: "🌩️"
    };

    // Backend API URL - should be configurable
    const API_URL = "http://localhost:8000";
    
    // VAPID public key for push notifications
    const VAPID_PUBLIC_KEY = "YOUR_PUBLIC_KEY"; // Replace with your actual key

    // Event listeners
    if (slider) {
        slider.oninput = () => {
            output.textContent = `${slider.value}°C`;
        };
    }

    if (submitButton) {
        submitButton.addEventListener("click", submitVote);
    }

    // Initialize the page
    initPage();

    // Functions
    function initPage() {
        // Get user location and fetch weather
        initWeather();
        
        // Register service worker and subscribe to push
        initPushNotifications();
        
        // Display past votes if available
        displayPastVotes();
    }

    function submitVote() {
        const selectedTemperature = slider.value;
        
        if (!isVotingWindowOpen()) {
            showMessage("Voting is only allowed during designated voting windows.", "red");
            return;
        }

        // Send vote to backend
        fetch(`${API_URL}/vote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ temperature: parseFloat(selectedTemperature) })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            showMessage(data.message || `Vote submitted: ${selectedTemperature}°C`, "green");
            saveVoteLocally(selectedTemperature);
            displayPastVotes();
        })
        .catch(error => {
            console.error("Error submitting vote:", error);
            showMessage("Error submitting vote. Please try again.", "red");
        });
    }

    function isVotingWindowOpen() {
        const currentDate = new Date();
        const currentHour = currentDate.getHours();
        const currentMinute = currentDate.getMinutes();

        // Default voting windows: 9:00-9:15 AM and 1:00-1:15 PM
        return (
            (currentHour === 9 && currentMinute >= 0 && currentMinute <= 15) ||
            (currentHour === 13 && currentMinute >= 0 && currentMinute <= 15)
        );
    }

    function showMessage(text, color) {
        if (message) {
            message.textContent = text;
            message.style.color = color || "black";
        }
    }

    function saveVoteLocally(temp) {
        const votes = JSON.parse(localStorage.getItem("votes")) || [];
        votes.push({ time: new Date().toLocaleString(), temp });
        localStorage.setItem("votes", JSON.stringify(votes));
    }

    function displayPastVotes() {
        if (!pastVotesTable) return;
        
        const votes = JSON.parse(localStorage.getItem("votes")) || [];
        const tbody = pastVotesTable.querySelector("tbody") || pastVotesTable;
        
        // Clear existing rows
        tbody.innerHTML = "";
        
        // Add votes to table
        votes.forEach(vote => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${vote.time}</td>
                <td>${vote.temp}°C</td>
            `;
            tbody.appendChild(row);
        });
    }

    function initWeather() {
        if (!outsideTemp) return;
        
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setWeatherUnavailable("Location access denied");
                }
            );
        } else {
            setWeatherUnavailable("Geolocation not supported");
        }
    }

    function fetchWeather(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const temp = data.current.temperature_2m;
                const weatherCode = data.current.weathercode;
                
                if (outsideTemp) outsideTemp.textContent = `${temp}°C`;
                if (weatherCondition) weatherCondition.textContent = weatherDescriptions[weatherCode] || "Unknown Weather";
                if (weatherIcon) weatherIcon.innerHTML = weatherIcons[weatherCode] || "❓";
            })
            .catch(error => {
                console.error("Error fetching weather:", error);
                setWeatherUnavailable("Unavailable");
            });
    }

    function setWeatherUnavailable(message) {
        if (outsideTemp) outsideTemp.textContent = message || "Unavailable";
        if (weatherCondition) weatherCondition.textContent = "Unavailable";
        if (weatherIcon) weatherIcon.innerHTML = "❓";
    }

    function initPushNotifications() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        // Register service worker
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log("Service Worker Registered!", registration);
                return requestNotificationPermission(registration);
            })
            .catch(error => {
                console.error("Service Worker Error", error);
            });
    }

    function requestNotificationPermission(registration) {
        return Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                return subscribeToPush(registration);
            }
        });
    }

    function subscribeToPush(registration) {
        return registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
        .then(subscription => {
            // Send subscription to backend
            return fetch(`${API_URL}/subscribe`, {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: { 'Content-Type': 'application/json' }
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to subscribe to push notifications');
            }
            console.log('Push notification subscription successful');
        })
        .catch(error => {
            console.error("Push subscription error:", error);
        });
    }

    // Helper function to convert base64 to Uint8Array for VAPID key
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
});