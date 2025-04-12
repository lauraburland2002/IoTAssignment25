document.addEventListener("DOMContentLoaded", () => {
    // Constants
    const API_URL = "http://localhost:8000";

    // Load latest votes on page load
    loadLatestVotes();
    
    // Add event listeners to form buttons
    const votingWindowsForm = document.getElementById('votingWindowsForm');
    if (votingWindowsForm) {
        votingWindowsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitVotingWindows();
        });
    }

    /**
     * Loads the latest votes from the API and displays them in the table
     */
    function loadLatestVotes() {
        const tbody = document.querySelector('#votesTable tbody');
        if (!tbody) return;

        fetch(`${API_URL}/votes/latest`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Clear any existing rows
                tbody.innerHTML = '';
                
                // Add new rows
                data.forEach(vote => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${vote.username || 'Anonymous'}</td>
                        <td>${formatTimestamp(vote.timestamp)}</td>
                        <td>${vote.temperature}°C</td>
                    `;
                    tbody.appendChild(row);
                });
                
                // Display message if no votes
                if (data.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="3" class="text-center">No votes in the current time window</td>';
                    tbody.appendChild(row);
                }
            })
            .catch(error => {
                console.error('Error fetching votes:', error);
                displayError(tbody, 'Failed to load votes. Please try again.');
            });
    }

    /**
     * Formats a timestamp string into a localized time string
     */
    function formatTimestamp(timestamp) {
        try {
            return new Date(timestamp).toLocaleTimeString();
        } catch (e) {
            return timestamp || 'Unknown';
        }
    }

    /**
     * Displays an error message in the table
     */
    function displayError(container, message) {
        container.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-danger">${message}</td>
            </tr>
        `;
    }

    /**
     * Submits the voting windows form to update the voting time windows
     */
    function submitVotingWindows() {
        // Get form values
        const start1 = document.getElementById("start1")?.value;
        const end1 = document.getElementById("end1")?.value;
        const start2 = document.getElementById("start2")?.value;
        const end2 = document.getElementById("end2")?.value;
        
        if (!start1 || !end1 || !start2 || !end2) {
            showNotification('Please fill in all time fields', 'error');
            return;
        }

        // Send to API
        fetch(`${API_URL}/update_custom_voting_windows`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                start_1: start1,
                end_1: end1,
                start_2: start2,
                end_2: end2
            })
        })
        .then(response => response.json())
        .then(data => {
            showNotification(data.message || data.detail, data.detail ? 'error' : 'success');
        })
        .catch(err => {
            console.error("Error:", err);
            showNotification('Failed to update voting windows', 'error');
        });
    }

    /**
     * Shows a notification to the user
     */
    function showNotification(message, type = 'info') {
        // You can implement this with a custom notification system or use alert()
        alert(message);
    }

    // Set up auto-refresh of votes table (every 30 seconds)
    setInterval(loadLatestVotes, 30000);
});