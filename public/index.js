// DATA VARIABLE
let studentNumNameRef = {};

let allNum = [];
let allName = [];

let selectedSiswaName = [];
let selectedSiswaNum = [];
let extraNumsArray = [];

// INPUT SELECTED
const taSelect = document.getElementById("school-year-select");
const classSelect = document.getElementById("class-select");
const customMessageInput = document.getElementById("custMessageInput");
const finalTargetConfirmationInput =
  document.getElementById("targetConfirmation");
const finalNameConfirmationInput = document.getElementById("nameConfirmation");
const siswaOption = document.getElementsByName("student-option");
const allStudentSelect = document.getElementById("all-student-select");
const siswaSelect = document.getElementById("siswa-selection");
const listSiswaText = document.getElementById("list-siswa-text");

const baseUrl = window.location.origin;

// GLOBAL FUNCTION
const calcTargetFinal = () => {
  allNum = selectedSiswaNum.concat(extraNumsArray);
  const finalNumArr = [...new Set(allNum)];

  let filteredNumsArray = extraNumsArray.filter((num) => {
    return studentNumNameRef[num] === undefined;
  });
  allName = selectedSiswaName.concat(filteredNumsArray);
  const finalNameArr = [...new Set(allName)];
  let finalNameStr = "";
  finalNameArr.forEach((name) => {
    finalNameStr += name + "\r\n";
  });

  finalNameConfirmationInput.value = finalNameStr;
  finalTargetConfirmationInput.value = finalNumArr
    .toString()
    .replace(/,\s*$/, "");
};

const createOption = (data) => {
  const option = document.createElement("option");
  option.value = data;
  option.innerHTML = data;
  return option;
};

const selectAllSiswa = async () => {
  const url = baseUrl + "/api/siswa/all";
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
  const dataSiswa = json.result;

  siswaSelect.innerHTML = "";
  listSiswaText.innerHTML = "Semua Siswa " + taSelect.value + " dipilih.";

  selectedSiswaName = [];
  selectedSiswaNum = [];

  dataSiswa.forEach((siswa) => {
    selectedSiswaName.push(siswa.name);
    selectedSiswaNum.push(...siswa.num_arr);
  });

  calcTargetFinal();
};

const handleSiswaSelect = () => {
  siswaOption.forEach((option) => {
    option.addEventListener("change", () => {
      const dataSiswa = JSON.parse(option.value);
      if (option.checked) {
        dataSiswa.num_arr.forEach((num) => {
          studentNumNameRef[num] = dataSiswa.name;
        });
        selectedSiswaName.push(dataSiswa.name);
        selectedSiswaNum.push(...dataSiswa.num_arr);
      } else {
        dataSiswa.num_arr.forEach((num) => {
          studentNumNameRef[num] = undefined;
        });
        selectedSiswaName = selectedSiswaName.filter(
          (e) => e !== dataSiswa.name
        );
        dataSiswa.num_arr.forEach((num) => {
          selectedSiswaNum = selectedSiswaNum.filter((e) => e !== num);
        });
      }
      calcTargetFinal();
    });
  });
};

const createSiswaOption = (data, i) => {
  const root = document.createElement("div");
  root.className = "inputGroup";

  const input = document.createElement("input");
  input.id = "option" + i;
  input.name = "student-option";
  input.type = "checkbox";
  input.value = JSON.stringify(data);
  if (selectedSiswaName.includes(data.name)) {
    input.checked = true;
  }

  const label = document.createElement("label");
  label.htmlFor = "option" + i;
  label.innerHTML = data.name;

  root.appendChild(input);
  root.appendChild(label);
  return root;
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

  siswaSelect.innerHTML = "";
  listSiswaText.innerHTML = "LIST SISWA KELAS " + classSelect.value;
  dataSiswa.forEach((siswa, i) => {
    siswaSelect.appendChild(createSiswaOption(siswa, i));
  });
  handleSiswaSelect();

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

// TA SELECT HANDLER
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
  selectedSiswaName = [];
  selectedSiswaNum = [];
  calcTargetFinal();
  allStudentSelect.checked = false;

  loadSiswa();
});

// KELAS SELECCT HANDLER
classSelect.addEventListener("change", loadSiswa);

// Radio Button Handler
const SPP_TEXT =
  "Kepada orang tua siswa/siswi yang menerima pesan ini diingatkan untuk *segera melunasi pembayaran SPP siswa/siswi bulan ini*. Terima Kasih " +
  "\r\n" +
  "\r\n" +
  "*Pesan ini dikirimkan secara otomatis* " +
  "\r\n" +
  "_Pondok Pesantren Hidayatullah, Medan_";
let oldMessage = "";

const radioSppClicked = () => {
  oldMessage = customMessageInput.value;
  customMessageInput.value = SPP_TEXT;
  customMessageInput.innerHTML = SPP_TEXT;
  customMessageInput.readOnly = true;
};
const radioCustClicked = () => {
  customMessageInput.readOnly = false;
  customMessageInput.value = oldMessage;
  customMessageInput.innerHTML = oldMessage;
};

let rad = document.message_form.message_type;
let prev = null;
for (let i = 0; i < rad.length; i++) {
  rad[i].addEventListener("change", function () {
    if (this !== prev) {
      prev = this;
    }
    if (this.value == "spp") radioSppClicked();
    else radioCustClicked();
  });
}

// HANDLER SISWA SELECTOR
handleSiswaSelect();

// HANDLER KONFIRMASI PENERIMA
let extraPhoneInput = document.getElementById("extraPhoneInput");

extraPhoneInput.addEventListener("change", () => {
  let extraNums = extraPhoneInput.value.replace(/\s+/g, "");
  extraNumsArray = extraNums.split(",");
  calcTargetFinal();
});

// HANDLER CHECK KIRIM SEMUA
allStudentSelect.addEventListener("change", () => {
  classSelect.disabled = allStudentSelect.checked === true;
  if (allStudentSelect.checked) {
    selectAllSiswa();
  } else {
    loadSiswa();
  }
});
