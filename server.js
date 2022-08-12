const express = require("express");
const app = express();
const open = require("open");
const sqlite3 = require("sqlite3");
const puppeteer = require("puppeteer");
// SETTINGS
const port = process.env.port || 3000;
app.set("view engine", "ejs");

// DB SETUP
const db = new sqlite3.Database(
  "./db/data.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) console.error(err.message);
  }
);

// DB FUNCTION
let SPP_TEXT =
  "Kepada orang tua siswa/siswi yang menerima pesan ini diingatkan untuk *segera melunasi pembayaran SPP siswa/siswi bulan ini*. Terima Kasih " +
  "\r\n" +
  "\r\n" +
  "*Pesan ini dikirimkan secara otomatis* " +
  "\r\n" +
  "_Pondok Pesantren Hidayatullah, Medan_";

const startCheck = async (db) => {
  sql = `SELECT EXISTS(SELECT 1 FROM settings WHERE key=? LIMIT 1);`;
  db.get(sql, ["spp_text"], (err, result) => {
    if (err) console.log(err);
    Object.entries(result).forEach(([key, value]) => {
      if (value == 0) {
        sql = `INSERT INTO settings (key, value) VALUES (?, ?)`;
        db.run(sql, ["spp_text", SPP_TEXT], (err) => {
          if (err) console.log(err);
          console.log("SPP TEXT SET TO DEFAULT")
        });
      }
    });
  }
  );
}

startCheck(db);

const updateSettings = async (db, key, value) => {
  return new Promise((resolve, reject) => {
    sql = `UPDATE settings SET value=? WHERE key=?`;
    db.run(sql, [value, key], (err) => {
      if (err) reject(err);
      resolve(true);
    });
  });
};

const getSettingByKey = async (db, key) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM settings WHERE key=?`, [key], (err, row) => {
      if (err) reject(err);
      resolve(row.value);
    });
  });
};

const getSiswaByKelas = async (db, tahun_ajaran, kelas) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM siswa WHERE tahun_ajaran=? AND kelas=?`;
    db.all(sql, [tahun_ajaran, kelas], (err, rows) => {
      if (err) reject(err);
      let siswaData = [];
      rows.forEach((row) => {
        let numArr = [];
        let ortu1_phone = [];
        let ortu2_phone = [];
        const phoneStr1 = row.ortu1_phone;
        const phoneStr2 = row.ortu2_phone;
        if (phoneStr1 != null) {
          let nums = phoneStr1.replace(/\s+/g, "");
          nums = nums.split(",");
          numArr.push(...nums);
          ortu1_phone.push(...nums);
        }
        if (phoneStr2 != null) {
          let nums = phoneStr2.replace(/\s+/g, "");
          nums = nums.split(",");
          numArr.push(...nums);
          ortu2_phone.push(...nums);
        }

        let returnData = {
          id: row.id,
          name: row.nama,
          kelas: row.kelas,
          tahun_ajaran: row.tahun_ajaran,
          ortu1_name: row.ortu1_nama,
          ortu1_phone: ortu1_phone,
          ortu2_name: row.ortu2_nama,
          ortu2_phone: ortu2_phone,
          num_arr: numArr,
        };

        siswaData.push(returnData);
      });
      // SORT BY NAME
      siswaData.sort((a, b) => {
        let fa = a.name.toLowerCase(),
          fb = b.name.toLowerCase();

        if (fa < fb) {
          return -1;
        }
        if (fa > fb) {
          return 1;
        }
        return 0;
      });
      resolve(siswaData);
    });
  });
};

