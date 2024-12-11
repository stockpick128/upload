document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const webhookInput = document.getElementById('webhookUrl');
    const statusDiv = document.getElementById('uploadStatus');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const files = fileInput.files;
        const webhookUrl = webhookInput.value.trim();

        if (!files.length) {
            showStatus('Please select at least one file to upload.', 'error');
            return;
        }

        if (!webhookUrl) {
            showStatus('Please enter a Make.com webhook URL.', 'error');
            return;
        }

        try {
            showStatus('Uploading files...', 'info');

            // Create FormData object to send files
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }

            // First, convert files to base64
            const filePromises = Array.from(files).map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve({
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            content: reader.result
                        });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            const fileData = await Promise.all(filePromises);

            // Prepare data for webhook
            const webhookData = {
                files: fileData,
                timestamp: new Date().toISOString(),
                source: 'File Upload System'
            };

            // Send to webhook
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhookData)
            });

            if (!response.ok) {
                throw new Error('Failed to send data to webhook');
            }

            showStatus('Files uploaded and sent to Make.com successfully!', 'success');
            form.reset();

        } catch (error) {
            console.error('Upload error:', error);
            showStatus('Error uploading files: ' + error.message, 'error');
        }
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = '';
        statusDiv.classList.add('status-' + (type || 'info'));
    }

    // File input change handler to show selected files
    fileInput.addEventListener('change', function() {
        const files = this.files;
        let fileList = '';
        for (let i = 0; i < files.length; i++) {
            fileList += `${files[i].name} (${formatFileSize(files[i].size)})\n`;
        }
        if (fileList) {
            showStatus('Selected files:\n' + fileList, 'info');
        }
    });

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
