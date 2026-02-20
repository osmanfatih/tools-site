document.addEventListener('DOMContentLoaded', () => {
    const curlForm = document.getElementById('curl-form');
    const outputTextarea = document.getElementById('output');
    const addHeaderBtn = document.getElementById('add-header-btn');
    const headersContainer = document.getElementById('headers-container');
    const authMethodSelect = document.getElementById('auth-method');
    const basicAuthFields = document.getElementById('basic-auth-fields');
    const bearerAuthFields = document.getElementById('bearer-auth-fields');
    const copyBtn = document.getElementById('copy-btn');

    // Add new header input fields
    addHeaderBtn.addEventListener('click', () => {
        const headerRow = document.createElement('div');
        headerRow.classList.add('header-row');
        headerRow.innerHTML = `
            <input type="text" name="header-key[]" placeholder="Key (e.g. Content-Type)">
            <input type="text" name="header-value[]" placeholder="Value (e.g. application/json)">
            <button type="button" class="remove-header-btn icon-btn" aria-label="Remove">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        `;
        headersContainer.appendChild(headerRow);
    });

    // Remove header input fields
    headersContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-header-btn');
        if (removeBtn) {
            removeBtn.closest('.header-row').remove();
        }
    });

    // Toggle authentication fields
    authMethodSelect.addEventListener('change', () => {
        basicAuthFields.classList.add('hidden');
        bearerAuthFields.classList.add('hidden');

        if (authMethodSelect.value === 'basic') {
            basicAuthFields.classList.remove('hidden');
        } else if (authMethodSelect.value === 'bearer') {
            bearerAuthFields.classList.remove('hidden');
        }
    });

    // Generate CURL command on form submit
    curlForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(curlForm);
        let curlCommand = 'curl';

        // Method
        const method = formData.get('method');
        curlCommand += ` -X ${method}`;

        // URL
        const url = formData.get('url');
        curlCommand += ` '${url}'`;

        // Headers
        const headerKeys = formData.getAll('header-key[]');
        const headerValues = formData.getAll('header-value[]');
        headerKeys.forEach((key, i) => {
            const value = headerValues[i];
            if (key && value) {
                curlCommand += ` \\\n  -H '${key}: ${value}'`;
            }
        });

        // Authentication
        const authMethod = formData.get('auth-method');
        if (authMethod === 'basic') {
            const username = formData.get('username');
            const password = formData.get('password');
            if (username && password) {
                curlCommand += ` \\\n  -u '${username}:${password}'`;
            }
        } else if (authMethod === 'bearer') {
            const token = formData.get('bearer-token');
            if (token) {
                curlCommand += ` \\\n  -H 'Authorization: Bearer ${token}'`;
            }
        }

        // Request Body
        const body = formData.get('body');
        if (body) {
            curlCommand += ` \\\n  -d '${body}'`;
        }

        outputTextarea.value = curlCommand;
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', () => {
        outputTextarea.select();
        document.execCommand('copy');
    });
});