const getSiswaByTahunAjaran = async (db, tahun_ajaran) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM siswa WHERE tahun_ajaran=?`;
    db.all(sql, [tahun_ajaran], (err, rows) => {
      if (err) reject(err);
      let siswaData = [];
      rows.forEach((row) => {
        let returnData = {};
        returnData["id"] = row.id;
        returnData["name"] = row.nama;
        returnData["kelas"] = row.kelas;
        returnData["tahun_ajaran"] = row.tahun_ajaran;

        let numArr = [];
        const phoneStr1 = row.ortu1_phone;
        const phoneStr2 = row.ortu2_phone;
        if (phoneStr1 != null) {
          let nums = phoneStr1.replace(/\s+/g, "");
          nums = nums.split(",");
          numArr.push(...nums);
        }
        if (phoneStr2 != null) {
          let nums = phoneStr2.replace(/\s+/g, "");
          nums = nums.split(",");
          numArr.push(...nums);
        }
        returnData["num_arr"] = numArr;

        siswaData.push(returnData);
      });
      // SORT BY NAME
      siswaData.sort((a, b) => {
        let fa = a.name.toLowerCase(),
          fb = b.name.toLowerCase();

        if (fa < fb) {
          return -1;
        }
        if (fa > fb) {
          return 1;
        }
        return 0;
      });
      resolve(siswaData);
    });
  });
};

const getSiswaById = async (db, id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM siswa WHERE id=?`;
    db.get(sql, [id], (err, result) => {
      if (err) reject(err);
      let finalResult = {};
      Object.entries(result).forEach(([key, value]) => {
        finalResult[key] = value === null ? "" : value;
      });

      resolve(finalResult);
    });
  });
};

const deleteSiswaById = async (db, id) => {
  return new Promise((resolve, reject) => {
    sql = `DELETE FROM siswa WHERE id=?`;
    db.run(sql, [id], (err) => {
      if (err) reject(err);
      resolve(true);
    });
  });
};

const editSiswa = async (
  db,
  id,
  nama,
  kelas,
  tahun_ajaran,
  ortu1_nama,
  ortu1_phone,
  ortu2_nama,
  ortu2_phone
) => {
  return new Promise((resolve, reject) => {
    sql = `UPDATE siswa SET nama=?, kelas=?, tahun_ajaran=?, ortu1_nama=?, ortu1_phone=?, ortu2_nama=?, ortu2_phone=? WHERE id=?`;
    db.run(
      sql,
      [
        nama,
        kelas,
        tahun_ajaran,
        ortu1_nama,
        ortu1_phone,
        ortu2_nama,
        ortu2_phone,
        id,
      ],
      (err) => {
        if (err) reject(err);
        resolve(true);
      }
    );
  });
};

const addSiswa = async (
  db,
  nama,
  kelas,
  tahun_ajaran,
  ortu1_nama,
  ortu1_phone,
  ortu2_nama,
  ortu2_phone
) => {
  return new Promise((resolve, reject) => {
    sql = `INSERT INTO siswa (nama, kelas, tahun_ajaran, ortu1_nama, ortu1_phone, ortu2_nama, ortu2_phone) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(
      sql,
      [
        nama,
        kelas,
        tahun_ajaran,
        ortu1_nama,
        ortu1_phone,
        ortu2_nama,
        ortu2_phone,
      ],
      (err) => {
        if (err) reject(err);
        resolve(true);
      }
    );
  });
};

const getTahunAjaran = async (db) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT tahun_ajaran FROM siswa GROUP BY tahun_ajaran ORDER BY tahun_ajaran DESC`;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      let taArray = [];
      rows.forEach((row) => {
        taArray.push(row.tahun_ajaran);
      });
      resolve(taArray);
    });
  });
};

