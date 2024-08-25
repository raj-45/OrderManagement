import { initializeApp } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  update,
  get,
  child,
  onValue,
} from "https://www.gstatic.com/firebasejs/9.19.1/firebase-database.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js";
// import Swal from "sweetalert2";

const firebaseConfig = {
  apiKey: "AIzaSyDcUrYx_eLswtcKPBpgJVyPWdyveDZLSyk",
  authDomain: "resturant-order-1d2b3.firebaseapp.com",
  databaseURL: "https://resturant-order-1d2b3-default-rtdb.firebaseio.com",
  projectId: "resturant-order-1d2b3",
  storageBucket: "resturant-order-1d2b3.appspot.com",
  messagingSenderId: "971852262554",
  appId: "1:971852262554:web:fefe99d0997f56f79e0323",
  measurementId: "G-4TS2JLW1BY",
};

document.addEventListener("DOMContentLoaded", () => {
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);
  const auth = getAuth(app);
  const db = getFirestore(app);

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("User Role = " + userData.role);
          if (userData.role === "chef") {
            // Ensure the role matches what you have in Firestore
            document.body.style.display = "block"; // Show the content
            createButtons(); // Call createButtons now that the user is authenticated
          } else {
            // console.log("User Role = " + userData.role + "but not waiter");
            window.location.href = "login.html"; // Redirect if the role is not Waiter
          }
        } else {
          console.error("No such user document!");
          window.location.href = "login.html"; // Redirect if no user document is found
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        window.location.href = "login.html"; // Redirect on error
      }
    } else {
      window.location.href = "login.html"; // Redirect if not signed in
    }
  });

  async function fetchOrderDetails(button) {
    try {
      const orderID = button.getAttribute("data-table-no");
      const tableID = orderID.toLowerCase();
      if (orderID) {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, "orders/" + orderID));
        const order = snapshot.val();
        if (order) {
          console.log("Orders Details : " + order);
          const to_billing_var = order["toBilling"];
          console.log("to_billing", to_billing_var);
          if (to_billing_var == "true") {
            alert("Table Closed for Billing");
            location.reload(); // Reload the page
            return;
          }
          const orderDetails = order["orderDetail"];
          var tableOneData = orderDetails[tableID]; // Accessing only the "Table-1" element
          console.log("tableOneData details:\n", tableOneData);

          if (tableOneData) {
            // Check if the data is a string and parse it if necessary
            if (typeof tableOneData === "string") {
              console.log(
                "Inside typeof tableOneData === string\n\ntableOneData:\n:",
                tableOneData
              );
              tableOneData = JSON.parse(tableOneData);
            }
            console.log("Table-1 data:", tableOneData); // Log the fetched data
            displayOrderDetails(tableOneData, button, orderID);
          }
        } else {
          alert("No orders found for this table.");
        }
      } else {
        alert("Cannot fetch table number, contact developer!");
      }
    } catch (error) {
      console.error("Error fetching data from Firebase:", error);
    }
  }

  function displayOrderDetails(orders, button, orderId) {
    const orderID = button.getAttribute("data-table-no");
    const tableID = orderID.toLowerCase();
    console.log("Inside orderID if:", tableID);
    // Get the container where the table will be inserted
    const container = document.getElementById("tableContainer");
    container.innerHTML = "";

    const h2Element = document.createElement("h2");
    h2Element.id = "orderIDHeader";
    h2Element.textContent = `Order Details for : ${orderId}`;
    container.appendChild(h2Element);

    // Create a table element
    const table = document.createElement("table");

    // Create the table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headers = ["Item Name", "Quantity", "Note", "Dine In"];
    headers.forEach((headerText) => {
      const th = document.createElement("th");
      th.textContent = headerText;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create the table body
    const tbody = document.createElement("tbody");

    let pairCounter = 0; // Add this line

    orders.forEach((item, index) => {
      // console.log("pairCounter vefore: " + pairCounter);
      const rowClass = pairCounter % 2 === 1 ? "second-pair" : "first-pair"; // Modified line
      // console.log("pairCounter after: " + pairCounter);
      const row = document.createElement("tr");
      row.className = rowClass; // Add this line

      const itemNameCell = document.createElement("td");
      itemNameCell.textContent = item.itemName;
      row.appendChild(itemNameCell);

      const quantityCell = document.createElement("td");
      quantityCell.textContent = item.quantity;
      row.appendChild(quantityCell);

      const noteCell = document.createElement("td");
      noteCell.textContent = item.note;
      row.appendChild(noteCell);

      const dineInCell = document.createElement("td");
      dineInCell.textContent = item.dineIn;
      row.appendChild(dineInCell);

      tbody.appendChild(row);

      const buttonRow = document.createElement("tr");
      const buttonCell = document.createElement("td");
      buttonRow.className = "button-row " + rowClass; // Adding class name here
      buttonCell.colSpan = 4; // Span across all columns
      const statuses = [
        { label: "Preparing", value: -1 },
        { label: "Cooked", value: 0 },
        { label: "Delivered", value: 1 },
      ];

      statuses.forEach((status) => {
        const button = document.createElement("button");
        button.textContent = status.label;
        button.className = "status-btn " + status.label.toLowerCase();

        // Check the item's chefStatus and set the active button
        if (item.chefStatus === status.value) {
          button.classList.add("active");
        }

        // Disable buttons if chefStatus is 1 or if the current button is "Delivered"
        if (
          item.chefStatus === 1 ||
          (status.value === 1 && item.chefStatus === 1)
        ) {
          button.disabled = true; // Add this line
        }

        button.addEventListener("click", function () {
          if (status.value === 1) {
            buttonCell.querySelectorAll("button").forEach((btn) => {
              btn.disabled = true; // Add this line
            });
          }
          handleStatusChange(status.value, item, orderID);
          setActive(button, status.label.toLowerCase());
        });
        buttonCell.appendChild(button);
      });

      buttonRow.appendChild(buttonCell);
      tbody.appendChild(buttonRow);
      pairCounter++; // Add this line
    });

    table.appendChild(tbody);

    // Append the table to the container
    container.appendChild(table);
  }

  // Function to set a button as active and manage animations
  function setActive(button, statusClass) {
    // Reset all buttons in the status cell to remove active classes and animations
    button.parentElement.querySelectorAll("button").forEach((btn) => {
      btn.classList.remove("active", "preparing", "cooked", "delivered");
      btn.classList.add(statusClass);
    });
    // Add active class to the clicked button
    button.classList.add("active");
  }
  console.log("Script is running, Firebase initialized.");
  const notificationsRef = ref(database, "notifications");

  let previousTableNo = null;

  onValue(
    notificationsRef,
    (snapshot) => {
      console.log("Inside code");
      const notoficationObj = snapshot.val();

      if (notoficationObj.tableNo !== previousTableNo) {
        // Check if table number has changed
        Swal.fire({
          title: "New Order Received",
          text:
            "Table number " + notoficationObj.tableNo + " has been updated.",
          icon: "info",
          showConfirmButton: true,
          // timer: 30000,
        });
        console.log("tableNo !== previousTableNo" + notoficationObj.tableNo);

        playNotificationSound();

        previousTableNo = notoficationObj.tableNo; // Update previousTableNo for subsequent checks
      }
    },
    (error) => {
      console.error("Error listening for changes:", error);
    }
  );

  function playNotificationSound() {
    const audio = new Audio("../sound/sound.mp3"); // Replace with your sound file path
    audio.play();
  }

  async function createButtons() {
    const buttonsContainer = document.getElementById("order-list");

    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, "orders/"));
    let orders = snapshot.val();

    for (let i = 1; i <= 12; i++) {
      let tableKey = "Table-" + i;
      const button = document.createElement("button");
      button.textContent = `Table ${i}`;
      button.setAttribute("data-table-no", `Table-${i}`);
      button.classList.add("table-btn");
      if (orders) {
        if (!(orders[tableKey].toBilling === false)) {
          console.log(
            "Tbale number with toBilling value" +
              tableKey +
              "\t" +
              orders[tableKey].toBilling
          );
          // Disable the button if the table is closed
          button.classList.add("disabled-btn");
          button.disabled = true;
        }
      } else {
        alert("Cannot fetch Order ID, Contact Developer");
      }

      button.onclick = function () {
        const allButtons = document.querySelectorAll(".table-btn");
        allButtons.forEach((btn) => btn.classList.remove("active-btn"));

        // Add active class to the clicked button
        button.classList.add("active-btn");
        fetchOrderDetails(button);
      };
      buttonsContainer.appendChild(button);
    }
  }

  async function handleStatusChange(chefStatus_var, item, orderId) {
    const tableID = orderId.toLowerCase();

    try {
      if (orderId) {
        // Reference to the order details
        const orderRef = ref(
          database,
          `orders/${orderId}/orderDetail/${tableID}`
        );
        const snapshot = await get(orderRef);

        if (snapshot.exists()) {
          const orderDetails = snapshot.val();

          // Locate the index of the item you want to update
          const itemIndex = orderDetails.findIndex(
            (orderItem) =>
              orderItem.itemName === item.itemName &&
              orderItem.note === item.note &&
              orderItem.quantity === item.quantity
          );

          if (itemIndex !== -1) {
            // Update the chefStatus of the specific item
            const updates = {};
            updates[`${itemIndex}/chefStatus`] = chefStatus_var; // Update chefStatus for the specific index

            await update(orderRef, updates);
            alert("Order status updated successfully!");
          } else {
            console.log("Item not found for update.");
          }
        } else {
          alert("No order details found.");
        }
      } else {
        alert("Cannot fetch Order ID, Contact Developer");
      }
    } catch (error) {
      console.error("Error writing data to Firebase:", error);
      alert("Error updating order status. Please try again.");
    }
  }

  const logoutButton = document.getElementById("logout");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      firebase
        .auth()
        .signOut()
        .then(() => {
          // Sign-out successful.
          console.log("User signed out");
          // Redirect to login page or another page
          window.location.href = "login.html";
        })
        .catch((error) => {
          // An error happened.
          console.error("Sign-out error:", error);
        });
    });
  }
});
