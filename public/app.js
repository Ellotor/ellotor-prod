// Wait for the DOM to fully load before executing any code
document.addEventListener('DOMContentLoaded', function () {

    // Function to show the buttons based on the selected stand
    window.selectStand = function (stand) {
        // Hide the Stand Selection buttons
        const standSelection = document.getElementById('stand-selection');
        standSelection.style.display = 'none';
        
        // Show the ride section with dynamic heading and buttons
        const rideSection = document.getElementById('ride-section');
        rideSection.style.display = 'block';

        // Update the dynamic heading to reflect the selected stand
        const standHeading = document.getElementById('selected-stand-heading');
        standHeading.textContent = `Selected Stand: ${stand}`; // Set the heading text

        // Show the back button
        const backButton = document.getElementById('back-button');
        backButton.style.display = 'inline-block';
        
        // Store the selected stand in the URL and reload the page with the stand parameter
        window.location.href = `first.html?stand=${stand}`; // Navigate to the same page with selected stand
    };

    // Function to redirect to the start, current, or fetch-data page based on action
    window.redirectToActionPage = function (action) {
        // Get the current stand from the URL
        const params = new URLSearchParams(window.location.search);
        const stand = params.get('stand');

        // Redirect to the corresponding page with the action and stand as query parameters
        if (action === 'start') {
            window.location.href = `start-page.html?stand=${stand}&action=start`;
        } else if (action === 'current') {
            window.location.href = `current.html?stand=${stand}&action=current`;
        } else if (action === 'end') {
            window.location.href = `end.html?stand=${stand}&action=fetch-data`;
        }
    };

    // Function to handle the Back button click for Stand Selection
    window.goBack = function () {
        // Hide the ride section and back button
        const rideSection = document.getElementById('ride-section');
        rideSection.style.display = 'none';
        
        const backButton = document.getElementById('back-button');
        backButton.style.display = 'none';
        
        // Show the stand selection buttons
        const standSelection = document.getElementById('stand-selection');
        standSelection.style.display = 'block';
        
        // Reset the URL to remove the "stand" query parameter
        window.history.pushState({}, '', 'first.html');
    };

    // New function to redirect to index.html from the Select Stand section
    window.goBackpage = function () {
        // Redirect to index.html
        window.location.href = 'index.html';
    };

    // Get the query parameters from the URL
    const params = new URLSearchParams(window.location.search);
    const stand = params.get('stand');
    
    // If a stand is selected, hide the stand selection buttons and show the action buttons
    if (stand) {
        const standSelection = document.getElementById('stand-selection');
        standSelection.style.display = 'none'; // Hide stand selection
        
        const rideSection = document.getElementById('ride-section');
        rideSection.style.display = 'block'; // Show ride section
        
        // Update the dynamic heading with the selected stand
        const standHeading = document.getElementById('selected-stand-heading');
        standHeading.textContent = `Selected Stand: ${stand}`; // Set the heading text
        
        // Show the back button
        const backButton = document.getElementById('back-button');
        backButton.style.display = 'inline-block';
    }

    // Store the current page URL as the previous page when the page loads
    sessionStorage.setItem('previousPage', window.location.href);

});