const getKelas = async (db, tahun_ajaran) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT kelas FROM siswa WHERE tahun_ajaran=? GROUP BY kelas ORDER BY tahun_ajaran DESC`;
    db.all(sql, [tahun_ajaran], (err, rows) => {
      if (err) reject(err);
      let kelasArray = [];
      rows.forEach((row) => {
        kelasArray.push(row.kelas);
      });
      resolve(kelasArray);
    });
  });
};

// MIDDLEWARE
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ROUTERS
// HANDLER FUNCTION FOR ROUTER
const convertNumber = (num) => {
  // NO TELPON TARGET, FORMAT AWAL: 085612345678
  let result = num.substring(1);
  result = `62${result}@c.us`;
  return result;
};

const convertNumberArr = async (numStr) => {
  let nums = numStr.replace(/\s+/g, "");
  let numsArray = nums.split(",");
  let validNums = [];
  let invalidNums = [];
  let validNumsRep = [];
  let invalidNumsRep = [];
  for (const num of numsArray) {
    const convertNum = convertNumber(num);
    const isValidNum = await client.isRegisteredUser(convertNum);
    if (isValidNum) {
      validNums.push(convertNum);
      validNumsRep.push(num);
    } else {
      invalidNums.push(convertNum);
      invalidNumsRep.push(num);
    }
  }
  return [validNums, invalidNums, validNumsRep, invalidNumsRep];
};

// API ROUTER FUNCTION
const apiRouter = express.Router();
let sendStatus = {};
let dbViewData = {};
let dbAddData = {};
let dbEditData = {};

apiRouter.post("/message/send", async (req, res) => {
  console.log("");
  console.log("SESI PENGIRIMAN PESAN DIMULAI");
  try {
    let targetArrStr = req.body.rec_number_final;
    let message = req.body.custom_message;
    if (message.length === 0) {
      throw new Error("Message is empty, please try again!");
    }
    console.log("Pesan: " + message);
    console.log("");

    let [validNums, invalidNums, validNumsRep, invalidNumsRep] =
      await convertNumberArr(targetArrStr);

    validNums.forEach((num, i) => {
      console.log("Pesan terkirim ke nomor " + validNumsRep[i]);
      client.sendMessage(num, message);
    });
    invalidNumsRep.forEach((num) => {
      console.log("Pesan tidak terkirim ke " + num + " karena nomor invalid");
    });

    const allSent = invalidNums.length === 0;

    sendStatus = {
      status: "success",
      sentMessage: message,
      allSent: allSent,
      validNums: validNumsRep,
      invalidNums: invalidNumsRep,
    };
  } catch (error) {
    sendStatus = {
      status: "failed",
      error: error.message,
    };
  } finally {
    console.log("SESI PENGIRIMAN PESAN SELESAI");
    console.log("");
    res.redirect("/");
  }
});

apiRouter.post("/user/validate", async (req, res) => {
  try {
    let target = req.body.target_number;
    const targetConverted = convertNumber(target);
    const isValidUser = await client.isRegisteredUser(targetConverted);
    res.json({
      status: "success",
      result: isValidUser,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

apiRouter.post("/siswa", async (req, res) => {
  try {
    const tahunAjaran = req.body.tahun_ajaran;
    const kelas = req.body.kelas;

    const siswaData = await getSiswaByKelas(db, tahunAjaran, kelas);
    res.json({
      status: "success",
      result: siswaData,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

apiRouter.post("/siswa/all", async (req, res) => {
  try {
    const tahunAjaran = req.body.tahun_ajaran;
    const siswaData = await getSiswaByTahunAjaran(db, tahunAjaran);
    res.json({
      status: "success",
      result: siswaData,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

apiRouter.post("/siswa/add", async (req, res) => {
  try {
    const dataSiswa = {
      nama: req.body.nama,
      kelas: req.body.kelas,
      tahun_ajaran: req.body.tahun_ajaran,
      ortu1_nama: req.body.ortu1_nama,
      ortu1_phone: req.body.ortu1_phone,
      ortu2_nama: req.body.ortu2_nama,
      ortu2_phone: req.body.ortu2_phone,
    };

    // VALIDATION
    let isValid = true;
    dbAddData = {
      status: "ok",
      data: {},
      invalid_nums: {},
      validation_result: {},
    };
    for (const [key, value] of Object.entries(dataSiswa)) {
      dbAddData["data"][key] = value;
      if (["nama", "kelas", "tahun_ajaran"].includes(key)) {
        if (value === "") isValid = false;
        dbAddData["validation_result"][key] = value != 0;
      } else if (["ortu1_phone", "ortu2_phone"].includes(key)) {
        if (value !== "") {
          const [x, y, z, invalid_nums] = await convertNumberArr(value);
          const isAllNumValid = invalid_nums.length === 0;
          dbAddData["validation_result"][key] = isAllNumValid;
          if (!isAllNumValid) isValid = false;
          dbAddData.invalid_nums[key] = invalid_nums;
        } else {
          dbAddData["validation_result"][key] = true;
        }
      }
    }
    //---------------------------

    if (isValid) {
      const isSuccess = await addSiswa(
        db,
        dataSiswa.nama,
        dataSiswa.kelas,
        dataSiswa.tahun_ajaran,
        dataSiswa.ortu1_nama,
        dataSiswa.ortu1_phone,
        dataSiswa.ortu2_nama,
        dataSiswa.ortu2_phone
      );
      dbAddData = {};
      dbViewData = {
        status: "success",
        operation: "add",
      };
      const isSuccess2 = await updateSettings(
        db,
        "tahun_ajaran_selected",
        dataSiswa.tahun_ajaran
      );
      const isSuccess3 = await updateSettings(
        db,
        "kelas_selected",
        dataSiswa.kelas
      );
      dbViewData["result"] = [isSuccess, isSuccess2, isSuccess3];
      res.redirect("/db");
    } else {
      res.redirect("/db/new");
    }
  } catch (error) {
    dbViewData = {
      status: "failed",
      operation: "add",
      message: error.message,
    };
    res.redirect("/db");
  }
});

apiRouter.post("/siswa/edit", async (req, res) => {
  try {
    const dataSiswa = {
      id: req.body.id,
      nama: req.body.nama,
      kelas: req.body.kelas,
      tahun_ajaran: req.body.tahun_ajaran,
      ortu1_nama: req.body.ortu1_nama,
      ortu1_phone: req.body.ortu1_phone,
      ortu2_nama: req.body.ortu2_nama,
      ortu2_phone: req.body.ortu2_phone,
    };

    // VALIDATION
    let isValid = true;
    dbEditData = {
      status: "ok",
      data: {},
      invalid_nums: {},
      validation_result: {},
    };
    for (const [key, value] of Object.entries(dataSiswa)) {
      dbEditData["data"][key] = value;
      if (["nama", "kelas", "tahun_ajaran"].includes(key)) {
        if (value === "") isValid = false;
        dbEditData["validation_result"][key] = value != 0;
      } else if (["ortu1_phone", "ortu2_phone"].includes(key)) {
        if (value !== "") {
          const [x, y, z, invalid_nums] = await convertNumberArr(value);
          const isAllNumValid = invalid_nums.length === 0;
          dbEditData["validation_result"][key] = isAllNumValid;
          if (!isAllNumValid) isValid = false;
          dbEditData.invalid_nums[key] = invalid_nums;
        } else {
          dbEditData["validation_result"][key] = true;
        }
      }
    }
    //---------------------------

    if (isValid) {
      const isSuccess = await editSiswa(
        db,
        dataSiswa.id,
        dataSiswa.nama,
        dataSiswa.kelas,
        dataSiswa.tahun_ajaran,
        dataSiswa.ortu1_nama,
        dataSiswa.ortu1_phone,
        dataSiswa.ortu2_nama,
        dataSiswa.ortu2_phone
      );
      dbEditData = {};
      dbViewData = {
        status: "success",
        operation: "edit",
      };
      const isSuccess2 = await updateSettings(
        db,
        "tahun_ajaran_selected",
        dataSiswa.tahun_ajaran
      );
      const isSuccess3 = await updateSettings(
        db,
        "kelas_selected",
        dataSiswa.kelas
      );
      dbViewData["result"] = [isSuccess, isSuccess2, isSuccess3];
      res.redirect("/db");
    } else {
      res.redirect("/db/edit/" + dataSiswa.id);
    }
  } catch (error) {
    dbViewData = {
      status: "failed",
      operation: "add",
      message: error.message,
    };
    res.redirect("/db");
  }
});

apiRouter.post("/siswa/delete", async (req, res) => {
  try {
    const id = req.body.id;

    const isSuccess = await deleteSiswaById(db, id);
    dbViewData = {
      status: "success",
      operation: "delete",
    };
    res.json({
      status: "success",
      result: isSuccess,
    });
  } catch (error) {
    dbViewData = {
      status: "failed",
      operation: "delete",
      message: error.messages,
    };
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

apiRouter.get("/tahun_ajaran", async (req, res) => {
  try {
    const ta = await getTahunAjaran(db);
    res.json({
      status: "success",
      result: ta,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

apiRouter.post("/tahun_ajaran/save", async (req, res) => {
  try {
    const ta = req.body.tahun_ajaran;

    const isSuccess = await updateSettings(db, "tahun_ajaran_selected", ta);
    res.json({
      status: "success",
      result: isSuccess,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

apiRouter.post("/kelas", async (req, res) => {
  try {
    const tahunAjaran = req.body.tahun_ajaran;

    const kelasArr = await getKelas(db, tahunAjaran);
    res.json({
      status: "success",
      result: kelasArr,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

apiRouter.post("/kelas/save", async (req, res) => {
  try {
    const kelas = req.body.kelas;

    const isSuccess = await updateSettings(db, "kelas_selected", kelas);
    res.json({
      status: "success",
      result: isSuccess,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

// Get spp text from database
apiRouter.get("/spp", async (req, res) => {
  try {
    const spp_text = await getSettingByKey(db, "spp_text");
    res.json({
      status: "success",
      result: spp_text,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
})

// Save spp text to database
apiRouter.post("/spp/save", async (req, res) => {
  try {
    const spp_text = req.body.spp_text;
    const isSuccess = await updateSettings(db, "spp_text", spp_text);
    res.json({
      status: "success",
      result: isSuccess,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}),

  app.use("/api", apiRouter);

// WHATSAPP LOGIN HANDLER
const {
  Client,
  Location,
  List,
  Buttons,
  LocalAuth,
} = require("whatsapp-web.js");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: false },
});

client.initialize();

client.on("qr", (qr) => {
  // NOTE: This event will not be fired if a session is specified.
  console.log("QR RECEIVED", qr);
});

client.on("authenticated", () => {
  console.log("AUTHENTICATED");
});

client.on("auth_failure", (msg) => {
  // Fired if session restore was unsuccessful
  console.error("AUTHENTICATION FAILURE", msg);
});

client.on("disconnected", (reason) => {
  console.log("Client was logged out", reason);
  process.exit();
});

client.on("ready", () => {
  console.log("READY");
  // START SERVER
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
    // opens the url in the default browser
    console.log(`Aplikasi dibuka di halaman web http://localhost:${port}/`);
    open(`http://localhost:${port}/`);
  });
});

