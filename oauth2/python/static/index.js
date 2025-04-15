// Wait for the DOM to be fully loaded before accessing elements
document.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementById("docspace-button");

  function openOAuthPage() {
    console.log("Opening OAuth page");
    window.open(window.location.origin + "/authenticate", "_self");
  }

  // Check if the button exists before adding the event listener
  if (button) {
    button.addEventListener("click", openOAuthPage);
  } else {
    console.error("Button element not found!");
  }
});
