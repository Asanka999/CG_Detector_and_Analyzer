document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const startAnalysisBtn = document.getElementById('start-analysis');
    const uploadSection = document.getElementById('upload');
    const dropZone = document.querySelector('.drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadForm = document.getElementById('upload-form');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loadingDiv = document.getElementById('loading');
    const resultsSection = document.getElementById('results');
    const newAnalysisBtn = document.getElementById('new-analysis-btn');
    const analyzedVideo = document.getElementById('analyzed-video');
    const jointAnglesGraph = document.getElementById('joint-angles-graph');
    const cgPositionGraph = document.getElementById('cg-position-graph');
    const cgTrajectoryGraph = document.getElementById('cg-trajectory-graph');
    const dataDownloadLink = document.getElementById('data-download-link');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // API URL - Replace with your actual backend URL
    // (Use http://localhost:5000 for local development)
    const API_URL = 'http://localhost:5000';

    // Smoothly scroll to upload section when start analysis button clicked
    startAnalysisBtn.addEventListener('click', function() {
        uploadSection.scrollIntoView({ behavior: 'smooth' });
    });

    // Handle drag and drop functionality
    ['dragover', 'dragenter'].forEach(eventName => {
        dropZone.addEventListener(eventName, function(e) {
            e.preventDefault();
            dropZone.classList.add('drop-zone-active');
        }, false);
    });

    ['dragleave', 'dragend'].forEach(eventName => {
        dropZone.addEventListener(eventName, function(e) {
            e.preventDefault();
            dropZone.classList.remove('drop-zone-active');
        }, false);
    });

    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drop-zone-active');
       
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            updateFileDetails(e.dataTransfer.files[0]);
        }
    });

    // Handle file selection through file input
    dropZone.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        if (fileInput.files.length) {
            updateFileDetails(fileInput.files[0]);
        }
    });

    // Function to update file details display
    function updateFileDetails(file) {
        const prompt = document.querySelector('.drop-zone-prompt');
       
        // Check if file is valid
        if (!isValidVideoFile(file)) {
            showMessage('Please select a valid video file (.mp4, .avi, .mov, .mkv)', 'error');
            prompt.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drag and drop video or click to browse</p>
            `;
            analyzeBtn.disabled = true;
            return;
        }
       
        // Update drop zone content
        prompt.innerHTML = `
            <i class="fas fa-file-video"></i>
            <p>${file.name}</p>
            <span>Size: ${formatFileSize(file.size)}</span>
        `;
       
        analyzeBtn.disabled = false;
    }

    // Validate file type
    function isValidVideoFile(file) {
        const validTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska'];
        return validTypes.includes(file.type) ||
               file.name.match(/\.(mp4|avi|mov|mkv)$/i);
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }

    // Handle form submission
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
       
        if (!fileInput.files.length) {
            showMessage('Please select a video file first', 'warning');
            return;
        }
       
        // Show loading indicator
        uploadSection.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
       
        // Create form data
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('height', document.getElementById('height-input').value);
       
        // Send request to backend
        fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            loadingDiv.classList.add('hidden');
            displayResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            loadingDiv.classList.add('hidden');
            uploadSection.classList.remove('hidden');
            showMessage('An error occurred during processing. Please try again.', 'error');
        });
    });

    // Display results
    function displayResults(data) {
        // Update video source
        analyzedVideo.src = API_URL + data.video_path;
       
        // Update graph images
        jointAnglesGraph.src = API_URL + data.joint_angles_graph;
        cgPositionGraph.src = API_URL + data.cg_position_graph;
        cgTrajectoryGraph.src = API_URL + data.cg_trajectory_graph;
       
        // Update data download link
        dataDownloadLink.href = API_URL + data.data_path;
       
        // Show results section
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Handle tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
           
            // Add active class to clicked button
            button.classList.add('active');
           
            // Show corresponding content
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Handle new analysis button
    newAnalysisBtn.addEventListener('click', function() {
        resultsSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        uploadForm.reset();
       
        // Reset drop zone
        const prompt = document.querySelector('.drop-zone-prompt');
        prompt.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Drag and drop video or click to browse</p>
        `;
       
        analyzeBtn.disabled = true;
        uploadSection.scrollIntoView({ behavior: 'smooth' });
    });

    // Toast message function
    function showMessage(message, type) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' :
                               type === 'warning' ? 'fa-exclamation-triangle' :
                               'fa-times-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
       
        // Add toast to body
        document.body.appendChild(toast);
       
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
       
        // Remove toast after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 5000);
    }

    // Add toast styles
    const style = document.createElement('style');
    style.innerHTML = `
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: white;
            color: #333;
            border-radius: 4px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transform: translateX(120%);
            transition: transform 0.3s ease;
            z-index: 1000;
            max-width: 350px;
        }
       
        .toast.show {
            transform: translateX(0);
        }
       
        .toast-content {
            display: flex;
            align-items: center;
        }
       
        .toast-content i {
            margin-right: 10px;
            font-size: 1.5rem;
        }
       
        .toast-success i { color: #4caf50; }
        .toast-warning i { color: #ff9800; }
        .toast-error i { color: #f44336; }
    `;
    document.head.appendChild(style);
});