// PAGES ROUTER GLOBAL FUNCTION
const getDataSiswa = async () => {
  selectedTahunAjaran = await getSettingByKey(db, "tahun_ajaran_selected");
  selectedKelas = await getSettingByKey(db, "kelas_selected");
  const taList = await getTahunAjaran(db);
  if (!taList.includes(selectedTahunAjaran)) {
    try {
      selectedTahunAjaran = taList[0];
      const isSuccess = updateSettings(db, "tahun_ajaran_selected", taList[0]);
    } catch (error) {
      console.log(error);
      selectedTahunAjaran = "";
    }
  }
  const selectedTahunAjaranKelasList = await getKelas(db, selectedTahunAjaran);
  if (!selectedTahunAjaranKelasList.includes(selectedKelas)) {
    try {
      selectedKelas = selectedTahunAjaranKelasList[0];
      const isSuccess = updateSettings(
        db,
        "kelas_selected",
        selectedTahunAjaranKelasList[0]
      );
    } catch (error) {
      console.log(error);
      selectedKelas = "";
    }
  }
  const siswaData = await getSiswaByKelas(
    db,
    selectedTahunAjaran,
    selectedKelas
  );
  const otherTa = taList.filter((e) => {
    return e != selectedTahunAjaran;
  });
  const otherKelas = selectedTahunAjaranKelasList.filter((e) => {
    return e != selectedKelas;
  });
  return [selectedTahunAjaran, otherTa, selectedKelas, otherKelas, siswaData];
};

