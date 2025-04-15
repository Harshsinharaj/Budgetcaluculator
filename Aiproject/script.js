// DOM Elements
const incomeInput = document.getElementById('income');
const rentInput = document.getElementById('rent');
const foodInput = document.getElementById('food');
const transportationInput = document.getElementById('transportation');
const utilitiesInput = document.getElementById('utilities');
const entertainmentInput = document.getElementById('entertainment');
const othersInput = document.getElementById('others');
const savingsTargetInput = document.getElementById('savings-target');

const calculateBtn = document.getElementById('calculate-btn');
const resetBtn = document.getElementById('reset-btn');
const themeToggle = document.getElementById('theme-toggle');

const totalIncomeElement = document.getElementById('total-income');
const totalExpensesElement = document.getElementById('total-expenses');
const remainingBalanceElement = document.getElementById('remaining-balance');
const savingsProgressBar = document.getElementById('savings-progress-bar');
const savingsPercentage = document.getElementById('savings-percentage');
const savingsTargetDisplay = document.getElementById('savings-target-display');

// Chart Element
const expenseChartCanvas = document.getElementById('expense-chart');
let expenseChart = null;

// Local Storage Keys
const STORAGE_KEYS = {
    INCOME: 'budgetPlanner_income',
    EXPENSES: 'budgetPlanner_expenses',
    SAVINGS_TARGET: 'budgetPlanner_savingsTarget',
    THEME: 'budgetAppTheme'
};

// Event Listeners
calculateBtn.addEventListener('click', calculateBudget);
resetBtn.addEventListener('click', resetBudget);
savingsTargetInput.addEventListener('input', updateSavingsGoal);
themeToggle.addEventListener('click', toggleTheme);

// Fix layout issues on resize
window.addEventListener('resize', debounce(fixLayoutIssues, 200));

// Auto-save on window unload
window.addEventListener('beforeunload', saveDataToLocalStorage);

// Real-time calculation
const inputFields = [incomeInput, rentInput, foodInput, transportationInput, utilitiesInput, entertainmentInput, othersInput];

inputFields.forEach(input => {
    // Add event listeners for real-time updates
    input.addEventListener('input', function() {
        // Input validation
        validateInput(this);
        
        // Update progress bars
        updateInputFeedback(this);
        
        // Calculate in real-time
        calculateBudgetRealTime();
        
        // Save changes to localStorage for persistence
        saveDataToLocalStorage();
    });
    
    // Add focus effect
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });
});

// Debounce function to limit function execution frequency
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to save data to localStorage
function saveDataToLocalStorage() {
    // Save income
    localStorage.setItem(STORAGE_KEYS.INCOME, incomeInput.value || '');
    
    // Save expenses
    const expenses = {
        rent: rentInput.value || '',
        food: foodInput.value || '',
        transportation: transportationInput.value || '',
        utilities: utilitiesInput.value || '',
        entertainment: entertainmentInput.value || '',
        others: othersInput.value || ''
    };
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    
    // Save savings target
    localStorage.setItem(STORAGE_KEYS.SAVINGS_TARGET, savingsTargetInput.value || '');
}

// Function to load data from localStorage
function loadDataFromLocalStorage() {
    // Load income
    const savedIncome = localStorage.getItem(STORAGE_KEYS.INCOME);
    if (savedIncome) {
        incomeInput.value = savedIncome;
    }
    
    // Load expenses
    const savedExpensesJson = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (savedExpensesJson) {
        try {
            const savedExpenses = JSON.parse(savedExpensesJson);
            rentInput.value = savedExpenses.rent || '';
            foodInput.value = savedExpenses.food || '';
            transportationInput.value = savedExpenses.transportation || '';
            utilitiesInput.value = savedExpenses.utilities || '';
            entertainmentInput.value = savedExpenses.entertainment || '';
            othersInput.value = savedExpenses.others || '';
        } catch (e) {
            console.error('Error parsing saved expenses', e);
        }
    }
    
    // Load savings target
    const savedSavingsTarget = localStorage.getItem(STORAGE_KEYS.SAVINGS_TARGET);
    if (savedSavingsTarget) {
        savingsTargetInput.value = savedSavingsTarget;
    }
    
    // Calculate budget with saved values
    if (savedIncome || savedExpensesJson) {
        calculateBudgetRealTime();
    }
}

