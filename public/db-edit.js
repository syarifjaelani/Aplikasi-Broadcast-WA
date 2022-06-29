const inputs = document.querySelectorAll(".form-control");
inputs.forEach((input) => {
  input.addEventListener("change", () => {
    input.classList.remove("is-invalid");
  });
});
