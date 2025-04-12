document.addEventListener("DOMContentLoaded", function () {
    // Initialize FAQ component
    initializeFAQ();
    
    /**
     * Initializes the FAQ section with equal height buttons and toggle functionality
     */
    function initializeFAQ() {
        const buttons = document.querySelectorAll(".faq-question");
        const answers = document.querySelectorAll(".faq-answer");
        
        if (buttons.length === 0) return;
        
        // Equalize button heights
        equalizeButtonHeights(buttons);
        
        // Add click event listeners
        setupToggleEvents(buttons, answers);
    }
    
    /**
     * Makes all buttons the same height based on the tallest one
     */
    function equalizeButtonHeights(buttons) {
        // Find the maximum height among all buttons
        let maxHeight = 0;
        buttons.forEach(button => {
            if (button.offsetHeight > maxHeight) {
                maxHeight = button.offsetHeight;
            }
        });
        
        // Set all buttons to the maximum height
        if (maxHeight > 0) {
            buttons.forEach(button => {
                button.style.height = maxHeight + "px";
            });
        }
    }
    
    /**
     * Sets up the click events to toggle answer visibility
     */
    function setupToggleEvents(buttons, answers) {
        buttons.forEach((button, index) => {
            if (index >= answers.length) return;
            
            button.addEventListener("click", function () {
                const answer = answers[index];
                const isVisible = answer.style.display === "block";
                
                // Toggle this answer
                answer.style.display = isVisible ? "none" : "block";
                
                // Optionally, add active state to button
                button.classList.toggle("active", !isVisible);
            });
        });
    }
});