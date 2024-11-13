document.addEventListener('DOMContentLoaded', function () {
    // Define the current page and number of records per page
    let currentPage = 1;
    const recordsPerPage = 10;
    let stand = '';  // Variable to store the stand selected
    let filteredData = [];  // To store the filtered data based on stand
    let excludedTokens = [];  // List of tokens with non-empty endTime

    // Get the stand from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('stand')) {
        stand = urlParams.get('stand');
        document.getElementById('stand-name').textContent = stand;  // Display the selected stand
    } else {
        document.getElementById('stand-name').textContent = 'Stand not selected';
    }

    // Function to fetch data based on the selected stand
    function fetchData(page) {
        fetch('/getAllData')  // You can modify this URL if you're already sending the stand in the API request
            .then(response => response.json())
            .then(data => {
                // Filter data based on the selected stand and only include records where endTime is empty
                filteredData = data.filter(record => record.stand === stand && (!record.endTime || record.endTime.trim() === ''));

                const startIndex = (page - 1) * recordsPerPage;
                const endIndex = startIndex + recordsPerPage;

                // Slice the filtered data to show only the records for the current page
                const paginatedData = filteredData.slice(startIndex, endIndex);

                // Update the table content dynamically
                const tableBody = document.getElementById('data-table-body');
                tableBody.innerHTML = ''; // Clear existing data

                if (paginatedData.length > 0) {
                    paginatedData.forEach(record => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${record.tokenNo}</td>
							<td>${record.stand}</td>
                            <td>${record.name}</td>
                            <td>${record.mobile}</td>
                            <td>${record.startTime}</td>
                            <td>${record.endTime}</td>
                            <td>${record.paymentMode}</td>
                            <td>${record.securityAmount}</td>
                            <td>${record.rideSelections.single}</td>
                            <td>${record.rideSelections.double}</td>
                            <td>${record.rideSelections.ellotor}</td>
							<td>${record.rideSelections.kids}</td>
							<td>${record.rideSelections.babyride}</td>
                        `;
                        tableBody.appendChild(tr);
                    });
                } else {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td colspan="10">No data available</td>`;
                    tableBody.appendChild(tr);
                }

                // Update pagination controls
                document.getElementById('page-number').textContent = `Page ${page}`;
                document.getElementById('prev-button').disabled = page === 1;
                document.getElementById('next-button').disabled = endIndex >= filteredData.length;
            })
            .catch(err => {
                console.error('Error fetching data:', err);
                alert('Error fetching data');
            });
    }

    // Function to change the page
    function changePage(direction) {
        if (direction === 'prev' && currentPage > 1) {
            currentPage--;
        } else if (direction === 'next' && currentPage * recordsPerPage < filteredData.length) {
            currentPage++;
        }
        fetchData(currentPage);
    }

    // Event listener for the 'Back' button
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', function () {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/'; // Fallback URL if no history
            }
        });
    }

    // Pagination button listeners
    document.getElementById('prev-button').addEventListener('click', function () {
        changePage('prev');
    });

    document.getElementById('next-button').addEventListener('click', function () {
        changePage('next');
    });

    // Fetch initial data for the first page
    fetchData(currentPage);
});
