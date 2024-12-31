// -----------------------------------------------  USER OR ADMIN? ------------------------------------------------------------------
// index.js
// Function to generate a unique user ID (replace with actual logic)
function generateUserId() {
    // Example: Generate a random string ID for demonstration purposes
    return 'user_' + Math.random().toString(36).substring(7);
}
// define the unique userID for this session
let session_UUID;

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const user = urlParams.get('user');

    if (user === 'admin') {
        session_UUID = "admin";
    } else {
        session_UUID = generateUserId();
    }
    console.log("current UserID: "+session_UUID)

    // Show or hide the button based on the session_UUID
    const clearButton = document.getElementById('clearButton');
    if (session_UUID === 'admin') {
        clearButton.style.display = 'inline-block'; // Show the button
    } else {
        clearButton.style.display = 'none'; // Hide the button
    }
});


// ----------------------------------------------- POPUP FUNCTIONS ------------------------------------------------------------------


function greatcircledistance(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => degrees * (Math.PI / 180); // Convert degrees to radians

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const radLat1 = toRadians(lat1);
    const radLat2 = toRadians(lat2);

    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(radLat1) * Math.cos(radLat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers
}


function calculateStats(distanceArray) {
    // Sort the array in ascending order
    console.log(distanceArray)
    const sortedArray = [...distanceArray].sort((a, b) => a - b);
    console.log(sortedArray)

    // Calculate median
    const mid = Math.floor(sortedArray.length / 2);
    const median = sortedArray.length % 2 === 0 
        ? (sortedArray[mid - 1] + sortedArray[mid]) / 2
        : sortedArray[mid];

    // Calculate average
    const sum = distanceArray.reduce((acc, val) => acc + val, 0);
    const average = sum / distanceArray.length;

    // Get min and max
    const min = Math.min(...distanceArray);
    const max = Math.max(...distanceArray);

    return { median, average, min, max };
}


// -----------------------------------------------  FIREBASE LOGIC ------------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, set, remove, onValue } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

const firebaseConfig = {
apiKey: "AIzaSyC0yacHCUnoApDu4valcrxMKC0EZr7jMec",
authDomain: "inclassfirebase-72ef8.firebaseapp.com",
databaseURL: "https://inclassfirebase-72ef8-default-rtdb.europe-west1.firebasedatabase.app",
projectId: "inclassfirebase-72ef8",
storageBucket: "inclassfirebase-72ef8.firebasestorage.app",
messagingSenderId: "819820712674",
appId: "1:819820712674:web:f739e395be4a6a093a84bb",
measurementId: "G-QD52LB1BYV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);


// write data to the db
function writeUserData(userId, lat, lon) {
    const reference = ref(database, 'users/' + userId);
    set(reference, {
        latitude: lat,
        longitude: lon
    });
}


// remove all data from the db when clicking the clear button
document.getElementById('clearButton').addEventListener('click', clear_db);

function clear_db() {
    const reference = ref(database, 'users/');
    remove(reference);
}


// Listen for changes in the Firebase Realtime Database and update the map with markers
const usersRef = ref(database, 'users/');
onValue(usersRef, (snapshot) => {
    console.log("change detected in database")
    const data = snapshot.val();

    // Clear the existing markers from the map
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    
    let blueMarkers = [];
    let redMarker = null;

    // Iterate through all users and add a marker for each one
    for (const userId in data) {
        const userData = data[userId];
        const lat = userData.latitude;
        const lon = userData.longitude;

        // Create the marker
        const marker = L.marker([lat, lon]);
        
        // Check if the user is 'admin' and apply the red marker if true
        if (userId === 'admin') {
            // keep track of the red marker and don't put it on the map yet
            redMarker = marker
            
        } else {
            // add to the blue marker list to keep track of the distance and put it on the map
            blueMarkers.push(marker)
            marker.addTo(map);
        }      
    }

    if (redMarker) {
        if (new URLSearchParams(window.location.search).get('user') === 'admin') {
            // for the ADMIN - show the red Marker and calculate the statistics
            redMarker.addTo(map)
            redMarker.getElement().classList.add('red-marker');

            let distanceArray = [];

            // print lat long
            const redLatLng = redMarker.getLatLng();

            for (const blueMarker of blueMarkers) {
                let blueLatLng = blueMarker.getLatLng();
                console.log(redLatLng.lat, redLatLng.lng, blueLatLng.lat, blueLatLng.lng)
                distanceArray.push(greatcircledistance(redLatLng.lat, redLatLng.lng, blueLatLng.lat, blueLatLng.lng))
            }
            
            // run the calculateStats function
            const stats = calculateStats(distanceArray)
        
            let popupString = `
            <b>Distance Statistics:</b><br>
            Average Distance: ${stats.average.toFixed(3)} km<br>
            Median Distance: ${stats.median.toFixed(3)} km<br>
            Max Distance: ${stats.max.toFixed(3)} km<br>
            Min Distance: ${stats.min.toFixed(3)} km
        `;
            // Popup that includes information about distance
            redMarker.bindPopup(popupString).openPopup();

        } else {
            // for other USERS - only show the red Marker
            redMarker.addTo(map)
            redMarker.getElement().classList.add('red-marker');
        }
    }
});

// -----------------------------------------------  LEAFLET LOGIC ------------------------------------------------------------------
// Initialize the map
const map = L.map('map').setView([48.2082, 16.3738], 13); // Centered on Vienna

// Add a "stumme Karte" tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


// Add click event to add into database
let marker;
map.on('click', function(e) {
    if (marker) {
        map.removeLayer(marker); // Remove existing marker
    }

    // Pass the actual latitude and longitude to the writeUserData function
    const lat = e.latlng.lat.toFixed(5);
    const lng = e.latlng.lng.toFixed(5);
    writeUserData(session_UUID, lat, lng);
});
