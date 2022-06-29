// DOC SELECTOR
const taSelect = document.getElementById("school-year-select");
const classSelect = document.getElementById("class-select");
const tableBody = document.getElementById("siswa-table-body");

// GLOBAL VARIABLE
const baseUrl = window.location.origin;

// GLOBAL FUNCTION
const createOption = (data) => {
  const option = document.createElement("option");
  option.value = data;
  option.innerHTML = data;
  return option;
};

const createSiswaRow = (data, i) => {
  const root = document.createElement("tr");

  const rowId = document.createElement("th");
  rowId.scope = "row";
  rowId.innerHTML = i + 1;
  root.appendChild(rowId);

  const nameRow = document.createElement("td");
  nameRow.innerHTML = data.name;
  root.appendChild(nameRow);

  const ortu1NameRow = document.createElement("td");
  ortu1NameRow.innerHTML = data.ortu1_name;
  root.appendChild(ortu1NameRow);

  const ortu1PhoneRow = document.createElement("td");
  const phoneList1 = document.createElement("ul");
  phoneList1.style = "list-style-type: none";
  data.ortu1_phone.forEach((num) => {
    const phoneItem = document.createElement("li");
    phoneItem.innerHTML = num;
    phoneList1.appendChild(phoneItem);
  });
  ortu1PhoneRow.appendChild(phoneList1);
  root.appendChild(ortu1PhoneRow);

  const ortu2NameRow = document.createElement("td");
  ortu2NameRow.innerHTML = data.ortu2_name;
  root.appendChild(ortu2NameRow);

  const ortu2PhoneRow = document.createElement("td");
  const phoneList2 = document.createElement("ul");
  phoneList2.style = "list-style-type: none";
  data.ortu2_phone.forEach((num) => {
    const phoneItem = document.createElement("li");
    phoneItem.innerHTML = num;
    phoneList2.appendChild(phoneItem);
  });
  ortu2PhoneRow.appendChild(phoneList2);
  root.appendChild(ortu2PhoneRow);

  const btnRow = document.createElement("td");
  btnRow.className = "btn-row";
  const editBtnContainer = document.createElement("a");
  editBtnContainer.href = "/db/edit/" + data.id;
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn-edit btn btn-primary";
  editBtn.innerHTML = "Edit";
  editBtnContainer.appendChild(editBtn);
  btnRow.appendChild(editBtnContainer);

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "btn-delete btn btn-danger";
  delBtn.id = data.id;
  delBtn.innerHTML = "Hapus";
  btnRow.appendChild(delBtn);

  root.appendChild(btnRow);

  return root;
};

const addDelBtnEvent = () => {
  const confrs = document.querySelectorAll(".btn-delete");

  confrs.forEach((confr) => {
    confr.addEventListener("click", () => {
      Confirm.open({
        title: "Konfirmasi",
        message: "Apa anda yakin ingin menghapus data ini?",
        onok: async () => {
          const url = baseUrl + "/api/siswa/delete";
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: confr.id,
            }),
          });
          const json = await response.json();
          window.location.replace(baseUrl + "/db");
        },
      });
    });
  });
};

const loadSiswa = async () => {
  const url = baseUrl + "/api/siswa";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tahun_ajaran: taSelect.value,
      kelas: classSelect.value,
    }),
  });
  const json = await response.json();
  const dataSiswa = json.result;

  tableBody.innerHTML = "";
  dataSiswa.forEach((siswa, i) => {
    tableBody.appendChild(createSiswaRow(siswa, i));
  });
  addDelBtnEvent();

  const saveTa = async () => {
    const url = baseUrl + "/api/tahun_ajaran/save";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tahun_ajaran: taSelect.value,
      }),
    });
    const json = await response.json();
  };
  const saveKelas = async () => {
    const url = baseUrl + "/api/kelas/save";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kelas: classSelect.value,
      }),
    });
    const json = await response.json();
  };

  saveTa();
  saveKelas();
};

// SELECT TA HANDLER
taSelect.addEventListener("change", async () => {
  const url = baseUrl + "/api/kelas";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tahun_ajaran: taSelect.value,
    }),
  });
  const json = await response.json();
  const kelasData = json.result;
  kelasData.sort();

  classSelect.innerHTML = "";
  kelasData.forEach((kelas) => {
    classSelect.appendChild(createOption(kelas));
  });

  loadSiswa();
});

// SELECT CLASS HANDLER
classSelect.addEventListener("change", loadSiswa);

// DELETE BTN HANDLER
addDelBtnEvent();
