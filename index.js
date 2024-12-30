
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


// -----------------------------------------------  LEAFLET LOGIC ------------------------------------------------------------------
// Initialize the map
const map = L.map('map').setView([48.2082, 16.3738], 13); // Centered on Vienna

// Add a "stumme Karte" tile layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors, © CartoDB'
}).addTo(map);


// Function to generate a unique user ID (replace with actual logic)
function generateUserId() {
    // Example: Generate a random string ID for demonstration purposes
    return 'user_' + Math.random().toString(36).substring(7);
}
// define the unique userID for this session
let session_UUID = generateUserId();


// Add click event to place a marker
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

// Listen for changes in the Firebase Realtime Database and update the map with markers
const usersRef = ref(database, 'users/');
onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Clear the existing markers from the map
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });
    
    console.log("ABCDEFGHABIGLAJG");
    
    // Iterate through all users and add a marker for each one
    for (const userId in data) {
        const userData = data[userId];
        const lat = userData.latitude;
        const lon = userData.longitude;

        // Add marker for each user
        L.marker([lat, lon]).addTo(map)
            .bindPopup(`User: ${userId}<br>Lat: ${lat}, Lng: ${lon}`)
            .openPopup();
        }
    }
});