// PAGES ROUTER FUNCTION
const pagesRouter = express.Router();

pagesRouter.get("/", async (req, res) => {
  const [tahun_ajaran, otherTa, kelas, otherKelas, siswaData] =
    await getDataSiswa();

  res.render("index", {
    status: undefined,
    siswaData: siswaData,
    selectedTahunAjaran: tahun_ajaran,
    selectedKelas: kelas,
    otherTa: otherTa,
    otherKelas: otherKelas,
    username: client.info.pushname,
    ...sendStatus,
  });
  sendStatus = {
    status: undefined,
  };
});

pagesRouter.get("/db", async (req, res) => {
  const [tahun_ajaran, otherTa, kelas, otherKelas, siswaData] =
    await getDataSiswa();

  res.render("db", {
    status: undefined,
    siswaData: siswaData,
    selectedTahunAjaran: tahun_ajaran,
    selectedKelas: kelas,
    otherTa: otherTa,
    otherKelas: otherKelas,
    username: client.info.pushname,
    ...dbViewData,
  });
  dbViewData = {};
});

pagesRouter.get("/db/new", async (req, res) => {
  const [tahun_ajaran, x, kelas, y, z] = await getDataSiswa();
  res.render("db-add", {
    status: undefined,
    selectedTahunAjaran: tahun_ajaran,
    selectedKelas: kelas,
    ...dbAddData,
  });
  dbAddData = {};
});

pagesRouter.get("/db/edit/:id", async (req, res) => {
  const idSiswa = req.params.id;
  const data = await getSiswaById(db, idSiswa);
  res.render("db-edit", {
    status: undefined,
    data: data,
    ...dbEditData,
  });
  dbEditData = {};
});

app.use("/", pagesRouter);
