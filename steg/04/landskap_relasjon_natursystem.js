const log = require("log-less-fancy")()
const config = require("../../config")
const io = require("../../lib/io")
const typesystem = require("@artsdatabanken/typesystem")

let rel = io.lesDatafil("landskap_relasjon_natursystem.csv.json")
let klg = io.lesDatafil("landskapsgradient.json")
let na = io.lesDatafil("na_mi_liste.json")
let bs = io.lesDatafil("mi_variasjon.json")
Object.entries(bs).forEach(([key, value]) => {
  na[key] = value
})

const data = akkumuler(rel)
const r = map(data)

function akkumuler(rel) {
  const r = []
  rel.forEach(e => {
    const kode = mapklgkode(e.gradient)
    if (!klg[kode]) return log.warn("Ukjent KLG " + kode)
    const keys = Object.keys(e)
    const node = { kode: kode, relasjon: [] }
    const relasjon = {}
    for (let i = 2; i < keys.length; i++) {
      const kant = keys[i]
      const mål = e[kant].split(",")
      mål.forEach(m => {
        const målkode = mapnakode(m)
        if (!målkode) return
        if (!na[målkode]) return log.warn("Relasjon til ukjent type " + målkode)
        if (!relasjon[kant]) relasjon[kant] = {}
        relasjon[kant][målkode] = true
      })
    }
    r.push({ kode: kode, lenker: relasjon })
  })
  return r
}

function map(data) {
  const r = {}
  data.forEach(e => {
    const { kode, lenker } = e
    const node = { relasjon: [] }
    Object.entries(lenker).forEach(([kant, målkoder]) => {
      Object.keys(målkoder).forEach(målkode =>
        node.relasjon.push({
          kode: målkode,
          kant: mapkant(kant),
          kantRetur: mapkantretur(kant)
        })
      )
      r[kode] = node
    })
  })
  return r
}

function mapklgkode(kode) {
  kode = kode.replace("RE-", "RE")
  kode = kode.replace("REID", "REIDKF")
  kode = kode.replace("REKF", "REIDKF")
  kode = kode.replace("AI-KS", "AIKS")
  return "NN-LA-KLG-" + kode
}

function mapnakode(kode) {
  kode = kode.trim()
  if (!kode) return
  kode = kode.replace("–", "-")
  kode = kode.replace("RE-IA", "REIA")
  kode = kode.replace("NA-", "NN-NA-TI-")
  kode = kode.replace("BS-", "NN-NA-BS-")
}

function mapkant(kant) {
  kant = kant.replace(/\(.*\)_na/, "landskapselement")
  kant = kant.replace(/\(.*\)_bs3/, "landskapselement")
  kant = kant.replace(
    "gradient-tyngdepunkt-landskapselement landskapselement",
    "gradient-tyngdepunkt for landskapselement"
  )
  return capitalizeFirstLetter(kant.trim())
}

function mapkantretur(kant) {
  kant = kant.replace(/\(.*\)_na/, "i landskap")
  kant = kant.replace(/\(.*\)_bs3/, "i landskap")
  kant = kant.replace(
    "gradient-tyngdepunkt-landskapselement",
    "gradient-tyngdepunkt"
  )
  return capitalizeFirstLetter(kant.trim())
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

io.skrivDatafil(__filename, r)