// Function to fix layout issues
function fixLayoutIssues() {
    // Get dimensions
    const container = document.querySelector('.container');
    const budgetContainer = document.querySelector('.budget-container');
    const inputSection = document.querySelector('.input-section');
    const resultsSection = document.querySelector('.results-section');
    
    // Ensure proper width calculations
    if (window.innerWidth < 992) {
        inputSection.style.width = '100%';
        resultsSection.style.width = '100%';
    } else {
        inputSection.style.width = '';
        resultsSection.style.width = '';
    }
    
    // Force redraw to fix Chrome layout issues
    budgetContainer.style.display = 'none';
    void budgetContainer.offsetHeight; // Force reflow
    budgetContainer.style.display = 'flex';
    
    // Fix chart layout
    fixChartLayout();
}

// Enhanced input validation
function validateInput(input) {
    // Remove non-numeric characters except decimal point
    input.value = input.value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = input.value.split('.');
    if (parts.length > 2) {
        input.value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Prevent negative values
    if (parseFloat(input.value) < 0) {
        input.value = '0';
    }
    
    // Validate maximum value (prevent unreasonable entries)
    const value = parseFloat(input.value) || 0;
    const maxValue = 999999; // Set a reasonable maximum value
    
    if (value > maxValue) {
        input.value = maxValue.toString();
        applyShakeAnimation(input.parentElement);
        
        // Show toast notification
        showNotification('Value exceeded maximum limit', 'warning');
    }
}

// Show notification toast
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification type and message
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Show notification
    notification.style.display = 'block';
    notification.style.opacity = '1';
    
    // Hide notification after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 500);
    }, 3000);
}

// Update progress bar for inputs
function updateInputFeedback(input) {
    const feedbackBar = input.nextElementSibling.querySelector('.bar');
    const value = parseFloat(input.value) || 0;
    
    // Calculate percentage based on input type
    let percentage = 0;
    if (input === incomeInput) {
        // For income, scale is different (up to common income ranges)
        percentage = Math.min((value / 10000) * 100, 100);
    } else {
        // For expenses, percentage is relative to income
        const income = parseFloat(incomeInput.value) || 1; // Avoid division by zero
        percentage = Math.min((value / income) * 100, 100);
    }
    
    // Update the bar width with smooth animation
    feedbackBar.style.width = percentage + '%';
    
    // Update color based on percentage (for expenses only)
    if (input !== incomeInput && percentage > 0) {
        if (percentage > 50) {
            feedbackBar.style.background = 'linear-gradient(90deg, var(--warning-color), var(--danger-color))';
        } else if (percentage > 30) {
            feedbackBar.style.background = 'linear-gradient(90deg, var(--secondary-color), var(--warning-color))';
        } else {
            feedbackBar.style.background = 'linear-gradient(90deg, var(--secondary-color), var(--primary-color))';
        }
    }
}

// Real-time budget calculation (no animation, just updates)
function calculateBudgetRealTime() {
    // Get input values
    const income = parseFloat(incomeInput.value) || 0;
    const expenses = {
        rent: parseFloat(rentInput.value) || 0,
        food: parseFloat(foodInput.value) || 0,
        transportation: parseFloat(transportationInput.value) || 0,
        utilities: parseFloat(utilitiesInput.value) || 0,
        entertainment: parseFloat(entertainmentInput.value) || 0,
        others: parseFloat(othersInput.value) || 0
    };
    
    // Calculate totals
    const totalExpenses = Object.values(expenses).reduce((total, expense) => total + expense, 0);
    const remainingBalance = income - totalExpenses;
    
    // Format currency
    const formatCurrency = (amount) => {
        return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    };
    
    // Update summary without animation
    totalIncomeElement.textContent = formatCurrency(income);
    totalExpensesElement.textContent = formatCurrency(totalExpenses);
    remainingBalanceElement.textContent = formatCurrency(remainingBalance);
    
    // Update balance color
    if (remainingBalance < 0) {
        remainingBalanceElement.style.color = 'var(--danger-color)';
    } else if (remainingBalance === 0) {
        remainingBalanceElement.style.color = 'var(--warning-color)';
    } else {
        remainingBalanceElement.style.color = 'var(--secondary-color)';
    }
    
    // Update savings goal if it exists
    if (savingsTargetInput.value) {
        updateSavingsGoal();
    }
    
    // Only update chart when there are values to show
    if (totalExpenses > 0) {
        updateExpenseChart(expenses);
    }
}

