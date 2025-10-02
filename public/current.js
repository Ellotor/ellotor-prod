document.addEventListener('DOMContentLoaded', function () { 
    // Define the current page and number of records per page
    let currentPage = 1;
    const recordsPerPage = 10;
    let stand = '';  
    let filteredData = [];  
    let excludedTokens = [];  

    // Get the stand from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('stand')) {
        stand = urlParams.get('stand');
        document.getElementById('stand-name').textContent = stand;  
    } else {
        document.getElementById('stand-name').textContent = 'Stand not selected';
    }

    // Function to fetch data based on the selected stand
    function fetchData(page) {
        fetch('/getAllData')
            .then(response => response.json())
            .then(data => {
                filteredData = data.filter(record => record.stand === stand && (!record.endTime || record.endTime.trim() === ''));

                const startIndex = (page - 1) * recordsPerPage;
                const endIndex = startIndex + recordsPerPage;

                const paginatedData = filteredData.slice(startIndex, endIndex);

                const tableBody = document.getElementById('data-table-body');
                tableBody.innerHTML = ''; 

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
                    tr.innerHTML = `<td colspan="13">No data available</td>`;
                    tableBody.appendChild(tr);
                }

                document.getElementById('page-number').textContent = `Page ${page}`;
                document.getElementById('prev-button').disabled = page === 1;
                document.getElementById('next-button').disabled = endIndex >= filteredData.length;
            })
            .catch(err => {
                console.error('Error fetching data:', err);
                alert('Error fetching data');
            });
    }

    function changePage(direction) {
        if (direction === 'prev' && currentPage > 1) {
            currentPage--;
        } else if (direction === 'next' && currentPage * recordsPerPage < filteredData.length) {
            currentPage++;
        }
        fetchData(currentPage);
    }

    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', function () {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/';
            }
        });
    }

    document.getElementById('prev-button').addEventListener('click', function () {
        changePage('prev');
    });

    document.getElementById('next-button').addEventListener('click', function () {
        changePage('next');
    });

    // Fetch initial data for the first page
    fetchData(currentPage);

    // ------------------ Auto-refresh every 15 seconds ------------------
    setInterval(() => {
        fetchData(currentPage);
    }, 15000); // 15000ms = 15 seconds
});
