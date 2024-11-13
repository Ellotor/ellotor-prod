document.addEventListener("DOMContentLoaded", function () {
  console.log("Attaching event listener to submit button");
  const submitButton = document.getElementById("submit-billing-button");
  const penaltyInput = document.getElementById("billing-penalty");
  const commentsInput = document.getElementById("billing-comments");
  const reasonInput = document.getElementById("billing-reason");
  const amountReturnedInput = document.getElementById(
    "billing-amount-returned",
  );
  const nameInput = document.getElementById("Banking-name");
  const mobileIn = document.getElementById("Banking-mobile");
  const finalbill = document.getElementById("billing-final-bill");
  const onlineFields = document.getElementById("online-fields");

  if (submitButton) {
    submitButton.addEventListener("click", function (event) {
      console.log("Submit button clicked!");

      // Ensure payment mode is selected
      const onlinePayment = document.getElementById("online-payment");
      const offlinePayment = document.getElementById("offline-payment");
      if (!onlinePayment.checked && !offlinePayment.checked) {
        alert("Please select a payment mode (Online or Offline).");
        event.preventDefault();
        return;
      }
      if (onlineFields.style.display === "block") {
        // If amount-returned is not empty and payment mode is online, ensure name and mobile are filled
        if (amountReturnedInput.value.trim() && onlinePayment.checked) {
          if (!nameInput.value.trim() || !mobileIn.value.trim()) {
            alert("Please fill in both name and mobile number.");
            event.preventDefault();
            return;
          }
        }
      }

      // Ensure billing-comments is filled
      if (!commentsInput.value.trim()) {
        commentsInput.value = "NA"; // Default to 'NA' if empty
      }

      // If penalty is empty, set it to 0
      if (!penaltyInput.value.trim()) {
        penaltyInput.value = 0;
      }

      // If penalty > 0, billing-reason must be filled
      if (penaltyInput.value > 0 && !reasonInput.value.trim()) {
        alert("Please provide a reason for the penalty.");
        event.preventDefault();
        return;
      }

      const tokenNo = document.getElementById("billing-token").value;
      const endTime = document.getElementById("billing-end-date").value;
      const finalBill = document.getElementById("billing-total").value;
      const finalPaymentMode = document.querySelector(
        'input[name="payment-mode"]:checked',
      )?.value;
      const penalty = document.getElementById("billing-penalty").value;
      const comments = document.getElementById("billing-comments")?.value || ""; // Fallback to empty string if undefined

      // Log the values being sent
      console.log("TokenNo:", tokenNo);
      console.log("EndTime:", endTime);
      console.log("FinalBill:", finalBill);
      console.log("PaymentMode:", finalPaymentMode);
      console.log("Penalty:", penalty);
      console.log("Comments:", comments);

      // Validate if tokenNo is present
      if (!tokenNo) {
        alert("Token Number is required!");
        return;
      }

      // Create the data to be sent in the PUT request
      const updateData = {
        endTime: endTime || new Date().toISOString(), // Default to current time if missing
        finalBill: finalBill || 0, // Default to 0 if not provided
        finalPaymentMode: finalPaymentMode || "Offline", // Default payment mode
        penalty: penalty || 0, // Default penalty to 0 if not provided
        comments: comments, // Send the comments (now with fallback)
      };
      const previousPage = sessionStorage.getItem("previousPage");
      console.log("Data being sent:", updateData);
      // Send the data to the backend for updating
      fetch(`/updateData/${tokenNo}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })
        .then((response) => {
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error("User not found");
            } else {
              throw new Error("Error updating data");
            }
          }
          return response.json();
        })
        .then((updatedData) => {
          alert("Data updated successfully!");
          if (onlineFields.style.display === "block") {
            // If amount-returned is not empty and payment mode is online, ensure name and mobile are filled
            if (amountReturnedInput.value.trim() && onlinePayment.checked) {
              // Show the modal with details

              const bankingName = document.getElementById("Banking-name").value;
              const bankingMobile =
                document.getElementById("Banking-mobile").value;
              const amountReturned = document.getElementById(
                "billing-amount-returned",
              ).value;
              showModal(bankingName, bankingMobile, amountReturned);
            } else {
              const previousPage = sessionStorage.getItem("previousPage");
              if (previousPage) {
                window.location.href = previousPage; // Navigate to the previous page stored in sessionStorage
              } else {
                window.history.back(); // Fallback to browser history if no previous page is stored
              }
            }
          } else {
            const previousPage = sessionStorage.getItem("previousPage");
            if (previousPage) {
              window.location.href = previousPage; // Navigate to the previous page stored in sessionStorage
            } else {
              window.history.back(); // Fallback to browser history if no previous page is stored
            }
          }
        })
        .catch((error) => {
          // Check if the error is 'User not found' and handle accordingly
          if (error.message === "User not found") {
            alert("User not found");
          } else {
            alert("Error updating data: " + error.message);
            if (previousPage) {
              window.location.href = previousPage; // Navigate to the previous page stored in sessionStorage
            } else {
              window.history.back(); // Fallback to browser history if no previous page is stored
            }
          }
        });
    });
  } else {
    console.error("Submit button not found!");
  }
  function showModal(name, mobile, amountReturned) {
    const modal = document.createElement("div");
    modal.id = "confirmation-modal";
    modal.innerHTML = `
            <div class="modal-content">
                <h3>Details Updated</h3>
                <p><strong>Banking Name:</strong> ${name}</p>
                <p><strong>Banking Mobile:</strong> ${mobile}</p>
                <p><strong>Amount Returned:</strong> ${amountReturned}</p>
                <button id="copy-button">Copy</button>
                <button id="ok-button">OK</button>
            </div>
        `;
    document.body.appendChild(modal);

    // Handle copy button click
    document
      .getElementById("copy-button")
      .addEventListener("click", function () {
        const details = `Banking Name: ${name}\nBanking Mobile: ${mobile}\nAmount Returned: ${amountReturned}`;
        navigator.clipboard.writeText(details).then(() => {
          alert("Details copied to clipboard!");
        });
      });

    // Handle OK button click
    document.getElementById("ok-button").addEventListener("click", function () {
      modal.remove();
      const previousPage = sessionStorage.getItem("previousPage");
      if (previousPage) {
        window.location.href = previousPage;
      } else {
        window.location.href = "/ride-selection"; // Navigate to ride selection page
      }
    });
  }
  // Check if 'stand' parameter is in the URL and display it
  const urlParams = new URLSearchParams(window.location.search);
  const stand = urlParams.get("stand");
  const standNameElement = document.getElementById("stand-name");
  if (stand) {
    standNameElement.textContent = stand; // Display Stand Name
  } else {
    standNameElement.textContent = "Stand not selected"; // Default message
  }

  const mobileInput = document.getElementById("mobile");
  const mobileError = document.getElementById("mobile-error"); // Ensure there's an element for showing the error
  mobileInput.value = "91";
  // Mobile validation
  function validateMobileNumber() {
    let mobile = mobileInput.value.trim();

    // Validate the number format (12 digits starting with 91)
    if (mobile.length !== 12 || isNaN(mobile)) {
      mobileError.textContent =
        "Please enter a valid 12-digit mobile number starting with 91.";
      mobileInput.setCustomValidity("Invalid mobile number");
    } else {
      mobileError.textContent = ""; // Clear the error message
      mobileInput.setCustomValidity(""); // Clear any previous custom validity
    }
  }

  // Trigger validation when the mobile number changes
  mobileInput.addEventListener("input", validateMobileNumber);

  // Ensure the mobile number has '91' prefix when page loads
  if (mobileInput.value && !mobileInput.value.startsWith("91")) {
    mobileInput.value = "91" + mobileInput.value;
  }

  // Back Button for Search Form
  document
    .getElementById("back-button-search")
    .addEventListener("click", function () {
      console.log("Hi");
      window.history.back();
    });

  // Handle form submission for search
  document
    .getElementById("search-form")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      let mobile = mobileInput.value.trim();
      const stand = standNameElement.textContent.trim();

      // Validate mobile number before submitting the form
      validateMobileNumber();
      if (mobileError.textContent) {
        return; // Prevent form submission if there's an error
      }

      // Fetch data based on mobile number and stand
      fetch(
        `/getDataByTokenOrMobile?mobile=${encodeURIComponent(mobile)}&stand=${encodeURIComponent(stand)}`,
      )
        .then((response) => {
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error("User not found");
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          const dataDisplay = document.getElementById("data-display");
          const noDataMessage = document.getElementById("no-data-message");
          const dataTableBody = document.getElementById("data-table-body");
          const searchForm = document.getElementById("search-form");

          // Hide search form once data is fetched
          searchForm.style.display = "none";

          // Hide no data message and previous data
          noDataMessage.style.display = "none";
          dataDisplay.style.display = "none";

          if (data && data.length > 0) {
            // Show the table and populate it with fetched data
            dataDisplay.style.display = "block";
            dataTableBody.innerHTML = ""; // Clear previous rows
            filteredData = data.filter(
              (record) => !record.endTime || record.endTime.trim() === "",
            );
            filteredData.forEach((record) => {
              const row = document.createElement("tr");
              // Ensure mobile number starts with '91' in the table
              const formattedMobile = record.mobile.startsWith("91")
                ? record.mobile
                : "91" + record.mobile;
              row.innerHTML = `
                            <td>${record.tokenNo}</td>
                            <td>${record.stand}</td>
                            <td>${formattedMobile}</td>
                            <td>${record.startTime}</td>
                            <td>${record.endTime || "N/A"}</td>
                            <td>${record.securityAmount}</td>
                            <td>${record.rideSelections.single}</td>
                            <td>${record.rideSelections.double}</td>
                            <td>${record.rideSelections.ellotor}</td>
							<td>${record.rideSelections.kids}</td>
							<td>${record.rideSelections.babyride}</td>
                            <td><button class="end-button" data-token="${record.tokenNo}">END</button></td>
                        `;
              dataTableBody.appendChild(row);
            });

            // Back Button for Data Table
            document
              .getElementById("back-button-table")
              .addEventListener("click", function () {
                console.log("hello");
                const dataDisplay = document.getElementById("data-display");
                const searchForm = document.getElementById("search-form");
                // Show the search form and hide the data table
                dataDisplay.style.display = "none";
                searchForm.style.display = "block";
              });

            // Add event listeners to "END" buttons
            const endButtons = document.querySelectorAll(".end-button");
            endButtons.forEach((button) => {
              button.addEventListener("click", function () {
                const tokenNo = this.getAttribute("data-token");
                // Fetch the details for this token and show the billing form
                fetch(
                  `/getDataByTokenOrMobile?token=${encodeURIComponent(tokenNo)}&stand=${encodeURIComponent(stand)}`,
                )
                  .then((response) => {
                    if (!response.ok) {
                      if (response.status === 404) {
                        throw new Error("User not found");
                      }
                      throw new Error("Failed to fetch token details");
                    }
                    return response.json();
                  })
                  .then((data) => {
                    const record = data[0];
                    const billingDetails =
                      document.getElementById("billing-details");
                    const dataDisplay = document.getElementById("data-display");

                    // Hide the table and show the billing form
                    dataDisplay.style.display = "none";
                    billingDetails.style.display = "block";

                    // Fill in the billing form
                    document.getElementById("billing-token").value =
                      record.tokenNo;
                    document.getElementById("billing-name").value = record.name;
                    document.getElementById("billing-mobile").value =
                      record.mobile;

					// Get the current end time and format it
					const endTime = new Date();
					document.getElementById("billing-end-date").value = formatDate(endTime);

                    // Calculate total ride time (in minutes)
                    const startTime = new Date(record.startTime);
					if (isNaN(startTime.getTime())) {
					console.error("Invalid start time:", record.startTime);
					document.getElementById("billing-start-date").value = "";
					} else {
					document.getElementById("billing-start-date").value = formatDate(startTime);
					}
					// Calculate total ride time in minutes
					const rideTime = Math.floor((endTime - startTime) / 60000); // Difference in minutes
					document.getElementById("billing-ride-time").value = isNaN(rideTime) ? 0 : rideTime

                    // Fill ride selections
                    document.getElementById("billing-single-rides").value =
                      record.rideSelections.single || 0;
                    document.getElementById("billing-double-rides").value =
                      record.rideSelections.double || 0;
                    document.getElementById("billing-ellotor-rides").value =
                      record.rideSelections.ellotor || 0;
                    document.getElementById("billing-kids-rides").value =
                      record.rideSelections.kids || 0;
                    document.getElementById("billing-baby-rides").value =
                      record.rideSelections.babyride || 0;

                    // Calculate total rides (30 mins = 1 ride, with custom rounding logic)
                    let totalRides = Math.floor(rideTime / 30);
                    const remainder = rideTime % 30;
                    if (remainder > 8) {
                      totalRides += 1; // Round up if remainder is greater than 8
                    }
                    document.getElementById("billing-ride-count").value =
                      totalRides;

                    // Calculate ride amount
                    const rideAmount =
                      record.rideSelections.single * 30 +
                      record.rideSelections.double * 60 +
                      record.rideSelections.ellotor * 150 +
                      record.rideSelections.kids * 30 +
                      record.rideSelections.babyride * 50;
                    const updatedRideAmount = rideAmount * totalRides;
                    document.getElementById("billing-ride-amount").value =
                      isNaN(updatedRideAmount) ? 0 : updatedRideAmount;

                    // Fill in the security amount
                    document.getElementById("billing-security").value =
                      record.securityAmount || 0;

                    // Show reason field only if penalty is filled
                    const penaltyInput =
                      document.getElementById("billing-penalty");
                    penaltyInput.addEventListener("input", function () {
                      if (penaltyInput.value < 0) {
                        alert(
                          "Please enter only a positive number for the penalty.",
                        );
                        penaltyInput.value = ""; // Optionally clear the field or leave it as is
                      }
                      const reasonGroup =
                        document.getElementById("reason-group");
                      const billingReasonInput =
                        document.getElementById("billing-reason");

                      if (this.value > 0) {
                        // Show the reason field and make it required
                        reasonGroup.style.display = "block";
                      } else {
                        // Hide the reason field and remove the 'required' attribute
                        reasonGroup.style.display = "none";
                      }

                      // Update the total amount when penalty is entered or removed
                      updateTotalAmount();
                    });

                    // Function to update the total amount including penalty
                    function updateTotalAmount() {
                      const penaltyAmount = parseFloat(penaltyInput.value) || 0;
                      const totalAmount = updatedRideAmount + penaltyAmount;
                      document.getElementById("billing-total").value = isNaN(
                        totalAmount,
                      )
                        ? 0
                        : totalAmount;

                      const billingname =
                        document.getElementById("billing-name");
                      const billingmobile =
                        document.getElementById("billing-mobile");
                      // Logic for final bill or amount to return
                      const securityAmount = record.securityAmount || 0;
                      if (totalAmount < securityAmount) {
                        const amountReturned = securityAmount - totalAmount;
                        document.getElementById(
                          "billing-amount-returned",
                        ).value = isNaN(amountReturned) ? 0 : amountReturned;
                        document.getElementById("billing-final-bill").value = 0;

                        document.getElementById(
                          "amount-to-return-group",
                        ).style.display = "block";
                        onlineFields.style.display = "block";
                        document.getElementById(
                          "final-bill-group",
                        ).style.display = "none";
                      } else {
                        const finalBill = totalAmount - securityAmount;
                        document.getElementById("billing-final-bill").value =
                          isNaN(finalBill) ? 0 : finalBill;
                        document.getElementById(
                          "billing-amount-returned",
                        ).value = 0;
                        document.getElementById(
                          "final-bill-group",
                        ).style.display = "block";
                        onlineFields.style.display = "none";
                        document.getElementById(
                          "amount-to-return-group",
                        ).style.display = "none";
                      }
                    }

                    // Call updateTotalAmount initially in case there is a penalty pre-filled
                    updateTotalAmount();

                    // Handle online/offline payment logic
                    const onlineCheckbox =
                      document.getElementById("online-payment");
                    const offlineCheckbox =
                      document.getElementById("offline-payment");

                    // Handle checkbox logic for online/offline payment
                    onlineCheckbox.addEventListener("change", function () {
                      if (onlineCheckbox.checked) {
                        offlineCheckbox.disabled = true; // Show the fields for online payment
                      } else {
                        offlineCheckbox.disabled = false;
                        // Hide the fields for online payment
                      }
                    });

                    offlineCheckbox.addEventListener("change", function () {
                      if (offlineCheckbox.checked) {
                        onlineCheckbox.disabled = true;
                      } else {
                        onlineCheckbox.disabled = false;
                      }
                    });

                    // Back Button for Billing Form
                    document
                      .getElementById("back-button-billing")
                      .addEventListener("click", function () {
                        const billingDetails =
                          document.getElementById("billing-details");
                        const dataDisplay =
                          document.getElementById("data-display");
                        const searchForm =
                          document.getElementById("search-form");
                        // Hide the billing details and show the search form again
                        billingDetails.style.display = "none";
                        searchForm.style.display = "block";
                        dataDisplay.style.display = "none";
                      });
                  })
                  .catch((error) => {
                    // Handle fetch error
                    alert(error.message);
                  });
              });
            });
          }
        });
    });
});
