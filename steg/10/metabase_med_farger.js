const tinycolor = require("tinycolor2")
const config = require("../../config")
const log = require("log-less-fancy")()
const io = require("../../lib/io")
const blandFarger = require("../../lib/fargefunksjon")
const typesystem = require("@artsdatabanken/typesystem")

/*
Mix colors of child nodes to create colors for ancestor nodes missing colors
*/

let data = io.lesDatafil("full_med_graf")
let hierarki = io.lesDatafil("kodehierarki")
const foreldre = hierarki.foreldre
const barnAv = hierarki.barn
let farger = io.lesBuildfil("farger")
const la_farger = io.lesDatafil("la_farger")
farger = Object.assign(farger, la_farger)

Object.keys(data).forEach(kode => {
  const node = data[kode]
  const barn = barnAv[kode]
  const f = farger[kode]
  if (!f) return
  node.farge0 = node.farge0 || f.farge0
  node.farge = node.farge || f.farge
})

Object.keys(data).forEach(kode => {
  const node = data[kode]
  if (node.type !== "gradient") return
  const barnkoder = typesystem.sorterKoder(barnAv[kode])
  gradientrampe(node.farge0, node.farge, barnkoder)
})

while (trickleColorsUp()) {}
settFargePåGradienter()
settFargePåFlagg()

Object.keys(data).forEach(kode => {
  const node = data[kode]
  if (kode === "AR") debugger
  if (!node.farge) node.farge = blandBarnasFarger(kode)
})
Object.keys(data).forEach(kode => {
  const node = data[kode]
  if (!node.farge) node.farge = brukOverordnetsFarge(kode)
})

function brukOverordnetsFarge(kode) {
  while (foreldre[kode]) {
    kode = foreldre[kode]
    const node = data[kode]
    if (node.farge) return node.farge
  }
}

io.skrivDatafil(__filename, data)

function blandBarnasFarger(kode) {
  const node = data[kode]
  if (node.farge) return node.farge
  const farger = []
  const barna = barnAv[kode]
  if (barna)
    barna.forEach(bk => {
      const farge = data[bk].farge ? data[bk].farge : blandBarnasFarger(bk)
      if (farge) farger.push({ farge: farge })
    })
  if (farger.length === 0 && node.gradient) {
    Object.keys(node.gradient).forEach(relasjon => {
      node.gradient[relasjon].trinn.forEach(bk => {
        if (bk.farge) farger.push({ farge: bk.farge })
      })
    })
  }
  if (farger.length === 0) return null
  node.farge = blandFarger(farger)
  return node.farge
}

function trickleColorsUp() {
  const blends = {}
  Object.keys(farger).forEach(kode => {
    const farge_og_vekt = farger[kode]
    const node = data[kode]
    if (!node) return log.warn("Har farge for ukjent kode " + kode)
    if (!node.farge) {
      node.farge = farge_og_vekt.farge
    }
    node.foreldre.forEach(fkode => {
      const forelder = data[fkode]
      if (!farger[fkode]) {
        if (!blends[fkode]) blends[fkode] = []
        blends[fkode].push({ kode: kode, ...farge_og_vekt })
      }
    })
  })

  Object.keys(blends).forEach(kode => {
    const blend = blends[kode]
    const node = data[kode]
    farger[kode] = { farge: blandFarger(blend) }
  })
  return Object.keys(blends).length > 0
}

function gradientrampe(farge0, farge, barnkoder) {
  const f1 = new tinycolor(farge0)
  const f = new tinycolor(farge)
  for (let i = 0; i < barnkoder.length; i++) {
    const barnkode = barnkoder[i]
    const node = data[barnkode]
    if (!node.farge) {
      if (!f1 || !f)
        throw new Error(
          "Mangler farge eller farge0 for forelder av " + barnkode
        )
      const color = tinycolor.mix(f1, f, (100 * i) / (barnkoder.length - 1))
      node.farge = node.farge || color.toHexString()
    }
  }
}

function settFargePåGradienter() {
  Object.keys(data).forEach(kode => {
    const node = data[kode]
    if (!node.gradient) return
    Object.keys(node.gradient).forEach(type => {
      const grad = node.gradient[type]
      grad.trinn.forEach(
        trinn => (trinn.farge = trinn.farge || data[trinn.kode].farge)
      )
    })
  })
}

function settFargePåFlagg() {
  Object.keys(data).forEach(skode => {
    const node = data[skode]
    if (!node.flagg) return
    Object.keys(node.flagg).forEach(kode => {
      node.flagg[kode].farge = data[kode].farge
    })
  })
}
