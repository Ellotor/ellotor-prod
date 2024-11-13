document.addEventListener('DOMContentLoaded', function() {
    // All the form-related variables go below:
    const params = new URLSearchParams(window.location.search);
    const stand = params.get('stand');
    const action = params.get('action');
    
    // Update the form heading
    document.getElementById('form-heading').innerText = `${action.charAt(0).toUpperCase() + action.slice(1)} : ${stand}`;
    
    const form = document.getElementById('start-form');
    const startTimeInput = document.getElementById('start-time');
    const nameInput = document.getElementById('name');
    const mobileInput = document.getElementById('mobile');
    const mobileError = document.getElementById('mobile-error'); // Error message for mobile input

    const security500 = document.getElementById('security-500');
    const security1000 = document.getElementById('security-1000');
    const security1500 = document.getElementById('security-1500');
    const securityOther = document.getElementById('security-other');
    const securityOtherInput = document.getElementById('other-amount');
    const securityError = document.getElementById('security-error'); // Error message for security input
    const offlineCheckbox = document.getElementById('offline');
    const onlineCheckbox = document.getElementById('online');

    // Set default mobile number with country code (91)
    mobileInput.value = '91'; // Pre-fill the mobile input with '91' on page load

    // Function Definitions First (Ensure they are accessible globally)

    // Mobile validation (ensures 12 digits, starting with 91)
    function validateMobileNumber() {
        const mobile = mobileInput.value;
        // Check if the mobile number is exactly 12 characters and starts with '91'
        if (mobile.length !== 12 || isNaN(mobile) || !mobile.startsWith('91')) {
            mobileError.textContent = "Please enter a valid 12-digit mobile number starting with 91.";
            mobileInput.setCustomValidity('Invalid mobile number');
        } else {
            mobileError.textContent = "";
            mobileInput.setCustomValidity('');
        }
    }

    // Security "Other" input validation: Ensure it's numeric
    function validateNumericInput(event) {
        const value = event.target.value;
        if (isNaN(value) || value.trim() === "") {
            securityError.textContent = "Please enter a valid number.";
            event.target.setCustomValidity("Please enter a valid number");
        } else {
            securityError.textContent = "";
            event.target.setCustomValidity("");
        }
    }

    // Event listener to populate start time as soon as the name is entered
    nameInput.addEventListener('input', function() {
        if (nameInput.value.trim() !== '') {
            startTimeInput.value = new Date().toLocaleString();
            mobileInput.value = '91';
            validateMobileNumber();  // Ensure mobile number is validated
        }
    });

    // Security Amount logic: disable other options when one is selected
    function disableOtherSecurityCheckboxes(selectedCheckbox) {
        const checkboxes = [security500, security1000, security1500, securityOther];
        checkboxes.forEach(checkbox => {
            if (checkbox !== selectedCheckbox) {
                checkbox.disabled = selectedCheckbox.checked;
            }
        });
    }

    function disableOtherPaymentCheckboxes(selectedCheckbox) {
        const checkboxes = [offlineCheckbox, onlineCheckbox];
        checkboxes.forEach(checkbox => {
            if (checkbox !== selectedCheckbox) {
                checkbox.disabled = selectedCheckbox.checked;
            }
        });
    }

    security500.addEventListener('change', function() {
        disableOtherSecurityCheckboxes(security500);
        if (!security500.checked) {
            securityOtherInput.style.display = 'none';
            securityOtherInput.value = '';
        }
    });

    security1000.addEventListener('change', function() {
        disableOtherSecurityCheckboxes(security1000);
        if (!security1000.checked) {
            securityOtherInput.style.display = 'none';
            securityOtherInput.value = '';
        }
    });

    security1500.addEventListener('change', function() {
        disableOtherSecurityCheckboxes(security1500);
        if (!security1500.checked) {
            securityOtherInput.style.display = 'none';
            securityOtherInput.value = '';
        }
    });

    securityOther.addEventListener('change', function() {
        disableOtherSecurityCheckboxes(securityOther);
        if (securityOther.checked) {
            securityOtherInput.style.display = 'block';
        } else {
            securityOtherInput.style.display = 'none';
            securityOtherInput.value = ''; // Clear the value when unchecked
            securityError.textContent = ''; // Clear any validation error
            securityOtherInput.setCustomValidity(''); // Reset the custom validity
        }
    });

    offlineCheckbox.addEventListener('change', function() {
        disableOtherPaymentCheckboxes(offlineCheckbox);
    });

    onlineCheckbox.addEventListener('change', function() {
        disableOtherPaymentCheckboxes(onlineCheckbox);
    });

    // Increment and decrement logic for rides
    function updateRideQuantity(inputId, increment) {
        const rideInput = document.getElementById(inputId);
        let currentValue = parseInt(rideInput.value);
        currentValue = increment ? currentValue + 1 : Math.max(0, currentValue - 1);
        rideInput.value = currentValue;
    }

    // Attach event listeners to increment/decrement buttons
    document.getElementById('single-increment').addEventListener('click', function() {
        updateRideQuantity('single', true);
    });
    document.getElementById('single-decrement').addEventListener('click', function() {
        updateRideQuantity('single', false);
    });

    document.getElementById('double-increment').addEventListener('click', function() {
        updateRideQuantity('double', true);
    });
    document.getElementById('double-decrement').addEventListener('click', function() {
        updateRideQuantity('double', false);
    });

    document.getElementById('ellotor-increment').addEventListener('click', function() {
        updateRideQuantity('ellotor', true);
    });
    document.getElementById('ellotor-decrement').addEventListener('click', function() {
        updateRideQuantity('ellotor', false);
    });
    document.getElementById('kids-increment').addEventListener('click', function() {
        updateRideQuantity('kids', true);
    });
    document.getElementById('kids-decrement').addEventListener('click', function() {
        updateRideQuantity('kids', false);
    });
    document.getElementById('babyride-increment').addEventListener('click', function() {
        updateRideQuantity('babyride', true);
    });
    document.getElementById('babyride-decrement').addEventListener('click', function() {
        updateRideQuantity('babyride', false);
    });	

    // Revalidate fields on input to ensure updated values are valid
    mobileInput.addEventListener('input', validateMobileNumber);
    securityOtherInput.addEventListener('input', function(event) {
        // Only validate the "Other" field if the checkbox is checked
        if (securityOther.checked) {
            validateNumericInput(event);
        }
    });

    // Form submission handling
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission to handle custom validation

        // Re-validate Mobile Number and Security Amount before submission
        validateMobileNumber();
        
        // Only validate "Other" amount if the "Other" checkbox is checked
        if (securityOther.checked) {
            validateNumericInput({ target: securityOtherInput });
        }

        // Check if all required fields are filled
        const singleQy = parseInt(document.getElementById('single').value);
        const doubleQy = parseInt(document.getElementById('double').value);
        const ellotorQy = parseInt(document.getElementById('ellotor').value);
		const kidsQy = parseInt(document.getElementById('kids').value);
		const babyriderQy = parseInt(document.getElementById('babyride').value);
        const selectedSecurityAmount = security500.checked || security1000.checked || security1500.checked || (securityOther.checked && securityOtherInput.value.trim() !== "");
        const selectedPaymentMode = offlineCheckbox.checked || onlineCheckbox.checked;

        let isValid = true;

        // Validate rides
        if (singleQy === 0 && doubleQy === 0 && ellotorQy === 0 && kidsQy === 0 && babyriderQy === 0) {
            alert("Please select at least one ride.");
            isValid = false;
        }

        // Validate security amount
        if (!selectedSecurityAmount) {
            alert("Please select a valid security amount.");
            isValid = false;
        }

        // Validate mode of payment
        if (!selectedPaymentMode) {
            alert("Please select a mode of payment (Online or Offline).");
            isValid = false;
        }

        // Prevent form submission if the mobile number is invalid
        if (mobileInput.validity.invalid) {
            isValid = false;
        }

        if (!isValid) {
            return; // Prevent form submission
        }

        // If all validations pass, proceed with form submission
        let mobile = mobileInput.value.trim();
        if (!mobile.startsWith('91')) {
            mobile = '91' + mobile;  // Prepend '91' if it doesn't start with it
            mobileInput.value = mobile; // Update the input field with the new mobile value
        }

        // Get form values
        const name = nameInput.value;
        const startTime = startTimeInput.value;
        const endTime = ''; // Placeholder as endTime isn't defined in HTML
        const paymentMode = offlineCheckbox.checked ? 'Offline' : 'Online';
        
        // Get selected ride quantities
        const singleQty = parseInt(document.getElementById('single').value);
        const doubleQty = parseInt(document.getElementById('double').value);
        const ellotorQty = parseInt(document.getElementById('ellotor').value);
		const kidsQty = parseInt(document.getElementById('kids').value);
		const babyrideQty = parseInt(document.getElementById('babyride').value);
        
        // Get the selected security amount
        const securityAmount = security500.checked ? 500 :
                               security1000.checked ? 1000 :
                               security1500.checked ? 1500 :
                               securityOther.checked ? parseFloat(securityOtherInput.value) : 0;

        // Reset all checkboxes to enable them again after form submission
        const allCheckboxes = [security500, security1000, security1500, securityOther, offlineCheckbox, onlineCheckbox];
        allCheckboxes.forEach(checkbox => checkbox.disabled = false);
        securityOtherInput.style.display = 'none';
		
        // Send the data to the server
        fetch('/submitData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                stand,
                action,
                name,
                mobile,
                startTime,
                endTime,
                paymentMode,
                securityAmount,
                rideSelections: {
                    single: singleQty,
                    double: doubleQty,
                    ellotor: ellotorQty,
					kids:kidsQty,
					babyride:babyrideQty
                }
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Data saved successfully') {
                alert(`Form submitted successfully! Token number: ${data.tokenNo}`);
                // Send WhatsApp message
                const message = `Hello ${name}, your ride details are as follows:\n- Start Time: ${startTime}\n- Security Amount: ${securityAmount}\n- Token No.: ${data.tokenNo}`; 
                const encodedMessage = encodeURIComponent(message);  // Ensure the message is URL-encoded
                const whatsappUrl = `https://wa.me/${mobile}?text=${encodedMessage}`; // Include the message
           
                window.open(whatsappUrl, '_blank'); // Open WhatsApp with the message

                form.reset();
            } else {
                alert('Error saving data');
            }
        })
        .catch(err => {
            alert('Error submitting form');
        });
    });

    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', function() {
            // Reset form validation state without triggering validation
            mobileError.textContent = "";
            securityError.textContent = "";
            mobileInput.setCustomValidity('');
            securityOtherInput.setCustomValidity('');
            
            const previousPage = sessionStorage.getItem('previousPage');
            if (previousPage) {
                window.location.href = previousPage;  // Navigate to the previous page stored in sessionStorage
            } else {
                window.history.back();  // Fallback to browser history if no previous page is stored
            }
        });
    }
});