// Calculate Budget Function (with animations, triggered by button)
function calculateBudget() {
    // Get input values
    const income = parseFloat(incomeInput.value) || 0;
    const expenses = {
        rent: parseFloat(rentInput.value) || 0,
        food: parseFloat(foodInput.value) || 0,
        transportation: parseFloat(transportationInput.value) || 0,
        utilities: parseFloat(utilitiesInput.value) || 0,
        entertainment: parseFloat(entertainmentInput.value) || 0,
        others: parseFloat(othersInput.value) || 0
    };
    
    // Calculate totals
    const totalExpenses = Object.values(expenses).reduce((total, expense) => total + expense, 0);
    const remainingBalance = income - totalExpenses;
    
    // Apply animation to results
    animateValue(totalIncomeElement, income);
    animateValue(totalExpensesElement, totalExpenses);
    animateValue(remainingBalanceElement, remainingBalance);
    
    // Update balance color
    if (remainingBalance < 0) {
        remainingBalanceElement.style.color = 'var(--danger-color)';
    } else if (remainingBalance === 0) {
        remainingBalanceElement.style.color = 'var(--warning-color)';
    } else {
        remainingBalanceElement.style.color = 'var(--secondary-color)';
    }
    
    // Update chart
    updateExpenseChart(expenses);
    
    // Update savings goal
    updateSavingsGoal();
    
    // Add visual feedback for the calculate button
    calculateBtn.classList.add('active');
    setTimeout(() => {
        calculateBtn.classList.remove('active');
    }, 200);
    
    // Shake elements that need attention
    if (income === 0) {
        applyShakeAnimation(incomeInput.parentElement);
    }
    
    // Celebrate if budget is balanced
    if (income > 0 && remainingBalance >= 0) {
        celebrate();
    }
}

// Reset Budget Function
function resetBudget() {
    // Clear all inputs
    inputFields.forEach(input => {
        input.value = '';
        updateInputFeedback(input);
    });
    
    // Clear savings target
    savingsTargetInput.value = '';
    
    // Reset summary
    totalIncomeElement.textContent = '$0.00';
    totalExpensesElement.textContent = '$0.00';
    remainingBalanceElement.textContent = '$0.00';
    remainingBalanceElement.style.color = 'inherit';
    
    // Reset savings goal
    savingsProgressBar.style.width = '0%';
    savingsPercentage.textContent = '0%';
    savingsTargetDisplay.textContent = '$0';
    
    // Destroy chart if it exists
    if (expenseChart) {
        expenseChart.destroy();
        expenseChart = null;
    }
    
    // Add visual feedback for the reset button
    resetBtn.classList.add('active');
    setTimeout(() => {
        resetBtn.classList.remove('active');
    }, 200);
}

// Update Savings Goal
function updateSavingsGoal() {
    const savingsTarget = parseFloat(savingsTargetInput.value) || 0;
    const remainingBalance = parseFloat(remainingBalanceElement.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    
    // Format and display target
    savingsTargetDisplay.textContent = '$' + savingsTarget.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    
    // Calculate percentage of goal achieved
    let percentage = 0;
    if (savingsTarget > 0) {
        percentage = Math.min((remainingBalance / savingsTarget) * 100, 100);
    }
    
    // Update progress bar
    savingsProgressBar.style.width = percentage + '%';
    savingsPercentage.textContent = Math.round(percentage) + '%';
    
    // Update color based on percentage
    if (percentage >= 100) {
        savingsProgressBar.style.background = 'linear-gradient(90deg, var(--secondary-color), #27ae60)';
        savingsPercentage.style.color = 'var(--secondary-color)';
    } else if (percentage >= 50) {
        savingsProgressBar.style.background = 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))';
        savingsPercentage.style.color = 'var(--primary-color)';
    } else if (percentage > 0) {
        savingsProgressBar.style.background = 'linear-gradient(90deg, var(--warning-color), var(--primary-color))';
        savingsPercentage.style.color = 'var(--warning-color)';
    } else {
        savingsProgressBar.style.background = 'linear-gradient(90deg, var(--danger-color), var(--warning-color))';
        savingsPercentage.style.color = 'var(--danger-color)';
    }
}

