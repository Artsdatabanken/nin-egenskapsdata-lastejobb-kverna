var JSONStream = require("JSONStream")
var csv = require("csv")
const fs = require("fs")
const log = require("log-less-fancy")()
const config = require("../../config")

class CsvToJson {
  constructor(csvOptions) {
    this.csvOptions = csvOptions || {
      delimiter: ",",
      relax_column_count: true,
      escape: "\\"
    }
  }

  async convert(kildefil, writePath) {
    this.header = null
    const rs = fs.createReadStream(kildefil, "utf-8")
    const ws = fs.createWriteStream(writePath)
    await rs
      .pipe(csv.parse(this.csvOptions))
      .pipe(csv.transform(this.transform))
      .pipe(JSONStream.stringify())
      .pipe(ws)
  }

  transform(record) {
    if (!this.header) {
      this.header = {}
      for (let i = 0; i < record.length; i++)
        this.header[i] = record[i].toLowerCase() || "field" + i
      return
    }

    if (record.length <= 1) return null
    let r = {}
    for (let i = 0; i < record.length; i++) r[this.header[i]] = record[i].trim()
    return r
  }
}

importer(
  "Natur_i_Norge/Natursystem/Typeinndeling/basistrinn_per_grunntype.csv",
  "na_grunntype_til_lkm"
)

function importer(csvFil, utFil) {
  const kildefil = config.kildedataPath + "/" + csvFil
  const writePath = "data/" + utFil + ".csv.json"
  log.info("Import " + csvFil + " to " + writePath)
  new CsvToJson().convert(kildefil, writePath)
}
