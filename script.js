const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbytwgXBO9DP8VjjrKfzQiCz_UyUWKsDJU999AMSLdo3a1ZghUKzAKJzqacTzQhezoqGDWg4biD3MB/pub?output=csv';
const CACHE_KEY = 'pen_finder_data_v3';
const CACHE_EXPIRY = 3600000;

let studentData = [];
let isDataLoaded = false;

// DOM Elements
const nameInput = document.getElementById('nameInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const noResults = document.getElementById('noResults');
const toastContainer = document.getElementById('toastContainer');

/**
 * Show a modern toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', type === 'success' ? 'check-circle' : 'alert-circle');
    
    const text = document.createElement('span');
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    toastContainer.appendChild(toast);
    
    lucide.createIcons();

    // Remove toast after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

/**
 * Fetch and parse CSV data
 */
async function loadData() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_EXPIRY) {
                studentData = data;
                isDataLoaded = true;
                showToast("Database Connected Successfully");
                return;
            }
        }

        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error("Failed to fetch data");
        
        const csvText = await response.text();
        parseCSV(csvText);
        
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: studentData,
            timestamp: Date.now()
        }));

        isDataLoaded = true;
        showToast("Database Connected Successfully");
    } catch (error) {
        console.error("Error loading data:", error);
        showToast("Not connected to database", "error");
    }
}

/**
 * Simple CSV parser
 */
function parseCSV(text) {
    const lines = text.split('\n');
    studentData = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length >= 7) {
            studentData.push({
                class: parts[0].trim().toUpperCase(),
                section: parts[1].trim(),
                name: parts[2].trim().toUpperCase(),
                gender: parts[3].trim(),
                fatherName: parts[4].trim().toUpperCase(),
                motherName: parts[5].trim().toUpperCase(),
                penNo: parts[6].trim()
            });
        }
    }
}

/**
 * Perform search with Student Name
 */
function performSearch() {
    const nameQuery = nameInput.value.trim().toUpperCase();
    
    if (!nameQuery) {
        showToast("Please enter the student name", "error");
        return;
    }

    if (!isDataLoaded) {
        showToast("Database is still connecting...", "error");
        return;
    }

    resultsGrid.innerHTML = '';
    noResults.classList.add('hidden');

    const results = studentData.filter(student => student.name === nameQuery);

    if (results.length > 0) {
        renderResults(results);
    } else {
        noResults.classList.remove('hidden');
    }
}

/**
 * Render student cards
 */
function renderResults(results) {
    resultsGrid.innerHTML = results.map(student => `
        <div class="result-card">
            <div class="card-banner">
                <div class="banner-left">
                    <i data-lucide="shield-check"></i>
                    <span class="banner-text">Official Student Record</span>
                </div>
                <div class="banner-right">
                    <span class="banner-text">Verified</span>
                </div>
            </div>
            <div class="card-body">
                <div class="student-identity">
                    <span class="class-badge">${student.class} - ${student.section}</span>
                    <h2>${student.name}</h2>
                    <span class="data-label">Student Full Name</span>
                </div>
                
                <div class="data-grid">
                    <div class="data-item">
                        <span class="data-label">Father's Name</span>
                        <span class="data-value">${student.fatherName}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">Mother's Name</span>
                        <span class="data-value">${student.motherName}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">Gender</span>
                        <span class="data-value">${student.gender}</span>
                    </div>
                </div>
                
                <div class="pen-section">
                    <span class="pen-label">Permanent Education No.</span>
                    <div class="pen-number">${student.penNo}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Refresh icons
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Event Listeners
document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    performSearch();
});

// Load data on startup
window.addEventListener('DOMContentLoaded', loadData);