// Update Expense Chart
function updateExpenseChart(expenses) {
    // Filter out zero values for better chart representation
    const filteredExpenses = {};
    Object.entries(expenses).forEach(([key, value]) => {
        if (value > 0) {
            filteredExpenses[key] = value;
        }
    });
    
    // Labels and data
    const labels = Object.keys(filteredExpenses).map(key => key.charAt(0).toUpperCase() + key.slice(1));
    const data = Object.values(filteredExpenses);
    
    // If no expenses with value, show empty chart with message
    if (data.length === 0) {
        if (expenseChart) {
            expenseChart.destroy();
            expenseChart = null;
        }
        
        const ctx = expenseChartCanvas.getContext('2d');
        ctx.clearRect(0, 0, expenseChartCanvas.width, expenseChartCanvas.height);
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#aaa' : '#666';
        ctx.fillText('No expenses entered yet', expenseChartCanvas.width/2, expenseChartCanvas.height/2);
        
        return null;
    }
    
    // Colors with transparency
    const bgColors = [
        'rgba(52, 152, 219, 0.7)',  // Blue
        'rgba(46, 204, 113, 0.7)',  // Green
        'rgba(155, 89, 182, 0.7)',  // Purple
        'rgba(231, 76, 60, 0.7)',   // Red
        'rgba(241, 196, 15, 0.7)',  // Yellow
        'rgba(26, 188, 156, 0.7)'   // Teal
    ];
    
    // Check if we're in dark mode and adjust text color
    const isDarkMode = document.body.classList.contains('dark-theme');
    const textColor = isDarkMode ? '#e0e0e0' : '#333';
    
    // Destroy previous chart if exists
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    // Create new chart
    expenseChart = new Chart(expenseChartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors.slice(0, data.length),
                borderColor: isDarkMode ? 'rgba(20, 20, 31, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor,
                        font: {
                            size: 12
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(20, 20, 31, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    titleColor: isDarkMode ? '#e0e0e0' : '#333',
                    bodyColor: isDarkMode ? '#e0e0e0' : '#333',
                    borderColor: isDarkMode ? '#444' : '#ddd',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `$${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000,
                easing: 'easeOutCubic'
            },
            onResize: function(chart, size) {
                // Fix for chart resize issues
                setTimeout(() => {
                    fixChartLayout();
                }, 50);
            }
        }
    });
    
    return expenseChart;
}

// Fix chart layout issues
function fixChartLayout() {
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer && expenseChart) {
        // Ensure chart is properly sized
        chartContainer.style.height = window.innerWidth < 768 ? '250px' : '300px';
        expenseChart.resize();
    }
}

// Animation function for number changes
function animateValue(element, newValue) {
    // Get current value
    const currentText = element.textContent;
    const currentValue = parseFloat(currentText.replace(/[^0-9.-]+/g, '')) || 0;
    
    // Set up animation parameters
    const duration = 500; // ms
    const steps = 20;
    const step = (newValue - currentValue) / steps;
    let count = 0;
    
    // Perform animation
    const timer = setInterval(() => {
        count++;
        const progress = Math.min(count / steps, 1);
        const currentStep = currentValue + (step * progress * steps);
        element.textContent = '$' + currentStep.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        
        if (count >= steps) {
            clearInterval(timer);
            element.textContent = '$' + newValue.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        }
    }, duration / steps);
}

// Apply shake animation to an element
function applyShakeAnimation(element) {
    element.classList.add('shake');
    setTimeout(() => {
        element.classList.remove('shake');
    }, 500);
}

// Celebration effect when budget is balanced
function celebrate() {
    // Add subtle confetti effect or some visual indication
    const resultSection = document.querySelector('.results-section');
    resultSection.classList.add('celebrate');
    setTimeout(() => {
        resultSection.classList.remove('celebrate');
    }, 1500);
}

// Theme Toggle Functions
function toggleTheme() {
    const body = document.body;
    const themeIcon = themeToggle.querySelector('i');
    
    // Toggle theme class
    body.classList.toggle('dark-theme');
    
    // Update icon
    if (body.classList.contains('dark-theme')) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
    
    // Update chart with new theme colors
    calculateBudgetRealTime();
    
    // Show theme change notification
    showNotification(`Switched to ${body.classList.contains('dark-theme') ? 'dark' : 'light'} theme`, 'info');
}

// Load saved theme
function loadSavedTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const themeIcon = themeToggle.querySelector('i');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
}

// Chatbot Elements
const chatbotTrigger = document.getElementById('chatbot-trigger');
const chatbotContainer = document.getElementById('chatbot-container');
const chatbotMinimize = document.getElementById('chatbot-minimize');
const chatbotClose = document.getElementById('chatbot-close');
const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotInput = document.getElementById('chatbot-input');
const chatbotSend = document.getElementById('chatbot-send');
const chatbotHeader = document.querySelector('.chatbot-header');
const suggestionChips = document.querySelectorAll('.suggestion-chip');

// Chatbot state and data
const STORAGE_KEY_CHAT_HISTORY = 'budgetPlanner_chatHistory';
let isChatbotOpen = false;
let isChatbotMinimized = false;
let isTypingResponse = false;
let chatbotPosition = { x: 0, y: 0 };
let chatHistory = [];

// Chatbot knowledge base
const botResponses = {
    greeting: [
        "Hello! I'm your budget assistant. How can I help you today?",
        "Hi there! I can help you manage your finances better. What would you like to know?",
        "Welcome! I'm here to answer your budget-related questions."
    ],
    farewell: [
        "Goodbye! Feel free to return if you have more questions.",
        "Have a great day! I'm here when you need financial advice.",
        "See you later! Remember to stick to your budget plan."
    ],
    thanks: [
        "You're welcome! Anything else I can help with?",
        "Happy to help! Let me know if you need more information.",
        "My pleasure! Any other questions about your budget?"
    ],
    unknown: [
        "I'm not sure how to answer that. Could you rephrase your question?",
        "I don't have information on that topic yet. Would you like to know about something else?",
        "I'm still learning and don't have an answer for that. Try asking about budgeting or saving money."
    ],
    savingMoney: [
        "Here are some tips to save money: 1) Create a budget and stick to it, 2) Use the 50/30/20 rule - 50% for needs, 30% for wants, and 20% for savings, 3) Cut unnecessary subscriptions, 4) Plan your meals to reduce food waste, 5) Compare prices before making big purchases.",
        "To save money effectively: 1) Automate your savings by setting up automatic transfers, 2) Save unexpected income like bonuses, 3) Challenge yourself to no-spend days, 4) Use cashback and rewards programs, 5) Reduce energy consumption at home.",
        "Smart saving strategies include: 1) Building an emergency fund first, 2) Pay off high-interest debt, 3) Use the 24-hour rule before making non-essential purchases, 4) Try buying second-hand for certain items, 5) Look for free activities and entertainment."
    ],
    budgetTips: [
        "Budget tips: 1) Track all expenses - even small ones, 2) Review your spending weekly, 3) Adjust your budget regularly to match reality, 4) Use dedicated budget apps, 5) Involve all family members in budgeting decisions.",
        "Effective budgeting: 1) Start with your actual income after taxes, 2) List all fixed expenses first, 3) Allocate funds for savings before discretionary spending, 4) Use cash envelopes for categories where you tend to overspend, 5) Plan for irregular expenses like car maintenance.",
        "Budgeting best practices: 1) Be realistic - an overly restrictive budget won't work, 2) Include some 'fun money' to avoid feeling deprived, 3) Use zero-based budgeting where every dollar has a purpose, 4) Separate needs from wants, 5) Review and celebrate your progress regularly."
    ],
    expenseAnalysis: {
        // This will be dynamically generated based on user data
        high: "I notice your {category} expenses are relatively high at {percentage}% of your income. The recommended percentage is usually around {recommended}%. Consider finding ways to reduce this expense.",
        normal: "Your {category} expenses are within a normal range at {percentage}% of your income.",
        low: "Your {category} expenses are quite low at {percentage}% of your income, which is excellent budgeting!"
    },
    incomeSuggestions: [
        "Want to increase your income? Consider: 1) Asking for a raise, 2) Freelancing with your skills, 3) Selling items you no longer need, 4) Renting out a spare room, 5) Looking for better-paying job opportunities.",
        "Besides your primary job, you could boost income by: 1) Starting a small side business, 2) Monetizing a hobby, 3) Taking part in the gig economy, 4) Investing in dividend-paying stocks, 5) Teaching or tutoring in your area of expertise.",
        "Income diversification ideas: 1) Create and sell digital products, 2) Start a YouTube channel or podcast, 3) Participate in focus groups or surveys, 4) Become a rideshare driver, 5) Offer services on platforms like Fiverr or Upwork."
    ],
    investmentBasics: [
        "Investment basics: 1) Start with retirement accounts like 401(k) or IRA, 2) Use index funds for diversification, 3) Consider your risk tolerance based on age and goals, 4) Reinvest dividends, 5) Avoid timing the market - consistency is key.",
        "For beginners, consider: 1) Building an emergency fund before investing, 2) Using robo-advisors for automated investing, 3) Dollar-cost averaging to reduce timing risk, 4) Learning about compound interest, 5) Starting small rather than waiting to have a large sum.",
        "Smart investment strategies: 1) Diversify across asset classes, 2) Keep fees low with index ETFs, 3) Only invest money you won't need for 5+ years, 4) Rebalance your portfolio annually, 5) Focus on the long-term and ignore market noise."
    ]
};

// Recommended percentages for expenses
const recommendedPercentages = {
    rent: 30,
    food: 15,
    transportation: 10,
    utilities: 10,
    entertainment: 5,
    others: 10
};

// Initialize chatbot
function initChatbot() {
    // Event listeners for chatbot controls
    chatbotTrigger.addEventListener('click', toggleChatbot);
    chatbotMinimize.addEventListener('click', minimizeChatbot);
    chatbotClose.addEventListener('click', closeChatbot);
    chatbotSend.addEventListener('click', sendMessage);
    chatbotInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Make suggestion chips clickable
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', function() {
            chatbotInput.value = this.textContent;
            sendMessage();
        });
    });
    
    // Load chat history
    loadChatHistory();
    
    // Make chatbot draggable
    makeDraggable(chatbotHeader, chatbotContainer);
}

// Load chat history from localStorage
function loadChatHistory() {
    const savedHistory = localStorage.getItem(STORAGE_KEY_CHAT_HISTORY);
    if (savedHistory) {
        try {
            chatHistory = JSON.parse(savedHistory);
            
            // Display up to last 10 messages
            const recentMessages = chatHistory.slice(-10);
            recentMessages.forEach(message => {
                appendMessage(message.sender, message.text);
            });
            
            // Scroll to bottom
            scrollToBottom();
        } catch (e) {
            console.error('Error loading chat history', e);
            chatHistory = [];
        }
    } else {
        // Add welcome message for first-time users
        setTimeout(() => {
            const welcomeMessage = "Hello! I'm your Budget Assistant. I can help answer questions about your budget, saving money, and financial planning. What would you like to know?";
            appendMessage('bot', welcomeMessage);
            saveMessage('bot', welcomeMessage);
        }, 500);
    }
}

// Save chat history to localStorage
function saveChatHistory() {
    // Keep only the last 50 messages to avoid localStorage limits
    if (chatHistory.length > 50) {
        chatHistory = chatHistory.slice(-50);
    }
    localStorage.setItem(STORAGE_KEY_CHAT_HISTORY, JSON.stringify(chatHistory));
}

// Save a message to the chat history
function saveMessage(sender, text) {
    chatHistory.push({ sender, text, timestamp: new Date().toISOString() });
    saveChatHistory();
}

// Toggle chatbot visibility
function toggleChatbot() {
    isChatbotOpen = !isChatbotOpen;
    
    if (isChatbotOpen) {
        chatbotContainer.classList.add('open');
        isChatbotMinimized = false;
        chatbotContainer.classList.remove('minimized');
        scrollToBottom();
    } else {
        chatbotContainer.classList.remove('open');
    }
}

// Minimize chatbot
function minimizeChatbot() {
    isChatbotMinimized = !isChatbotMinimized;
    
    if (isChatbotMinimized) {
        chatbotContainer.classList.add('minimized');
    } else {
        chatbotContainer.classList.remove('minimized');
        scrollToBottom();
    }
}

// Close chatbot
function closeChatbot() {
    isChatbotOpen = false;
    chatbotContainer.classList.remove('open');
}

// Send a message from the user
function sendMessage() {
    const message = chatbotInput.value.trim();
    
    if (message && !isTypingResponse) {
        // Display user message
        appendMessage('user', message);
        saveMessage('user', message);
        
        // Clear input
        chatbotInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Process message and get response
        setTimeout(() => {
            const response = processMessage(message);
            hideTypingIndicator();
            appendMessage('bot', response);
            saveMessage('bot', response);
            scrollToBottom();
            
            // Generate additional follow-up if needed
            if (Math.random() > 0.7) { // 30% chance of follow-up
                setTimeout(() => {
                    showTypingIndicator();
                    setTimeout(() => {
                        const followUp = getFollowUpQuestion();
                        hideTypingIndicator();
                        appendMessage('bot', followUp);
                        saveMessage('bot', followUp);
                        scrollToBottom();
                    }, 1000 + Math.random() * 1000);
                }, 1000);
            }
        }, 1000 + Math.random() * 1000); // Simulate thinking time
    }
}

// Process the user message and return an appropriate response
function processMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for greetings
    if (/^(hi|hello|hey|greetings|howdy|hola)/i.test(lowerMessage)) {
        return getRandomResponse(botResponses.greeting);
    }
    
    // Check for farewells
    if (/^(bye|goodbye|see you|farewell|cya)/i.test(lowerMessage)) {
        return getRandomResponse(botResponses.farewell);
    }
    
    // Check for thanks
    if (/^(thanks|thank you|thx|ty)/i.test(lowerMessage)) {
        return getRandomResponse(botResponses.thanks);
    }
    
    // Check for saving money questions
    if (/how (can|do) (i|we|you) save money|saving money|save more|tips for saving/i.test(lowerMessage)) {
        return getRandomResponse(botResponses.savingMoney);
    }
    
    // Check for budget tips
    if (/budget tips|budgeting tips|how to budget|budget advice|budgeting help/i.test(lowerMessage)) {
        return getRandomResponse(botResponses.budgetTips);
    }
    
    // Check for expense explanation
    if (/explain my expenses|analyze (my )?expenses|expense (breakdown|analysis)|where (is|does) my money (go|going)/i.test(lowerMessage)) {
        return analyzeExpenses();
    }
    
    // Check for income improvement questions
    if (/how to (make|earn) more money|increase (my )?income|earn extra|side hustle|more income/i.test(lowerMessage)) {
        return getRandomResponse(botResponses.incomeSuggestions);
    }
    
    // Check for investment questions
    if (/how (to|should I) invest|investment (advice|tips)|investing basics|start investing/i.test(lowerMessage)) {
        return getRandomResponse(botResponses.investmentBasics);
    }
    
    // If no specific intent is matched, return unknown response
    return getRandomResponse(botResponses.unknown);
}

// Get a random response from an array of possible responses
function getRandomResponse(responses) {
    const index = Math.floor(Math.random() * responses.length);
    return responses[index];
}

// Analyze the user's expenses and provide personalized feedback
function analyzeExpenses() {
    // Get expense values
    const income = parseFloat(incomeInput.value) || 0;
    
    // If no income, return a message asking for income
    if (income === 0) {
        return "I need to know your income first to analyze your expenses. Please enter your income in the Budget Planner.";
    }
    
    const expenses = {
        rent: parseFloat(rentInput.value) || 0,
        food: parseFloat(foodInput.value) || 0,
        transportation: parseFloat(transportationInput.value) || 0,
        utilities: parseFloat(utilitiesInput.value) || 0,
        entertainment: parseFloat(entertainmentInput.value) || 0,
        others: parseFloat(othersInput.value) || 0
    };
    
    // Check if expenses are entered
    const totalExpenses = Object.values(expenses).reduce((sum, value) => sum + value, 0);
    if (totalExpenses === 0) {
        return "I don't see any expenses entered yet. Please add your expenses in the Budget Planner for me to analyze them.";
    }
    
    // Build the analysis
    let analysis = "Here's my analysis of your expenses:\n\n";
    let recommendationCount = 0;
    
    Object.entries(expenses).forEach(([category, amount]) => {
        if (amount > 0) {
            const percentage = ((amount / income) * 100).toFixed(1);
            const recommended = recommendedPercentages[category];
            
            analysis += `• ${category.charAt(0).toUpperCase() + category.slice(1)}: ${percentage}% of income`;
            
            // Add evaluation
            if (percentage > recommended * 1.2) { // 20% higher than recommended
                analysis += ` (Higher than the recommended ${recommended}%)\n`;
                recommendationCount++;
            } else if (percentage < recommended * 0.8) { // 20% lower than recommended
                analysis += ` (Lower than the typical ${recommended}%, which is great!)\n`;
            } else {
                analysis += ` (Within the typical range of ${recommended}%)\n`;
            }
        }
    });
    
    // Add overall assessment
    const savingsRate = ((income - totalExpenses) / income * 100).toFixed(1);
    
    analysis += `\nYour total expenses are ${(totalExpenses / income * 100).toFixed(1)}% of your income, `;
    
    if (savingsRate > 20) {
        analysis += `leaving a savings rate of ${savingsRate}%, which is excellent! Financial experts recommend saving at least 20% of your income.`;
    } else if (savingsRate > 0) {
        analysis += `giving you a savings rate of ${savingsRate}%. Aim to increase this to at least 20% for long-term financial health.`;
    } else {
        analysis += `which means you're spending more than you earn. This is unsustainable and needs immediate attention.`;
    }
    
    // Add recommendations if needed
    if (recommendationCount > 0) {
        analysis += "\n\nWould you like specific tips on how to reduce your expenses in certain categories?";
    }
    
    return analysis;
}

// Get a follow-up question based on the conversation context
function getFollowUpQuestion() {
    const followUps = [
        "Is there anything specific about budgeting you'd like to know more about?",
        "Would you like me to explain more about any financial topic?",
        "Do you have any other questions about your finances?",
        "How else can I help with your financial planning?",
        "Would you like some personalized saving tips based on your current budget?"
    ];
    
    return getRandomResponse(followUps);
}

// Append a message to the chat
function appendMessage(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.className = `chatbot-message ${sender}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    // Handle multi-line messages with proper formatting
    const formattedText = text.replace(/\n/g, '<br>');
    bubble.innerHTML = formattedText;
    
    messageElement.appendChild(bubble);
    chatbotMessages.appendChild(messageElement);
    
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    isTypingResponse = true;
    
    const typingElement = document.createElement('div');
    typingElement.className = 'chatbot-message bot typing-indicator-container';
    typingElement.id = 'typing-indicator';
    
    const typingBubble = document.createElement('div');
    typingBubble.className = 'typing-indicator';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        typingBubble.appendChild(dot);
    }
    
    typingElement.appendChild(typingBubble);
    chatbotMessages.appendChild(typingElement);
    
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    isTypingResponse = false;
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Scroll to the bottom of the chat messages
function scrollToBottom() {
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Make an element draggable
function makeDraggable(handle, element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    if (handle) {
        // If handle is specified, make only the handle trigger dragging
        handle.onmousedown = dragMouseDown;
    } else {
        // Otherwise, use the whole element
        element.onmousedown = dragMouseDown;
    }
    
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // Get the initial mouse position
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // Calculate the new position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Set the element's new position
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        // Boundary check to keep the chatbot within the viewport
        const maxTop = window.innerHeight - 100;
        const maxLeft = window.innerWidth - 100;
        
        element.style.top = Math.min(Math.max(0, newTop), maxTop) + "px";
        element.style.left = Math.min(Math.max(0, newLeft), maxLeft) + "px";
        
        // Store position
        chatbotPosition = {
            x: parseInt(element.style.left) || 0,
            y: parseInt(element.style.top) || 0
        };
    }
    
    function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Initialize the app
function init() {
    // Set default values
    resetBudget();
    
    // Load saved theme
    loadSavedTheme();
    
    // Load saved data
    loadDataFromLocalStorage();
    
    // Fix initial layout issues
    setTimeout(fixLayoutIssues, 100);
    
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Initialize chatbot
    initChatbot();
    
    // Show welcome notification
    setTimeout(() => {
        showNotification('Welcome to Budget Planner!', 'info');
    }, 1000);
}

// Initialize on load
window.onload = init;